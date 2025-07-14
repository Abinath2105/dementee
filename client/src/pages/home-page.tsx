import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Search, Settings, LogOut } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategoryGrid } from "@/components/category-grid";
import { VideoCompletionBadge } from "@/components/video-completion-badge";
import type { VideoWithCategory, Category, AppSettings } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: videos = [], isLoading } = useQuery<VideoWithCategory[]>({
    queryKey: ["/api/videos", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("categoryId", selectedCategory);
      
      const response = await fetch(`/api/videos?${params}`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  const handleSearch = () => {
    // Search is handled automatically via query key changes
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
              {appSettings?.appLogo ? (
                <img src={appSettings.appLogo} alt="Logo" className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 flex-shrink-0" />
              ) : (
                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3 flex-shrink-0" />
              )}
              <span className="text-base sm:text-xl font-bold text-gray-900 truncate">
                {appSettings?.appName || "VideoLearn Pro"}
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
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
          
          {/* Search Bar - Mobile Responsive */}
          <div className="max-w-2xl mx-auto relative mb-4 sm:mb-6">
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 sm:pr-16 text-gray-900 h-10 sm:h-12 text-sm sm:text-base"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-1 top-1 h-8 sm:h-10 w-8 sm:w-auto px-2 sm:px-3"
              size="sm"
            >
              <Search className="h-4 w-4" />
            </Button>
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
                <SelectItem value="all">All Categories</SelectItem>
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

      {/* Video Library - Mobile First */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 lg:mb-8 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {selectedCategory && selectedCategory !== "all" 
              ? `${categories.find(c => c.id.toString() === selectedCategory)?.name || "Category"} Videos`
              : "All Videos"
            }
          </h2>
          <div className="text-secondary text-sm sm:text-base">
            <span>{videos.length}</span> videos available
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
        ) : videos.length === 0 ? (
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
            {videos.map((video) => (
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
