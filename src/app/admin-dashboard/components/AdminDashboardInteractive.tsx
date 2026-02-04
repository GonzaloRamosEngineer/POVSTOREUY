'use client';

import { useEffect, useMemo, useState } from 'react';
import MetricCard from './MetricCard';
import OrdersTable from './OrdersTable';
import InventoryAlerts from './InventoryAlerts';
import RevenueChart from './RevenueChart';
import PaymentMonitoring from './PaymentMonitoring';
import QuickActions from './QuickActions';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

// Tipos sincronizados con el flujo de despacho
type OrderStatus = 'pending' | 'completed' | 'processing' | 'cancelled' | 'ready' | 'shipped';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  order_status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  created_at: string;
  shipping_address: string | null; // ✅ AGREGADO
}

interface OrderItemRow {
  order_id: string;
  product_name: string;
  product_model: string;
  quantity: number;
  unit_price: number;
}

interface ProductRow {
  id: string;
  name: string;
  model: string;
  stock_count: number;
  is_active: boolean;
}

interface UserProfileRow {
  id: string;
  role: 'customer' | 'admin';
  email: string;
  full_name: string;
}

interface OrderUI {
  id: string;
  order_number: string;
  customer: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product: string;
  amount: number;
  total: number;
  status: OrderStatus;
  order_status: OrderStatus;
  paymentMethod: string;
  payment_method: string;
  paymentStatus: PaymentStatus;
  payment_status: PaymentStatus;
  date: string;
  created_at: string;
  shipping_address: string; // ✅ AGREGADO para que OrdersTable lo reciba
}

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  status: 'critical' | 'low' | 'normal';
}

