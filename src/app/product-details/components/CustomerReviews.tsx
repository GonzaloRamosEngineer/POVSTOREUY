import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Review {
  id: string;
  author: string;
  authorImage: string;
  authorImageAlt: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface CustomerReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export default function CustomerReviews({
  reviews,
  averageRating,
  totalReviews,
}: CustomerReviewsProps) {
  return (
    <div className="bg-card rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            Reseñas de Clientes
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  name="StarIcon"
                  size={20}
                  variant={i < Math.floor(averageRating) ? 'solid' : 'outline'}
                  className={i < Math.floor(averageRating) ? 'text-accent' : 'text-muted-foreground'}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} de 5 ({totalReviews} reseñas)
            </span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-muted rounded-md space-y-3"
          >
            {/* Reviewer Info */}
            <div className="flex items-start gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-background">
                <AppImage
                  src={review.authorImage}
                  alt={review.authorImageAlt}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {review.author}
                  </p>
                  {review.verified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-success/10 rounded-full">
                      <Icon name="CheckBadgeIcon" size={12} className="text-success" variant="solid" />
                      <span className="text-xs text-success">Verificado</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Icon
                        key={i}
                        name="StarIcon"
                        size={14}
                        variant={i < review.rating ? 'solid' : 'outline'}
                        className={i < review.rating ? 'text-accent' : 'text-muted-foreground'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {review.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}