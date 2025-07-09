import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VideoRating } from "@shared/schema";

interface VideoRatingProps {
  videoId: number;
}

interface RatingStatsProps {
  averageRating: number;
  totalRatings: number;
}

function StarRating({ 
  rating, 
  onRatingChange, 
  interactive = false, 
  size = "h-5 w-5" 
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: string;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (interactive && hoverRating > 0 ? hoverRating : rating);
        return (
          <button
            key={star}
            type="button"
            className={`${
              interactive 
                ? 'hover:scale-110 transition-transform cursor-pointer' 
                : 'cursor-default'
            } ${isActive ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            <Star className={`${size} ${isActive ? 'fill-current' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}

function RatingDistribution({ stats }: { stats: RatingStatsProps }) {
  const { averageRating, totalRatings } = stats;
  
  // Mock distribution for now - in a real app, you'd get this from the API
  const distribution = [
    { stars: 5, count: Math.floor(totalRatings * 0.4) },
    { stars: 4, count: Math.floor(totalRatings * 0.3) },
    { stars: 3, count: Math.floor(totalRatings * 0.2) },
    { stars: 2, count: Math.floor(totalRatings * 0.07) },
    { stars: 1, count: Math.floor(totalRatings * 0.03) },
  ];

  return (
    <div className="space-y-2">
      {distribution.map(({ stars, count }) => {
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
        
        return (
          <div key={stars} className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1 w-12">
              <span>{stars}</span>
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
            </div>
            <div className="flex-1">
              <Progress value={percentage} className="h-2" />
            </div>
            <span className="text-gray-500 w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function VideoRating({ videoId }: VideoRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingRating, setPendingRating] = useState(0);

  const { data: userRating } = useQuery<VideoRating | null>({
    queryKey: [`/api/videos/${videoId}/rating`],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/rating`);
      if (response.status === 401) return null;
      if (!response.ok) throw new Error("Failed to fetch rating");
      const data = await response.json();
      return data || null;
    },
  });

  const { data: ratingStats = { averageRating: 0, totalRatings: 0 } } = useQuery({
    queryKey: [`/api/videos/${videoId}/rating-stats`],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/rating-stats`);
      if (!response.ok) throw new Error("Failed to fetch rating stats");
      return response.json();
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const response = await fetch(`/api/videos/${videoId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error("Failed to submit rating");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/rating-stats`] });
      setPendingRating(0);
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
    },
    onError: () => {
      setPendingRating(0);
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const deleteRatingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/videos/${videoId}/rating`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete rating");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/rating-stats`] });
      toast({
        title: "Success",
        description: "Rating removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove rating",
        variant: "destructive",
      });
    },
  });

  const handleRatingChange = (rating: number) => {
    setPendingRating(rating);
    ratingMutation.mutate(rating);
  };

  const handleRemoveRating = () => {
    deleteRatingMutation.mutate();
  };

  const currentRating = pendingRating || userRating?.rating || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-medium">Ratings & Reviews</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Rating Summary */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {ratingStats.averageRating.toFixed(1)}
            </div>
            <StarRating rating={ratingStats.averageRating} size="h-4 w-4" />
            <div className="text-sm text-gray-500 mt-1">
              {ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? 'rating' : 'ratings'}
            </div>
          </div>
          
          <div className="flex-1">
            <RatingDistribution stats={ratingStats} />
          </div>
        </div>

        {/* User Rating Section */}
        {user ? (
          <div className="border-t pt-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Rate this video</h4>
              <div className="flex items-center space-x-4">
                <StarRating
                  rating={currentRating}
                  onRatingChange={handleRatingChange}
                  interactive={!ratingMutation.isPending}
                  size="h-6 w-6"
                />
                {currentRating > 0 && (
                  <span className="text-sm text-gray-600">
                    {currentRating} out of 5 stars
                  </span>
                )}
              </div>
            </div>
            
            {userRating && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Your rating:</span>
                <StarRating rating={userRating.rating} size="h-4 w-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveRating}
                  disabled={deleteRatingMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            )}
            
            {ratingMutation.isPending && (
              <div className="text-sm text-gray-500">
                Submitting rating...
              </div>
            )}
          </div>
        ) : (
          <div className="border-t pt-4 text-center text-gray-500">
            Please log in to rate this video
          </div>
        )}
      </CardContent>
    </Card>
  );
}