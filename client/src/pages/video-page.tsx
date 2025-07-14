import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Eye, ArrowLeft, Bookmark, BookmarkCheck, Star, MessageCircle, Play, Clock } from "lucide-react";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
import { VideoRating } from "@/components/video-rating";
import { VideoComments } from "@/components/video-comments";
import { useToast } from "@/hooks/use-toast";
import type { VideoWithCategory } from "@shared/schema";

export function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [, setLocation] = useLocation();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch video data
  const { data: video, isLoading, error } = useQuery<VideoWithCategory>({
    queryKey: ["/api/videos", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${videoId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch video");
      return response.json();
    },
    enabled: !!videoId,
  });

  // Fetch related videos
  const { data: relatedVideos = [] } = useQuery<VideoWithCategory[]>({
    queryKey: ["/api/videos", { categoryId: video?.category?.id }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (video?.category?.id) {
        params.append("categoryId", video.category.id.toString());
      }
      const response = await fetch(`/api/videos?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch related videos");
      return response.json();
    },
    enabled: !!video?.category?.id,
  });

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          watchDuration,
          progressPercentage: Math.min(100, Math.round((watchDuration / 300) * 100)),
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
        headers: { "Content-Type": "application/json" },
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
  });

  useEffect(() => {
    if (video) {
      recordViewMutation.mutate(video.id);
      setIsCompleted(video.isCompleted || false);
      setIsBookmarked(video.isBookmarked || false);
      setWatchStartTime(new Date());
    }
  }, [video?.id]);

  useEffect(() => {
    return () => {
      if (watchStartTime && video) {
        const watchDuration = Math.floor((Date.now() - watchStartTime.getTime()) / 1000);
        if (watchDuration > 5) {
          recordWatchHistoryMutation.mutate({ videoId: video.id, watchDuration });
        }
      }
    };
  }, [watchStartTime, video?.id]);

  const handleMarkComplete = () => {
    if (video) {
      toggleCompletionMutation.mutate({ videoId: video.id, isCompleting: !isCompleted });
    }
  };

  const handleToggleBookmark = () => {
    if (video) {
      toggleBookmarkMutation.mutate({ videoId: video.id, isBookmarking: !isBookmarked });
    }
  };

  const handleVideoClick = (selectedVideo: VideoWithCategory) => {
    setLocation(`/video/${selectedVideo.id}`);
  };

  const handleGoBack = () => {
    if (video?.category?.slug) {
      setLocation(`/category/${video.category.slug}`);
    } else {
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Not Found</h1>
          <p className="text-gray-600 mb-4">The video you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const filteredRelatedVideos = relatedVideos.filter(v => v.id !== video.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {video.title}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {video.category && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {video.category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Video Player and Info */}
          <div className="flex-1">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>{video.duration || "N/A"}</span>
                  <span>•</span>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{video.viewCount} views</span>
                  </div>
                  {video.averageRating && (
                    <>
                      <span>•</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        <span>{video.averageRating.toFixed(1)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <VideoCompletionBadge isCompleted={isCompleted} size="sm" />
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleToggleBookmark}
                    disabled={toggleBookmarkMutation.isPending}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-2" />
                    )}
                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                  </Button>
                  
                  <Button 
                    variant={isCompleted ? "outline" : "default"}
                    size="sm"
                    onClick={handleMarkComplete}
                    disabled={toggleCompletionMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isCompleted ? "Mark Incomplete" : "Mark Complete"}
                  </Button>
                </div>
              </div>

              {video.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}

              {video.tags && video.tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ratings and Comments */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <Tabs defaultValue="rating" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="rating">
                    <Star className="h-4 w-4 mr-2" />
                    Rating
                    {video.averageRating && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {video.averageRating.toFixed(1)}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comments
                    {video.commentsCount && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {video.commentsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="rating">
                  <VideoRating
                    video={video}
                    userRating={video.userRating}
                    onRatingSubmit={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="comments">
                  <VideoComments video={video} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Related Videos */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">
                {video.category?.name ? `More from ${video.category.name}` : "Related Videos"}
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredRelatedVideos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No other videos in this category</p>
                  </div>
                ) : (
                  filteredRelatedVideos.map((relatedVideo) => (
                    <div
                      key={relatedVideo.id}
                      className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
                      onClick={() => handleVideoClick(relatedVideo)}
                    >
                      <div className="w-32 h-20 bg-gray-900 rounded-lg flex-shrink-0 relative overflow-hidden">
                        <img
                          src={relatedVideo.thumbnailUrl || `https://img.youtube.com/vi/${relatedVideo.youtubeId}/mqdefault.jpg`}
                          alt={relatedVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                        {relatedVideo.duration && (
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                            {relatedVideo.duration}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {relatedVideo.title}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            <span>{relatedVideo.viewCount || 0} views</span>
                          </div>
                          {relatedVideo.duration && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{relatedVideo.duration}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          {relatedVideo.isCompleted && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              Completed
                            </Badge>
                          )}
                          {relatedVideo.averageRating && (
                            <div className="flex items-center text-xs text-gray-500">
                              <span>★ {relatedVideo.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {filteredRelatedVideos.length > 0 && video.category && (
                <div className="pt-4 border-t mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setLocation(`/category/${video.category?.slug || ''}`)}
                  >
                    View All Videos in {video.category.name}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}