import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { EnhancedVideoPlayerModal } from "@/components/enhanced-video-player-modal";
import { Navigation } from "@/components/navigation";
import type { VideoWithCategory, Category } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoWithCategory | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Knowledge</h1>
          <p className="text-xl mb-8 opacity-90">Access curated video content to enhance your skills</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              placeholder="Search videos by title, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-16 text-gray-900 h-12"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-1 top-1 h-10"
              size="sm"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-gray-700">Filter by:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
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

      {/* Video Library */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
          <div className="text-secondary">
            <span>{videos.length}</span> videos available
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search criteria"
                : "No videos have been added yet"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedVideo && (
        <EnhancedVideoPlayerModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