interface Payment {
  id: string;
  customer: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

interface ChartData {
  name: string;
  ventas: number;
}

interface Action {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

function formatUYDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getWeekKey(d: Date) {
  const day = d.getDate();
  const week = Math.ceil(day / 7);
  return `Sem ${week}`;
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

function toCurrencyUYU(n: number) {
  const rounded = Math.round(n);
  return `$${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export default function AdminDashboardInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isAuthedAdmin, setIsAuthedAdmin] = useState<boolean | null>(null);
  const [authMessage, setAuthMessage] = useState<string>('');

  const [orders, setOrders] = useState<OrderUI[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);

  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    pendingPaid: 0,
    pendingUnpaid: 0,
    revenue: 0,
    stockTotal: 0,
    conversionRate: 0,
    changeOrders: 0,
    changeRevenue: 0,
    changeStock: 0,
    changeConversion: 0,
  });

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const quickActions: Action[] = useMemo(
    () => [
      { id: 'action-1', title: 'Gestionar Inventario', description: 'Actualizar stock y productos', icon: 'CubeIcon', color: 'bg-primary' },
      { id: 'action-2', title: 'Plantillas Email', description: 'Personalizar confirmaciones', icon: 'EnvelopeIcon', color: 'bg-accent' },
      { id: 'action-3', title: 'Analíticas', description: 'Ver métricas detalladas', icon: 'ChartBarIcon', color: 'bg-success' },
      { id: 'action-4', title: 'Configuración', description: 'Ajustes del sistema', icon: 'Cog6ToothIcon', color: 'bg-secondary' },
    ],
    []
  );

  async function verifyAdmin() {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setIsAuthedAdmin(false);
      setAuthMessage('No se pudo validar la sesión.');
      return;
    }
    const user = userData?.user;
    if (!user) {
      setIsAuthedAdmin(false);
      setAuthMessage('Necesitás iniciar sesión como admin.');
      return;
    }
    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single();
    if (pErr || !profile) {
      setIsAuthedAdmin(false);
      setAuthMessage('No se pudo obtener tu perfil.');
      return;
    }
    const prof = profile as UserProfileRow;
    if (prof.role !== 'admin') {
      setIsAuthedAdmin(false);
      setAuthMessage('Tu usuario no tiene rol admin.');
      return;
    }
    setIsAuthedAdmin(true);
    setAuthMessage('');
  }

  async function refreshOnlyOrders(): Promise<void> {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 30);

    // ✅ CORREGIDO: Agregado shipping_address al SELECT
    const { data: orderRows, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, customer_phone, total, order_status, payment_method, payment_status, created_at, shipping_address')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    if (oErr) return;
    const o = (orderRows || []) as OrderRow[];

    const orderIds = o.map((x) => x.id);
    const itemsByOrder = new Map<string, OrderItemRow[]>();

    if (orderIds.length) {
      const { data: itemRows } = await supabase
        .from('order_items')
        .select('order_id, product_name, product_model, quantity, unit_price')
        .in('order_id', orderIds);
      
      (itemRows || []).forEach((it: any) => {
        const prev = itemsByOrder.get(it.order_id) || [];
        itemsByOrder.set(it.order_id, [...prev, it]);
      });
    }

    const mappedOrders: OrderUI[] = o.map((row) => {
      const its = itemsByOrder.get(row.id) || [];
      let productLabel = its.length > 0 
        ? `${its[0].product_name}${its[0].product_model ? ` - ${its[0].product_model}` : ''}${its.length > 1 ? ` (+${its.length - 1})` : ''}`
        : '—';

      return {
        id: row.id, 
        customer: row.customer_name, 
        email: row.customer_email, 
        product: productLabel,
        amount: Number(row.total || 0), 
        status: row.order_status, 
        date: formatUYDate(row.created_at),
        order_number: row.order_number, 
        customer_name: row.customer_name, 
        customer_email: row.customer_email,
        customer_phone: row.customer_phone, 
        total: Number(row.total || 0), 
        order_status: row.order_status,
        payment_method: row.payment_method, 
        paymentMethod: row.payment_method === 'mercadopago' ? 'MercadoPago' : 'Transferencia',
        payment_status: row.payment_status, 
        paymentStatus: row.payment_status, 
        created_at: row.created_at,
        shipping_address: row.shipping_address || '' // ✅ CORREGIDO: Incluido en el mapeo
      };
    });

    setOrders(mappedOrders);
    
    // Cálculos de métricas de órdenes
    const completedCount = mappedOrders.filter(x => x.status === 'completed').length;
    const pendingTotal = mappedOrders.filter(x => x.status === 'pending');
    const pendingPaid = pendingTotal.filter(x => x.paymentStatus === 'completed').length;
    const pendingUnpaid = pendingTotal.filter(x => x.paymentStatus !== 'completed').length;
    
    setMetrics(prev => ({
      ...prev,
      totalOrders: mappedOrders.length,
      completedOrders: completedCount,
      pendingOrders: pendingTotal.length,
      pendingPaid,
      pendingUnpaid,
      revenue: sum(mappedOrders.filter(x => x.paymentStatus === 'completed').map(x => x.amount))
    }));
  }

  async function loadDashboardData() {
    setLoading(true);
    try {
      const now = new Date();
      await refreshOnlyOrders();

      // Cargar Productos / Inventario
      const { data: productRows } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('stock_count', { ascending: true });
      
      const p = (productRows || []) as ProductRow[];
      setMetrics(prev => ({ ...prev, stockTotal: sum(p.map(x => Number(x.stock_count || 0))) }));

      setInventory(p.slice(0, 20).map(prod => ({
        id: prod.id,
        name: `${prod.name}${prod.model ? ` - ${prod.model}` : ''}`,
        stock: prod.stock_count,
        threshold: 10,
        status: prod.stock_count <= 5 ? 'critical' : prod.stock_count <= 10 ? 'low' : 'normal'
      })));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Efecto para actualizar componentes derivados cuando cambian las órdenes
  useEffect(() => {
    if (orders.length === 0) return;

    // Actualizar Monitoreo de Pagos
    setPayments(orders.slice(0, 20).map(row => ({
      id: row.order_number,
      customer: row.customer,
      amount: row.amount,
      method: row.paymentMethod,
      status: row.paymentStatus === 'completed' ? 'completed' : row.paymentStatus === 'failed' ? 'failed' : 'pending',
      date: row.date
    })));

    // RE-CALCULAR GRÁFICOS (Ingresos Reales)
    const now = new Date();
    const day0 = startOfDay(now);
    const completedOrders = orders.filter(o => o.paymentStatus === 'completed');

    // 1. Daily (7 días)
    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(day0); d.setDate(day0.getDate() - i);
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }
    completedOrders.forEach(row => {
      const key = row.created_at.slice(0, 10);
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + row.amount);
    });
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    setDailyData(Array.from(dailyMap.entries()).map(([k, v]) => ({ name: dayNames[new Date(k).getDay()], ventas: v })));

    // 2. Weekly (Mes actual)
    const monthStart = startOfMonth(now);
    const weeklyMap = new Map<string, number>([['Sem 1', 0], ['Sem 2', 0], ['Sem 3', 0], ['Sem 4', 0], ['Sem 5', 0]]);
    completedOrders.filter(o => new Date(o.created_at) >= monthStart).forEach(row => {
      const key = getWeekKey(new Date(row.created_at));
      if (weeklyMap.has(key)) weeklyMap.set(key, weeklyMap.get(key)! + row.amount);
    });
    setWeeklyData(Array.from(weeklyMap.entries()).map(([name, ventas]) => ({ name, ventas })));

    // 3. Monthly (6 meses)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthsMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(day0); d.setMonth(day0.getMonth() - i);
      monthsMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    completedOrders.forEach(row => {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap.has(key)) monthsMap.set(key, monthsMap.get(key)! + row.amount);
    });
    setMonthlyData(Array.from(monthsMap.entries()).map(([k, v]) => ({ name: monthNames[Number(k.split('-')[1]) - 1], ventas: v })));

  }, [orders]);

  useEffect(() => {
    if (!isHydrated) return;
    (async () => { try { await verifyAdmin(); } catch (e) { setIsAuthedAdmin(false); } })();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated || isAuthedAdmin !== true) return;
    loadDashboardData().catch(() => setLoading(false));
  }, [isHydrated, isAuthedAdmin]);

  if (!isHydrated) return null;

  if (isAuthedAdmin === false) {
    return (
      <div className="bg-card rounded-lg p-6 text-center border border-border">
        <h3 className="text-lg font-bold mb-2">Acceso restringido</h3>
        <p className="text-sm text-muted-foreground">{authMessage}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas Operativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Volumen Total" value={String(metrics.totalOrders)} change={12.5} icon="ShoppingBagIcon" trend="up" />
        <MetricCard title="Pendientes (SIN PAGO)" value={String(metrics.pendingUnpaid)} change={0} icon="ClockIcon" trend="down" />
        <MetricCard title="Pendientes (PAGADOS)" value={String(metrics.pendingPaid)} change={0} icon="CurrencyDollarIcon" trend="up" />
        <MetricCard title="Pedidos Entregados" value={String(metrics.completedOrders)} change={0} icon="CheckBadgeIcon" trend="up" />
        
      </div>

      {/* Métricas de Negocio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <MetricCard title="Caja Real (UYU)" value={toCurrencyUYU(metrics.revenue)} change={8.2} icon="CurrencyDollarIcon" trend="up" />
        <MetricCard title="Stock Total" value={String(metrics.stockTotal)} change={-2.4} icon="CubeIcon" trend="down" />
        <MetricCard title="Tasa Conversión" value={`${((metrics.completedOrders / (metrics.totalOrders || 1)) * 100).toFixed(1)}%`} change={1.2} icon="ChartBarIcon" trend="up" />
      </div>

      {/* Gráficos de Ingresos (Daily/Weekly/Monthly) */}
      <RevenueChart dailyData={dailyData} weeklyData={weeklyData} monthlyData={monthlyData} />

      {/* Tabla de Pedidos Recientes */}
      <div className="bg-card rounded-lg p-6 card-elevation border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">Pedidos Recientes</h3>
          <span className="text-sm text-muted-foreground">Últimos 30 días</span>
        </div>
        <OrdersTable orders={orders as any} onRefresh={refreshOnlyOrders} />
      </div>

      {/* Inventario y Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAlerts items={inventory} />
        <PaymentMonitoring payments={payments} />
      </div>

      <QuickActions actions={quickActions} />
    </div>
  );
}