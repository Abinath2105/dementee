import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Eye, ArrowRight, Bookmark, BookmarkCheck, History, Star, MessageCircle } from "lucide-react";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
import { VideoRating } from "@/components/video-rating";
import { VideoComments } from "@/components/video-comments";
import { useToast } from "@/hooks/use-toast";
import type { VideoWithCategory } from "@shared/schema";

interface VideoPlayerModalProps {
  video: VideoWithCategory;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
}

export function VideoPlayerModal({ video, isOpen, onClose, onNext }: VideoPlayerModalProps) {
  const [isCompleted, setIsCompleted] = useState(video.isCompleted || false);
  const [isBookmarked, setIsBookmarked] = useState(video.isBookmarked || false);
  const [watchStartTime, setWatchStartTime] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const recordViewMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}/view`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to record view");
    },
  });

  const recordWatchHistoryMutation = useMutation({
    mutationFn: async ({ videoId, watchDuration }: { videoId: number; watchDuration: number }) => {
      const response = await fetch("/api/watch-history", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          watchDuration,
          progressPercentage: Math.min(100, Math.round((watchDuration / 300) * 100)), // Assume 5min videos for demo
          deviceInfo: navigator.userAgent,
        }),
      });
      if (!response.ok) throw new Error("Failed to record watch history");
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ videoId, isCompleting }: { videoId: number; isCompleting: boolean }) => {
      const response = await fetch(`/api/videos/${videoId}/complete`, {
        method: isCompleting ? "POST" : "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: isCompleting ? JSON.stringify({ watchTime: 0 }) : undefined,
      });
      if (!response.ok) throw new Error("Failed to update completion status");
    },
    onSuccess: (_, { isCompleting }) => {
      setIsCompleted(isCompleting);
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: isCompleting ? "Video completed!" : "Completion removed",
        description: isCompleting ? "Great job on finishing this video." : "Video marked as incomplete.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update completion status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async ({ videoId, isBookmarking }: { videoId: number; isBookmarking: boolean }) => {
      const response = await fetch(`/api/videos/${videoId}/bookmark`, {
        method: isBookmarking ? "POST" : "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update bookmark status");
    },
    onSuccess: (_, { isBookmarking }) => {
      setIsBookmarked(isBookmarking);
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: isBookmarking ? "Video bookmarked!" : "Bookmark removed",
        description: isBookmarking ? "Added to your bookmarks." : "Removed from bookmarks.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark status. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      recordViewMutation.mutate(video.id);
      setIsCompleted(video.isCompleted || false);
      setIsBookmarked(video.isBookmarked || false);
      setWatchStartTime(new Date());
    }
  }, [isOpen, video.id, video.isCompleted, video.isBookmarked]);

  useEffect(() => {
    // Record watch history when modal closes
    return () => {
      if (watchStartTime && isOpen) {
        const watchDuration = Math.floor((Date.now() - watchStartTime.getTime()) / 1000);
        if (watchDuration > 5) { // Only record if watched for more than 5 seconds
          recordWatchHistoryMutation.mutate({ videoId: video.id, watchDuration });
        }
      }
    };
  }, [isOpen, watchStartTime]);

  const handleMarkComplete = () => {
    toggleCompletionMutation.mutate({ videoId: video.id, isCompleting: !isCompleted });
  };

  const handleToggleBookmark = () => {
    toggleBookmarkMutation.mutate({ videoId: video.id, isBookmarking: !isBookmarked });
  };

  const handleGoToNext = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[95vh] max-h-[95vh] p-3 sm:p-6 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl font-bold leading-tight pr-8">
            {video.title}
          </DialogTitle>
        </DialogHeader>
        
        {/* Video Player Container - Mobile Optimized */}
        <div className="aspect-video bg-black rounded-lg mb-3 sm:mb-4 flex-shrink-0">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
        
        {/* Video Info and Tabs - Single Column Layout */}
        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Video Meta */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
              {video.category && (
                <Badge variant="secondary" className="text-xs">{video.category.name}</Badge>
              )}
              <span className="text-gray-500">{video.duration || "N/A"}</span>
              <div className="flex items-center text-gray-500">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{video.viewCount} views</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <VideoCompletionBadge isCompleted={isCompleted} size="sm" />
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleToggleBookmark}
                disabled={toggleBookmarkMutation.isPending}
                className="flex-shrink-0"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                ) : (
                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                )}
                <span className="hidden sm:inline">
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </span>
              </Button>
              
              <Button 
                variant={isCompleted ? "outline" : "default"}
                size="sm"
                onClick={handleMarkComplete}
                disabled={toggleCompletionMutation.isPending}
                className="flex-shrink-0"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">
                  {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                </span>
              </Button>
              
              {isCompleted && onNext && (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleGoToNext}
                  className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                >
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Next Video</span>
                  <span className="sm:hidden">Next</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Description */}
          {video.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Description</h4>
              <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
                {video.description}
              </p>
            </div>
          )}
          
          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Tags</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {video.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* ALWAYS VISIBLE Ratings and Comments Tabs */}
          <div className="border-t pt-4">
            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-center text-blue-900">⭐ Ratings & Comments</h3>
              <Tabs defaultValue="rating" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-blue-100">
                  <TabsTrigger value="rating" className="text-sm font-medium text-blue-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Star className="h-4 w-4 mr-1" />
                    Rating
                    {video.averageRating && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {video.averageRating.toFixed(1)}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-sm font-medium text-blue-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comments
                    {video.commentsCount && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {video.commentsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="rating" className="mt-4 min-h-[200px]">
                  <VideoRating
                    video={video}
                    userRating={video.userRating}
                    onRatingSubmit={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="comments" className="mt-4 min-h-[200px]">
                  <VideoComments video={video} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
