import Icon from '@/components/ui/AppIcon';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
  trend: 'up' | 'down';
}

export default function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 card-elevation transition-smooth hover:card-elevation-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-caption text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-heading font-bold text-foreground">{value}</h3>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
          <Icon name={icon as any} size={24} className="text-primary" variant="solid" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Icon
          name={trend === 'up' ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'}
          size={16}
          className={trend === 'up' ? 'text-success' : 'text-error'}
        />
        <span className={`text-sm font-medium ${trend === 'up' ? 'text-success' : 'text-error'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <span className="text-sm text-muted-foreground">vs mes anterior</span>
      </div>
    </div>
  );
}