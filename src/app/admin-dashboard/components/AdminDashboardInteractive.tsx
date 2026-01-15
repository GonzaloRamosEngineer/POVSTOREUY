'use client';

import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import OrdersTable from './OrdersTable';
import InventoryAlerts from './InventoryAlerts';
import RevenueChart from './RevenueChart';
import PaymentMonitoring from './PaymentMonitoring';
import QuickActions from './QuickActions';

interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  status: 'pending' | 'completed' | 'processing' | 'cancelled';
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

export default function AdminDashboardInteractive() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const mockOrders: Order[] = [
    {
      id: '1001',
      customer: 'María González',
      email: 'maria.gonzalez@email.com',
      product: 'POV Cámara Pro',
      amount: 8500,
      status: 'completed',
      paymentMethod: 'MercadoPago',
      date: '13/01/2026',
    },
    {
      id: '1002',
      customer: 'Juan Rodríguez',
      email: 'juan.rodriguez@email.com',
      product: 'POV Cámara Básico',
      amount: 5500,
      status: 'processing',
      paymentMethod: 'Transferencia',
      date: '13/01/2026',
    },
    {
      id: '1003',
      customer: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      product: 'POV Cámara Pro',
      amount: 8500,
      status: 'pending',
      paymentMethod: 'Transferencia',
      date: '12/01/2026',
    },
    {
      id: '1004',
      customer: 'Carlos López',
      email: 'carlos.lopez@email.com',
      product: 'POV Cámara Básico',
      amount: 5500,
      status: 'completed',
      paymentMethod: 'MercadoPago',
      date: '12/01/2026',
    },
    {
      id: '1005',
      customer: 'Laura Fernández',
      email: 'laura.fernandez@email.com',
      product: 'POV Cámara Pro',
      amount: 8500,
      status: 'cancelled',
      paymentMethod: 'MercadoPago',
      date: '11/01/2026',
    },
  ];

  const mockInventory: InventoryItem[] = [
    {
      id: 'inv-001',
      name: 'POV Cámara Pro',
      stock: 3,
      threshold: 5,
      status: 'critical',
    },
    {
      id: 'inv-002',
      name: 'POV Cámara Básico',
      stock: 8,
      threshold: 10,
      status: 'low',
    },
    {
      id: 'inv-003',
      name: 'Accesorios POV',
      stock: 25,
      threshold: 15,
      status: 'normal',
    },
  ];

  const mockPayments: Payment[] = [
    {
      id: 'pay-001',
      customer: 'María González',
      amount: 8500,
      method: 'MercadoPago',
      status: 'completed',
      date: '13/01/2026',
    },
    {
      id: 'pay-002',
      customer: 'Juan Rodríguez',
      amount: 5500,
      method: 'Transferencia Bancaria',
      status: 'pending',
      date: '13/01/2026',
    },
    {
      id: 'pay-003',
      customer: 'Ana Martínez',
      amount: 8500,
      method: 'Transferencia Bancaria',
      status: 'pending',
      date: '12/01/2026',
    },
    {
      id: 'pay-004',
      customer: 'Carlos López',
      amount: 5500,
      method: 'MercadoPago',
      status: 'completed',
      date: '12/01/2026',
    },
    {
      id: 'pay-005',
      customer: 'Laura Fernández',
      amount: 8500,
      method: 'MercadoPago',
      status: 'failed',
      date: '11/01/2026',
    },
  ];

  const dailyChartData: ChartData[] = [
    { name: 'Lun', ventas: 12000 },
    { name: 'Mar', ventas: 19000 },
    { name: 'Mié', ventas: 15000 },
    { name: 'Jue', ventas: 22000 },
    { name: 'Vie', ventas: 28000 },
    { name: 'Sáb', ventas: 31000 },
    { name: 'Dom', ventas: 18000 },
  ];

  const weeklyChartData: ChartData[] = [
    { name: 'Sem 1', ventas: 85000 },
    { name: 'Sem 2', ventas: 92000 },
    { name: 'Sem 3', ventas: 78000 },
    { name: 'Sem 4', ventas: 105000 },
  ];

  const monthlyChartData: ChartData[] = [
    { name: 'Ago', ventas: 320000 },
    { name: 'Sep', ventas: 380000 },
    { name: 'Oct', ventas: 350000 },
    { name: 'Nov', ventas: 420000 },
    { name: 'Dic', ventas: 510000 },
    { name: 'Ene', ventas: 145000 },
  ];

  const quickActions: Action[] = [
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
  ];

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

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Pedidos"
          value="127"
          change={12.5}
          icon="ShoppingBagIcon"
          trend="up"
        />
        <MetricCard
          title="Ingresos (UYU)"
          value="$1.245.000"
          change={8.3}
          icon="CurrencyDollarIcon"
          trend="up"
        />
        <MetricCard
          title="Stock Total"
          value="36"
          change={-15.2}
          icon="CubeIcon"
          trend="down"
        />
        <MetricCard
          title="Tasa Conversión"
          value="3.8%"
          change={5.7}
          icon="ChartBarIcon"
          trend="up"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        dailyData={dailyChartData}
        weeklyData={weeklyChartData}
        monthlyData={monthlyChartData}
      />

      {/* Orders Table */}
      <div className="bg-card rounded-lg p-6 card-elevation">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">Pedidos Recientes</h3>
          <span className="text-sm text-muted-foreground">Últimas 24 horas</span>
        </div>
        <OrdersTable orders={mockOrders} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAlerts items={mockInventory} />
        <PaymentMonitoring payments={mockPayments} />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />
    </div>
  );
}