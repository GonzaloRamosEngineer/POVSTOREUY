'use client';

import { useEffect, useMemo, useState } from 'react';
import MetricCard from './MetricCard';
import OrdersTable from './OrdersTable';
import InventoryAlerts from './InventoryAlerts';
import RevenueChart from './RevenueChart';
import PaymentMonitoring from './PaymentMonitoring';
import QuickActions from './QuickActions';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

type OrderStatus = 'pending' | 'completed' | 'processing' | 'cancelled';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  order_status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  created_at: string;
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

interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  status: OrderStatus;
  paymentMethod: string;
  date: string;
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

  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);

  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    revenue: 0,
    stockTotal: 0,
    conversionRate: 0,
    changeOrders: 0,
    changeRevenue: 0,
    changeStock: 0,
    changeConversion: 0,
  });

  // ✅ Crear 1 solo cliente para todo el dashboard
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const quickActions: Action[] = useMemo(
    () => [
      {
        id: 'action-1',
        title: 'Gestionar Inventario',
        description: 'Actualizar stock y productos',
        icon: 'CubeIcon',
        color: 'bg-primary',
      },
      {
        id: 'action-2',
        title: 'Plantillas Email',
        description: 'Personalizar confirmaciones',
        icon: 'EnvelopeIcon',
        color: 'bg-accent',
      },
      {
        id: 'action-3',
        title: 'Analíticas',
        description: 'Ver métricas detalladas',
        icon: 'ChartBarIcon',
        color: 'bg-success',
      },
      {
        id: 'action-4',
        title: 'Configuración',
        description: 'Ajustes del sistema',
        icon: 'Cog6ToothIcon',
        color: 'bg-secondary',
      },
    ],
    []
  );

  async function verifyAdmin() {
    // 1) validar sesión
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setIsAuthedAdmin(false);
      setAuthMessage('No se pudo validar la sesión. Iniciá sesión nuevamente.');
      return;
    }

    const user = userData?.user;
    if (!user) {
      setIsAuthedAdmin(false);
      setAuthMessage('Necesitás iniciar sesión como admin para acceder al panel.');
      return;
    }

    // 2) validar rol admin en user_profiles (RLS: el admin puede leer todo; usuario normal solo su fila)
    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single();

    if (pErr || !profile) {
      setIsAuthedAdmin(false);
      setAuthMessage('No se pudo obtener tu perfil. Revisá user_profiles + RLS.');
      return;
    }

    const prof = profile as UserProfileRow;
    if (prof.role !== 'admin') {
      setIsAuthedAdmin(false);
      setAuthMessage('Tu usuario está autenticado, pero no tiene rol admin.');
      return;
    }

    setIsAuthedAdmin(true);
    setAuthMessage('');
  }

  async function loadDashboardData() {
    setLoading(true);

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 30);

    // 1) orders (últimos 30 días)
    const { data: orderRows, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, total, order_status, payment_method, payment_status, created_at')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    if (oErr) throw new Error(`Error cargando orders: ${oErr.message}`);

    const o = (orderRows || []) as OrderRow[];

    // 2) order_items para label de producto en la tabla
    const orderIds = o.map((x) => x.id);
    const itemsByOrder = new Map<string, OrderItemRow[]>();

    if (orderIds.length) {
      const { data: itemRows, error: iErr } = await supabase
        .from('order_items')
        .select('order_id, product_name, product_model, quantity, unit_price')
        .in('order_id', orderIds);

      if (iErr) throw new Error(`Error cargando order_items: ${iErr.message}`);

      const items = (itemRows || []) as OrderItemRow[];
      for (const it of items) {
        const prev = itemsByOrder.get(it.order_id) || [];
        prev.push(it);
        itemsByOrder.set(it.order_id, prev);
      }
    }

    // 3) products (inventario)
    const { data: productRows, error: prErr } = await supabase
      .from('products')
      .select('id, name, model, stock_count, is_active')
      .eq('is_active', true)
      .order('stock_count', { ascending: true });

    if (prErr) throw new Error(`Error cargando products: ${prErr.message}`);

    const p = (productRows || []) as ProductRow[];

    // ===== UI: Orders =====
    const uiOrders: Order[] = o.slice(0, 50).map((row) => {
      const its = itemsByOrder.get(row.id) || [];
      let productLabel = '—';

      if (its.length === 1) {
        productLabel = `${its[0].product_name}${its[0].product_model ? ` - ${its[0].product_model}` : ''}`;
      } else if (its.length > 1) {
        productLabel = `${its[0].product_name}${its[0].product_model ? ` - ${its[0].product_model}` : ''} (+${its.length - 1})`;
      }

      return {
        id: row.order_number || row.id,
        customer: row.customer_name,
        email: row.customer_email,
        product: productLabel,
        amount: Number(row.total || 0),
        status: row.order_status,
        paymentMethod: row.payment_method === 'mercadopago' ? 'MercadoPago' : 'Transferencia',
        date: formatUYDate(row.created_at),
      };
    });

    // ===== UI: Inventory =====
    const thresholdCritical = 5;
    const thresholdLow = 10;

    const uiInventory: InventoryItem[] = p.slice(0, 20).map((prod) => {
      const stock = Number(prod.stock_count || 0);
      let status: InventoryItem['status'] = 'normal';
      let threshold = thresholdLow;

      if (stock <= thresholdCritical) {
        status = 'critical';
        threshold = thresholdCritical;
      } else if (stock <= thresholdLow) {
        status = 'low';
        threshold = thresholdLow;
      }

      return {
        id: prod.id,
        name: `${prod.name}${prod.model ? ` - ${prod.model}` : ''}`,
        stock,
        threshold,
        status,
      };
    });

    // ===== UI: Payments (derivado de orders) =====
    const uiPayments: Payment[] = o.slice(0, 20).map((row) => {
      let status: Payment['status'] = 'pending';
      if (row.payment_status === 'completed') status = 'completed';
      else if (row.payment_status === 'failed') status = 'failed';
      else status = 'pending';

      return {
        id: row.order_number || row.id,
        customer: row.customer_name,
        amount: Number(row.total || 0),
        method: row.payment_method === 'mercadopago' ? 'MercadoPago' : 'Transferencia Bancaria',
        status,
        date: formatUYDate(row.created_at),
      };
    });

    // ===== Metrics =====
    const totalOrders = o.length;
    const completedOrders = o.filter((x) => x.payment_status === 'completed').length;
    const revenue = sum(o.filter((x) => x.payment_status === 'completed').map((x) => Number(x.total || 0)));
    const stockTotal = sum(p.map((x) => Number(x.stock_count || 0)));
    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Cambios 7 días vs 7 días previos (solo con orders)
    const day0 = startOfDay(new Date());
    const last7Start = new Date(day0);
    last7Start.setDate(day0.getDate() - 7);
    const prev7Start = new Date(day0);
    prev7Start.setDate(day0.getDate() - 14);

    const inRange = (iso: string, a: Date, b: Date) => {
      const t = new Date(iso).getTime();
      return t >= a.getTime() && t < b.getTime();
    };

    const last7 = o.filter((x) => inRange(x.created_at, last7Start, day0));
    const prev7 = o.filter((x) => inRange(x.created_at, prev7Start, last7Start));

    const last7Count = last7.length;
    const prev7Count = prev7.length;
    const changeOrders = prev7Count > 0 ? ((last7Count - prev7Count) / prev7Count) * 100 : last7Count > 0 ? 100 : 0;

    const last7Revenue = sum(last7.filter((x) => x.payment_status === 'completed').map((x) => Number(x.total || 0)));
    const prev7Revenue = sum(prev7.filter((x) => x.payment_status === 'completed').map((x) => Number(x.total || 0)));
    const changeRevenue = prev7Revenue > 0 ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100 : last7Revenue > 0 ? 100 : 0;

    // Stock change real requiere inventory_logs (no lo inventamos)
    const changeStock = 0;

    const last7CompletedRate = last7Count > 0 ? (last7.filter((x) => x.payment_status === 'completed').length / last7Count) * 100 : 0;
    const prev7CompletedRate = prev7Count > 0 ? (prev7.filter((x) => x.payment_status === 'completed').length / prev7Count) * 100 : 0;
    const changeConversion = prev7CompletedRate > 0 ? ((last7CompletedRate - prev7CompletedRate) / prev7CompletedRate) * 100 : last7CompletedRate > 0 ? 100 : 0;

    // ===== Charts (Revenue only, payment_status = completed) =====
    const completed = o.filter((x) => x.payment_status === 'completed');

    // Daily (últimos 7 días)
    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(day0);
      d.setDate(day0.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, 0);
    }
    for (const row of completed) {
      const d = startOfDay(new Date(row.created_at));
      const key = d.toISOString().slice(0, 10);
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + Number(row.total || 0));
    }
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const uiDaily: ChartData[] = Array.from(dailyMap.entries()).map(([isoDay, v]) => {
      const d = new Date(isoDay);
      return { name: dayNames[d.getDay()], ventas: Math.round(v) };
    });

    // Weekly (semanas del mes actual)
    const monthStart = startOfMonth(now);
    const weeklyMap = new Map<string, number>([
      ['Sem 1', 0],
      ['Sem 2', 0],
      ['Sem 3', 0],
      ['Sem 4', 0],
      ['Sem 5', 0],
    ]);
    for (const row of completed) {
      const d = new Date(row.created_at);
      if (d >= monthStart) {
        const key = getWeekKey(d);
        weeklyMap.set(key, (weeklyMap.get(key) || 0) + Number(row.total || 0));
      }
    }
    const uiWeekly: ChartData[] = Array.from(weeklyMap.entries()).map(([name, v]) => ({
      name,
      ventas: Math.round(v),
    }));

    // Monthly (últimos 6 meses)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthsMap = new Map<string, number>();
    const base = new Date(now);
    base.setDate(1);
    base.setHours(0, 0, 0, 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(base);
      d.setMonth(base.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, 0);
    }
    for (const row of completed) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap.has(key)) monthsMap.set(key, (monthsMap.get(key) || 0) + Number(row.total || 0));
    }
    const uiMonthly: ChartData[] = Array.from(monthsMap.entries()).map(([key, v]) => {
      const [, mm] = key.split('-');
      const monthIndex = Number(mm) - 1;
      return { name: monthNames[monthIndex], ventas: Math.round(v) };
    });

    // Set state
    setOrders(uiOrders);
    setInventory(uiInventory);
    setPayments(uiPayments);

    setDailyData(uiDaily);
    setWeeklyData(uiWeekly);
    setMonthlyData(uiMonthly);

    setMetrics({
      totalOrders,
      revenue,
      stockTotal,
      conversionRate,
      changeOrders,
      changeRevenue,
      changeStock,
      changeConversion,
    });

    setLoading(false);
  }

  useEffect(() => {
    if (!isHydrated) return;

    (async () => {
      try {
        await verifyAdmin();
      } catch (e) {
        console.error(e);
        setIsAuthedAdmin(false);
        setAuthMessage('Error inesperado validando el acceso.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthedAdmin !== true) return;

    (async () => {
      try {
        await loadDashboardData();
      } catch (e: any) {
        console.error(e);
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, isAuthedAdmin]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthedAdmin === false) {
    return (
      <div className="bg-card rounded-lg p-6 card-elevation">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-2">Acceso restringido</h3>
        <p className="text-sm text-muted-foreground">{authMessage || 'No tenés permisos para ver este panel.'}</p>
        <div className="mt-4 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>Iniciar sesión con Supabase Auth</li>
            <li>Tener <code className="px-1 py-0.5 bg-muted rounded">user_profiles.role = 'admin'</code></li>
          </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
        <div className="h-72 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Pedidos"
          value={String(metrics.totalOrders)}
          change={Number(metrics.changeOrders.toFixed(1))}
          icon="ShoppingBagIcon"
          trend={metrics.changeOrders >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Ingresos (UYU)"
          value={toCurrencyUYU(metrics.revenue)}
          change={Number(metrics.changeRevenue.toFixed(1))}
          icon="CurrencyDollarIcon"
          trend={metrics.changeRevenue >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Stock Total"
          value={String(metrics.stockTotal)}
          change={Number(metrics.changeStock.toFixed(1))}
          icon="CubeIcon"
          trend={metrics.changeStock >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Tasa Conversión"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          change={Number(metrics.changeConversion.toFixed(1))}
          icon="ChartBarIcon"
          trend={metrics.changeConversion >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart dailyData={dailyData} weeklyData={weeklyData} monthlyData={monthlyData} />

      {/* Orders Table */}
      <div className="bg-card rounded-lg p-6 card-elevation">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">Pedidos Recientes</h3>
          <span className="text-sm text-muted-foreground">Últimos 30 días</span>
        </div>
        <OrdersTable orders={orders} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAlerts items={inventory} />
        <PaymentMonitoring payments={payments} />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />
    </div>
  );
}
