import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Eye } from "lucide-react";
import type { VideoWithCategory } from "@shared/schema";

interface VideoPlayerModalProps {
  video: VideoWithCategory;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  const recordViewMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}/view`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to record view");
    },
  });

  useEffect(() => {
    if (isOpen) {
      recordViewMutation.mutate(video.id);
    }
  }, [isOpen, video.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{video.title}</DialogTitle>
        </DialogHeader>
        
        {/* Video Player Container */}
        <div className="aspect-video bg-black rounded-lg mb-4">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
        
        {/* Video Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {video.category && (
                <Badge variant="secondary">{video.category.name}</Badge>
              )}
              <span className="text-sm text-gray-500">{video.duration || "N/A"}</span>
              <div className="flex items-center text-sm text-gray-500">
                <Eye className="h-4 w-4 mr-1" />
                <span>{video.viewCount} views</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          
          {video.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{video.description}</p>
            </div>
          )}
          
          {video.tags && video.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
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
      </DialogContent>
    </Dialog>
  );
}
