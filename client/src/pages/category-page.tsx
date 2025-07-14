import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Play, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/progress-ring";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
import { type VideoWithCategory, type AppSettings } from "@shared/schema";

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // Fetch app settings for branding
  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/categories", slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await fetch(`/api/categories/${slug}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch category");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Fetch videos for this category
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["/api/videos", { categoryId: category?.id }],
    queryFn: async () => {
      if (!category?.id) return [];
      const response = await fetch(`/api/videos?categoryId=${category.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
    enabled: !!category?.id,
  });

  // Fetch category progress
  const { data: progress } = useQuery({
    queryKey: ["/api/categories", category?.id, "progress"],
    queryFn: async () => {
      if (!category?.id) return null;
      const response = await fetch(`/api/categories/${category.id}/progress`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!category?.id,
  });

  const filteredVideos = videos.filter((video: VideoWithCategory) => {
    if (!searchQuery) return true;
    return (
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Debug logging
  console.log('Category page debug:', {
    categoryId: category?.id,
    videosLength: videos.length,
    filteredVideosLength: filteredVideos.length,
    searchQuery,
    videosLoading,
    videos: videos.slice(0, 2) // Show first 2 videos for debugging
  });

  const handleVideoClick = (video: VideoWithCategory) => {
    setLocation(`/video/${video.id}`);
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with App Branding - Mobile Responsive */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-2 sm:mr-4">
                  <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="flex items-center min-w-0">
                {appSettings?.appLogo ? (
                  <img src={appSettings.appLogo} alt="Logo" className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 flex-shrink-0" />
                ) : (
                  <Play className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                )}
                <span className="text-xl font-bold text-gray-900">
                  {appSettings?.appName || "VideoLearn Pro"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Hero Section - Mobile Responsive */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            {category.coverImage && (
              <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-lg sm:rounded-xl overflow-hidden shadow-lg bg-gray-100 mx-auto sm:mx-0">
                <img
                  src={category.coverImage}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-3 sm:mb-4">
                <Badge variant="secondary" className="mb-2 sm:mb-3">Category</Badge>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">{category.name}</h1>
                {category.description && (
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-3 sm:mb-4 leading-relaxed">{category.description}</p>
                )}
                {category.mentorName && (
                  <p className="text-gray-600 mb-3 sm:mb-4 flex items-center justify-center sm:justify-start">
                    <span className="font-medium text-gray-900">Instructor:</span>
                    <span className="ml-2">{category.mentorName}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-2 justify-center sm:justify-start">
                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{filteredVideos.length} videos</span>
                </div>
                {progress && (
                  <div className="flex items-center space-x-2 justify-center sm:justify-start">
                    <ProgressRing 
                      completed={progress.completed} 
                      total={progress.total} 
                      size={16} 
                      strokeWidth={2} 
                    />
                    <span className="hidden sm:inline">{progress.completed} of {progress.total} completed</span>
                    <span className="sm:hidden">{progress.completed}/{progress.total}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 justify-center sm:justify-start">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Learning Playlist</span>
                  <span className="sm:hidden">Playlist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Mobile Responsive */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Search - Mobile Responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Videos Grid - Mobile First */}
        {videosLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="w-full h-40 sm:h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-3 sm:p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">🎥</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No videos found" : "No videos in this category yet"}
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Videos will appear here once they're added to this category"}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 px-4">
              Showing {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} (Debug: Total videos loaded: {videos.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredVideos.map((video: VideoWithCategory, index: number) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                <div className="relative">
                  <img
                    src={video.thumbnailUrl || '/api/placeholder/400/225'}
                    alt={video.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Play className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <VideoCompletionBadge 
                      isCompleted={video.isCompleted || false} 
                      size="sm" 
                      variant="minimal" 
                    />
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1 z-10">
                      <Clock className="h-3 w-3" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{video.viewCount || 0} views</span>
                    <div className="flex items-center gap-2">
                      {video.isPublic && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                      {video.averageRating && (
                        <div className="flex items-center text-yellow-500">
                          <span>★ {video.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
        </div>
      </div>


    </div>
  );
}