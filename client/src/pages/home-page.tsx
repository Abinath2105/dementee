import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Search, Settings, LogOut, X, User, Calendar, Newspaper } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategoryGrid } from "@/components/category-grid";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
import { NotificationBell } from "@/components/notification-bell";
import type { VideoWithCategory, Category, AppSettings } from "@shared/schema";

// Custom hook for debounced search
function useDebounced(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("events");
  const [, setLocation] = useLocation();
  
  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounced(searchQuery, 300);

  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: videos = [], isLoading } = useQuery<VideoWithCategory[]>({
    queryKey: ["/api/videos", debouncedSearchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("categoryId", selectedCategory);
      
      const response = await fetch(`/api/videos?${params}`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events", "authenticated"],
    queryFn: () => fetch("/api/events?public=true&status=active").then(res => res.json()),
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["/api/blog", "authenticated"],
    queryFn: () => fetch("/api/blog?status=published&public=true").then(res => res.json()),
  });

  // Filtered videos for instant local search feedback
  const filteredVideos = useMemo(() => {
    if (!searchQuery || searchQuery === debouncedSearchQuery) {
      return videos;
    }
    
    // Show instant local filtering while waiting for debounced API call
    const query = searchQuery.toLowerCase();
    return videos.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query) ||
      video.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  }, [videos, searchQuery, debouncedSearchQuery]);

  const handleSearch = () => {
    // Trim whitespace and trigger immediate search
    if (searchQuery.trim()) {
      setSearchQuery(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Apply custom CSS variables for theming
  useEffect(() => {
    if (appSettings) {
      document.documentElement.style.setProperty('--primary', appSettings.primaryColor);
      document.documentElement.style.setProperty('--secondary', appSettings.secondaryColor);
    }
  }, [appSettings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Mobile First */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <div className="flex flex-col leading-tight mr-2 sm:mr-3 flex-shrink-0">
                <div className="text-base sm:text-lg font-bold text-blue-600">Zmartclass</div>
                <div className="text-xs text-gray-500 font-normal -mt-1 text-right">De mentee</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link href="/profile">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              {!user?.isAdmin && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Settings className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}
              {user?.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                  <Button variant="outline" size="sm" className="sm:hidden">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Banner Carousel */}
      {appSettings?.bannerImages && appSettings.bannerImages.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <BannerCarousel 
            banners={appSettings.bannerImages}
            className="mb-4 sm:mb-8"
          />
        </div>
      )}

      {/* Search Section - Mobile First */}
      <div className="bg-white border-b border-gray-200 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 text-gray-900">Video Library</h1>
          <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8 text-gray-600">Find and watch educational videos</p>
          
          {/* Search Bar - Mobile Responsive with Dynamic Features */}
          <div className="max-w-2xl mx-auto relative mb-4 sm:mb-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search videos... (real-time search)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                  if (e.key === 'Escape') {
                    clearSearch();
                  }
                }}
                className="w-full pr-20 sm:pr-24 text-gray-900 h-10 sm:h-12 text-sm sm:text-base"
              />
              
              {/* Search Status Indicator */}
              {searchQuery && debouncedSearchQuery !== searchQuery && (
                <div className="absolute right-16 sm:right-20 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
              
              {/* Clear Search Button */}
              {searchQuery && (
                <Button 
                  onClick={clearSearch}
                  variant="ghost"
                  className="absolute right-10 sm:right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  size="sm"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                className="absolute right-1 top-1 h-8 sm:h-10 w-8 sm:w-auto px-2 sm:px-3"
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Results Counter */}
            {searchQuery && (
              <div className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                {isLoading ? "Searching..." : `${filteredVideos.length} video${filteredVideos.length !== 1 ? 's' : ''} found`}
                {searchQuery !== debouncedSearchQuery && " (refining...)"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section - Mobile Responsive */}
      <div className="bg-white border-b border-gray-200 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-medium text-gray-700 text-sm sm:text-base">Filter by:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 1 && <SelectItem value="all">All Categories</SelectItem>}
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Categories Grid Section */}
      {categories.length > 0 && (
        <div className="bg-gray-50 py-6 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <CategoryGrid
              categories={categories}
              videoCounts={categories.reduce((acc, category) => {
                acc[category.id] = videos.filter(v => v.categoryId === category.id).length;
                return acc;
              }, {} as { [key: number]: number })}
            />
          </div>
        </div>
      )}

      {/* Events and News Section */}
      {(events.length > 0 || blogPosts.length > 0) && (
        <div className="bg-white py-6 sm:py-8 lg:py-12 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Events and News</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="news" className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  News ({blogPosts.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="events" className="mt-0">
                {events.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event: any) => (
                      <div key={event.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                        {event.coverImage && (
                          <div className="w-full h-48 overflow-hidden">
                            <img
                              src={event.coverImage}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {event.type}
                            </span>
                            {event.isPublic && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Open to All
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                          
                          <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span>{new Date(event.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🕐</span>
                              <span>{new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.meetingLink && (
                              <div className="flex items-center gap-2">
                                <span>🔗</span>
                                <a 
                                  href={event.meetingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline truncate"
                                >
                                  Join Meeting
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events at the moment.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="news" className="mt-0">
                {blogPosts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogPosts.map((post: any) => (
                      <div 
                        key={post.id} 
                        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => window.location.href = `/blog/${post.slug}`}
                      >
                        {post.coverImage && (
                          <div className="w-full h-48 overflow-hidden">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              {post.status}
                            </span>
                            {post.tags && post.tags.length > 0 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                {post.tags[0]}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt || post.content?.substring(0, 150) + '...'}</p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>📝</span>
                              <span>By {post.author || 'Admin'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No news articles available yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Video Library - Mobile First */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 lg:mb-8 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {selectedCategory && selectedCategory !== "all" 
              ? `${categories.find(c => c.id.toString() === selectedCategory)?.name || "Category"} Videos`
              : categories.length > 1 ? "All Videos" : "Videos"
            }
          </h2>
          <div className="text-secondary text-sm sm:text-base">
            <span>{filteredVideos.length}</span> videos available
            {searchQuery && filteredVideos.length !== videos.length && (
              <span className="text-gray-400"> (filtered from {videos.length})</span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-40 sm:h-48 bg-gray-200"></div>
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Play className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600 text-sm sm:text-base px-4">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search criteria"
                : "No videos have been added yet"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setLocation(`/video/${video.id}`)}
              />
            ))}
          </div>
        )}
      </div>



      {/* Footer - Mobile Responsive */}
      {appSettings?.footerText && (
        <footer className="bg-gray-50 border-t border-gray-200 py-6 sm:py-8 mt-8 sm:mt-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">{appSettings.footerText}</p>
          </div>
        </footer>
      )}
    </div>
  );
}
