import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
import type { VideoWithCategory } from "@shared/schema";

interface VideoCardProps {
  video: VideoWithCategory;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div 
      className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
      onClick={onClick}
    >
      <img
        src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
        alt={video.title}
        className="w-full h-40 sm:h-48 object-cover"
      />
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          {video.category ? (
            <Badge variant="secondary" className="text-xs">
              {video.category.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Uncategorized
            </Badge>
          )}
          <span className="text-xs text-gray-500 hidden sm:block">{video.duration || "N/A"}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">
          {video.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
          {video.description || "No description available"}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <Eye className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{video.viewCount} views</span>
            <span className="sm:hidden">{video.viewCount}</span>
            <span className="mx-1 sm:mx-2">•</span>
            <span className="hidden sm:inline">{new Date(video.createdAt).toLocaleDateString()}</span>
            <span className="sm:hidden">{new Date(video.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
          </div>
          <VideoCompletionBadge isCompleted={video.isCompleted || false} size="sm" />
        </div>
      </div>
    </div>
  );
}
