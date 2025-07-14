import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type VideoWithCategory } from "@shared/schema";

interface VideoRatingProps {
  video: VideoWithCategory;
  userRating?: number;
  onRatingSubmit?: () => void;
}

export function VideoRating({ video, userRating, onRatingSubmit }: VideoRatingProps) {
  const [rating, setRating] = useState(userRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; review?: string }) => {
      return await apiRequest("POST", `/api/videos/${video.id}/rating`, data);
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      onRatingSubmit?.();
      setShowReviewForm(false);
      setReview("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
    if (starRating > 0) {
      setShowReviewForm(true);
    }
  };

  const handleSubmit = () => {
    if (rating > 0) {
      ratingMutation.mutate({ rating, review: review.trim() || undefined });
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          {isActive ? (
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          ) : (
            <StarOff className="h-6 w-6 text-gray-300" />
          )}
        </button>
      );
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Rate this video</span>
          <div className="flex items-center gap-2">
            {video.averageRating && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {video.averageRating.toFixed(1)} ({video.totalRatings} reviews)
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-1">
          {renderStars()}
          <span className="ml-2 text-sm text-gray-600">
            {rating > 0 ? `${rating} out of 5 stars` : "Click to rate"}
          </span>
        </div>

        {showReviewForm && (
          <div className="space-y-3">
            <Textarea
              placeholder="Write a review (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || ratingMutation.isPending}
                size="sm"
              >
                Submit Rating
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(userRating || 0);
                  setReview("");
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}