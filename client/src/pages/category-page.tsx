import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Play, Clock, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { VideoWithCategory } from "@shared/schema";
import { VideoCompletionBadge } from "@/components/video-completion-badge";

export function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const slug = params?.slug;
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

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
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                VideoLearn Pro
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category Hero Section - Mobile Responsive */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
            <div className="mb-4 sm:mb-0">
              <img
                src={category.coverImage || '/api/placeholder/300/200'}
                alt={category.name}
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover border-4 border-blue-100"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                <Badge variant="secondary" className="mr-2 text-xs">
                  Category
                </Badge>
                {progress && (
                  <div className="text-xs text-gray-600">
                    {progress.completed} of {progress.total} completed
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {category.name}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                {category.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Instructor: {category.mentorName}</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                </div>
                {progress && (
                  <div className="flex items-center">
                    <div className="w-20 mr-2">
                      <Progress value={(progress.completed / progress.total) * 100} className="h-2" />
                    </div>
                    <span>{Math.round((progress.completed / progress.total) * 100)}% Complete</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Search Bar - Mobile Responsive */}
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
          <div className="space-y-4">
            <div className="text-sm text-gray-600 px-4">
              Showing {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
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
          </div>
        )}
      </div>
    </div>
  );
}