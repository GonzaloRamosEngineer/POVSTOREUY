import Icon from '@/components/ui/AppIcon';

interface Specification {
  icon: string;
  label: string;
  value: string;
}

interface ProductSpecsProps {
  specifications: Specification[];
}

export default function ProductSpecs({ specifications }: ProductSpecsProps) {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        Especificaciones Técnicas
      </h2>

      <div className="space-y-4">
        {specifications.map((spec, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 bg-muted rounded-md hover:bg-muted/80 transition-smooth"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md">
              <Icon
                name={spec.icon as any}
                size={20}
                className="text-primary"
                variant="solid"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {spec.label}
              </p>
              <p className="text-base font-medium text-foreground">
                {spec.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}