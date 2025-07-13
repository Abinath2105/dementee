import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, ArrowRight } from "lucide-react";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
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

  useEffect(() => {
    if (isOpen) {
      recordViewMutation.mutate(video.id);
      setIsCompleted(video.isCompleted || false);
    }
  }, [isOpen, video.id, video.isCompleted]);

  const handleMarkComplete = () => {
    toggleCompletionMutation.mutate({ videoId: video.id, isCompleting: !isCompleted });
  };

  const handleGoToNext = () => {
    if (onNext) {
      onNext();
    }
  };

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
            <div className="flex items-center space-x-2">
              <VideoCompletionBadge isCompleted={isCompleted} />
              <Button 
                variant={isCompleted ? "outline" : "default"}
                size="sm"
                onClick={handleMarkComplete}
                disabled={toggleCompletionMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isCompleted ? "Mark Incomplete" : "Mark Complete"}
              </Button>
              {isCompleted && onNext && (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleGoToNext}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next Video
                </Button>
              )}
            </div>
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
