import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Play, Clock, Users, BarChart3, Calendar, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { VideoWithCategory } from "@shared/schema";
import { VideoCompletionBadge } from "@/components/video-completion-badge";

export function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const slug = params?.slug;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
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

  // Sort videos based on selected option
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "popular":
        return (b.views || 0) - (a.views || 0);
      case "alphabetical":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Get featured video (first video or most recent)
  const featuredVideo = sortedVideos[0];

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

      {/* Enhanced Hero Section */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: category.backgroundImage 
            ? `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url(${category.backgroundImage})` 
            : `linear-gradient(135deg, ${category.backgroundColor || '#3B82F6'}, ${category.backgroundColor ? category.backgroundColor + '90' : '#8B5CF6'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent)]"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                {videos.length} Videos Available
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white leading-tight">
                {category.name}
              </h1>
              
              {category.description && (
                <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
                  {category.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-6 mb-8">
                {category.mentorName && (
                  <div className="flex items-center space-x-2 text-white/90">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Instructor: {category.mentorName}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-white/90">
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">{videos.length} Videos</span>
                </div>
                {progress && (
                  <div className="flex items-center space-x-2 text-white/90">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">{Math.round((progress.completed / progress.total) * 100)}% Complete</span>
                  </div>
                )}
              </div>
              
              {progress && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm text-white/90 mb-2">
                    <span>Course Progress</span>
                    <span>{progress.completed} of {progress.total}</span>
                  </div>
                  <Progress 
                    value={(progress.completed / progress.total) * 100} 
                    className="h-3 bg-white/20"
                  />
                </div>
              )}
            </div>
            
            {/* Featured Video Preview */}
            {featuredVideo && (
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md lg:max-w-lg">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-2xl">
                    <div 
                      className="aspect-video bg-gray-900 rounded-lg mb-4 relative group cursor-pointer overflow-hidden shadow-lg"
                      onClick={() => handleVideoClick(featuredVideo)}
                    >
                      <img 
                        src={featuredVideo.thumbnailUrl || "/api/placeholder/320/180"}
                        alt={featuredVideo.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Play className="h-8 w-8 text-gray-900 ml-1" />
                        </div>
                      </div>
                      <VideoCompletionBadge 
                        video={featuredVideo}
                        className="absolute top-3 left-3"
                      />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                        {featuredVideo.title}
                      </h3>
                      <p className="text-sm text-white/80 line-clamp-2 mb-4">
                        {featuredVideo.description}
                      </p>
                      <Button 
                        onClick={() => handleVideoClick(featuredVideo)}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                        variant="outline"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Watch Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Search and Sort Controls - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Oldest First
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Most Popular
                    </div>
                  </SelectItem>
                  <SelectItem value="alphabetical">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">A-Z</span>
                      Alphabetical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        ) : sortedVideos.length === 0 ? (
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
              Showing {sortedVideos.length} video{sortedVideos.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {sortedVideos.map((video: VideoWithCategory, index: number) => (
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