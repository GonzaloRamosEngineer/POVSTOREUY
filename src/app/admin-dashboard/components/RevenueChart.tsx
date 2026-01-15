'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/AppIcon';

interface ChartData {
  name: string;
  ventas: number;
}

interface RevenueChartProps {
  dailyData: ChartData[];
  weeklyData: ChartData[];
  monthlyData: ChartData[];
}

export default function RevenueChart({ dailyData, weeklyData, monthlyData }: RevenueChartProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getData = () => {
    switch (period) {
      case 'daily':
        return dailyData;
      case 'weekly':
        return weeklyData;
      case 'monthly':
        return monthlyData;
      default:
        return dailyData;
    }
  };

  const getPeriodText = () => {
    switch (period) {
      case 'daily':
        return 'Últimos 7 días';
      case 'weekly':
        return 'Últimas 4 semanas';
      case 'monthly':
        return 'Últimos 6 meses';
      default:
        return '';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 card-elevation">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Icon name="ChartBarIcon" size={24} className="text-primary" variant="solid" />
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">Ingresos</h3>
            <p className="text-sm text-muted-foreground">{getPeriodText()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-smooth focus-ring ${
              period === 'daily' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-smooth focus-ring ${
              period === 'weekly' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-smooth focus-ring ${
              period === 'monthly' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      <div className="w-full h-80" aria-label="Gráfico de ingresos por período">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={getData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#F1F5F9',
              }}
              formatter={(value: number) => [`$${value.toLocaleString('es-UY')}`, 'Ventas']}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Legend
              wrapperStyle={{ color: '#94A3B8', fontSize: '14px' }}
              formatter={() => 'Ventas (UYU)'}
            />
            <Bar dataKey="ventas" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}