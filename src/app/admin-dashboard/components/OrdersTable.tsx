'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

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

interface OrdersTableProps {
  orders: Order[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'processing':
        return 'bg-accent/10 text-accent';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-error/10 text-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'processing':
        return 'Procesando';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">ID Pedido</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Producto</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Monto</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Estado</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Pago</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
              <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-smooth">
                <td className="py-4 px-4">
                  <span className="text-sm font-mono text-foreground">#{order.id}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{order.customer}</span>
                    <span className="text-xs text-muted-foreground">{order.email}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-foreground">{order.product}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-mono font-medium text-primary">${order.amount.toLocaleString('es-UY')}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-foreground">{order.paymentMethod}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground">{order.date}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-smooth focus-ring"
                      aria-label="Ver detalles del pedido"
                    >
                      <Icon name="EyeIcon" size={18} className="text-foreground" />
                    </button>
                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-smooth focus-ring"
                      aria-label="Editar pedido"
                    >
                      <Icon name="PencilIcon" size={18} className="text-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-card rounded-lg p-4 card-elevation">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <span className="text-xs font-mono text-muted-foreground">#{order.id}</span>
                <h4 className="text-sm font-medium text-foreground mt-1">{order.customer}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{order.email}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Producto:</span>
                <span className="text-sm text-foreground">{order.product}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Monto:</span>
                <span className="text-sm font-mono font-medium text-primary">${order.amount.toLocaleString('es-UY')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pago:</span>
                <span className="text-sm text-foreground">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Fecha:</span>
                <span className="text-sm text-muted-foreground">{order.date}</span>
              </div>
            </div>

            <button
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-smooth focus-ring"
            >
              <Icon name="EyeIcon" size={18} className="text-foreground" />
              <span className="text-sm font-medium text-foreground">
                {expandedOrder === order.id ? 'Ocultar detalles' : 'Ver detalles'}
              </span>
            </button>

            {expandedOrder === order.id && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-smooth focus-ring">
                  <Icon name="PencilIcon" size={18} />
                  <span className="text-sm font-medium">Editar pedido</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md transition-smooth focus-ring">
                  <Icon name="EnvelopeIcon" size={18} />
                  <span className="text-sm font-medium">Contactar cliente</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}