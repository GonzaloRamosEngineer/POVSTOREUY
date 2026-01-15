'use client';

import Icon from '@/components/ui/AppIcon';

interface Action {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface QuickActionsProps {
  actions: Action[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const handleActionClick = (actionId: string) => {
    console.log(`Action clicked: ${actionId}`);
  };

  return (
    <div className="bg-card rounded-lg p-6 card-elevation">
      <div className="flex items-center gap-3 mb-6">
        <Icon name="BoltIcon" size={24} className="text-primary" variant="solid" />
        <h3 className="text-lg font-heading font-semibold text-foreground">Acciones Rápidas</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id)}
            className="flex items-start gap-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-smooth focus-ring text-left"
          >
            <div className={`flex items-center justify-center w-10 h-10 ${action.color} rounded-lg flex-shrink-0`}>
              <Icon name={action.icon as any} size={20} className="text-white" variant="solid" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground mb-1">{action.title}</h4>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}