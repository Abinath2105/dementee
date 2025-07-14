import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Clock } from "lucide-react";
import type { VideoWithCategory } from "@shared/schema";

interface RelatedVideosListProps {
  currentVideo: VideoWithCategory;
  onVideoSelect?: () => void;
}

export function RelatedVideosList({ currentVideo, onVideoSelect }: RelatedVideosListProps) {
  const { data: relatedVideos = [], isLoading } = useQuery<VideoWithCategory[]>({
    queryKey: ["/api/videos", { categoryId: currentVideo.category?.id }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentVideo.category?.id) {
        params.append("categoryId", currentVideo.category.id.toString());
      }
      
      const response = await fetch(`/api/videos?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch related videos");
      return response.json();
    },
  });

  // Filter out current video from related videos
  const filteredVideos = relatedVideos.filter(video => video.id !== currentVideo.id);

  const handleVideoClick = (video: VideoWithCategory) => {
    // This will be handled by the parent component
    console.log("Video clicked:", video.title);
    onVideoSelect?.();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">More Videos</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-32 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {currentVideo.category?.name ? `More from ${currentVideo.category.name}` : "More Videos"}
      </h3>
      
      <div className="space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No other videos in this category</p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
              onClick={() => handleVideoClick(video)}
            >
              {/* Video Thumbnail */}
              <div className="w-32 h-20 bg-gray-900 rounded-lg flex-shrink-0 relative overflow-hidden">
                <img
                  src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-6 w-6 text-white" />
                </div>
                {video.duration && (
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                    {video.duration}
                  </div>
                )}
              </div>
              
              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    <span>{video.viewCount || 0} views</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                </div>
                
                {video.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {video.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  {video.isCompleted && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Completed
                    </Badge>
                  )}
                  {video.averageRating && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span>★ {video.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {filteredVideos.length > 0 && (
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.location.href = `/category/${currentVideo.category?.slug || ''}`}
          >
            View All Videos in {currentVideo.category?.name || "Category"}
          </Button>
        </div>
      )}
    </div>
  );
}