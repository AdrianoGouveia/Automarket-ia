import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

interface ReviewsProps {
  sellerId: number;
  carId?: number;
}

export default function Reviews({ sellerId, carId }: ReviewsProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: reviewsData, refetch } = trpc.reviewsRouter.getBySeller.useQuery({
    sellerId,
    limit: 10,
  });

  const createReview = trpc.reviewsRouter.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      setRating(0);
      setComment("");
      setShowForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar avaliação");
    },
  });

  const handleSubmit = () => {
    if (!user) {
      toast.error("Você precisa estar logado para avaliar");
      return;
    }

    if (rating === 0) {
      toast.error("Selecione uma classificação");
      return;
    }

    if (!carId) {
      toast.error("ID do veículo não fornecido");
      return;
    }

    createReview.mutate({
      carId,
      sellerId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {reviewsData?.avgRating.toFixed(1) || "0.0"}
            </div>
            <div className="flex justify-center my-2">
              {renderStars(Math.round(reviewsData?.avgRating || 0))}
            </div>
            <p className="text-sm text-muted-foreground">
              {reviewsData?.total || 0} avaliações
            </p>
          </div>

          <div className="flex-1">
            {user && carId && (
              <Button
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
                className="w-full"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {showForm ? "Cancelar" : "Avaliar Vendedor"}
              </Button>
            )}
          </div>
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sua Classificação
              </label>
              {renderStars(rating, true)}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Comentário (opcional)
              </label>
              <Textarea
                placeholder="Compartilhe sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {comment.length}/500 caracteres
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || createReview.isPending}
              className="w-full"
            >
              {createReview.isPending ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        )}
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Avaliações dos Clientes</h3>

        {reviewsData && reviewsData.data.length > 0 ? (
          reviewsData.data.map((review: any) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Usuário #{review.reviewerId}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
