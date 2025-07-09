import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Bookmark, BookmarkPlus, Play, Pause, Clock, CheckCircle, Heart, HeartOff, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { VideoWithCategory, VideoProgress, VideoBookmark } from "@shared/schema";

interface EnhancedVideoPlayerModalProps {
  video: VideoWithCategory;
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedVideoPlayerModal({ video, isOpen, onClose }: EnhancedVideoPlayerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // State for bookmark creation
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [currentTimestamp, setCurrentTimestamp] = useState(0);

  // Fetch video progress
  const { data: progress } = useQuery<VideoProgress | null>({
    queryKey: ["/api/progress", video.id],
    enabled: !!user && isOpen,
  });

  // Fetch video bookmarks
  const { data: bookmarks = [] } = useQuery<VideoBookmark[]>({
    queryKey: ["/api/bookmarks", video.id],
    enabled: !!user && isOpen,
  });

  // Fetch watchlist status
  const { data: watchlistStatus } = useQuery<{ isInWatchlist: boolean }>({
    queryKey: ["/api/watchlist", video.id, "status"],
    enabled: !!user && isOpen,
  });

  // Progress tracking mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ currentTimeSeconds, durationSeconds, isCompleted }: {
      currentTimeSeconds: number;
      durationSeconds: number;
      isCompleted?: boolean;
    }) => {
      const res = await apiRequest("POST", `/api/progress/${video.id}`, {
        currentTimeSeconds,
        durationSeconds,
        isCompleted: isCompleted || false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", video.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
  });

  // Bookmark creation mutation
  const createBookmarkMutation = useMutation({
    mutationFn: async ({ timestampSeconds, note }: {
      timestampSeconds: number;
      note?: string;
    }) => {
      const res = await apiRequest("POST", "/api/bookmarks", {
        videoId: video.id,
        timestampSeconds,
        note,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", video.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookmarks"] });
      setIsBookmarkModalOpen(false);
      setBookmarkNote("");
      toast({ title: "Bookmark created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create bookmark",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: number) => {
      await apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", video.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookmarks"] });
      toast({ title: "Bookmark deleted successfully" });
    },
  });

  // Watchlist mutations
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/watchlist/${video.id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist", video.id, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Added to watchlist" });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/watchlist/${video.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist", video.id, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Removed from watchlist" });
    },
  });

  // Record view mutation
  const recordViewMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}/view`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to record view");
    },
  });

  // Record view when modal opens
  useEffect(() => {
    if (isOpen) {
      recordViewMutation.mutate(video.id);
    }
  }, [isOpen, video.id]);

  // Start progress tracking when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;

    const startProgressTracking = () => {
      // For demo purposes, we'll simulate progress tracking
      // In a real implementation, you'd integrate with the YouTube iframe API
      progressIntervalRef.current = setInterval(() => {
        // This is a simplified simulation - in practice you'd get actual video time
        const simulatedCurrentTime = Math.floor(Math.random() * 300); // 0-5 minutes
        const simulatedDuration = 600; // 10 minutes

        updateProgressMutation.mutate({
          currentTimeSeconds: simulatedCurrentTime,
          durationSeconds: simulatedDuration,
          isCompleted: simulatedCurrentTime >= simulatedDuration * 0.95,
        });
      }, 30000); // Update every 30 seconds
    };

    startProgressTracking();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen, user, video.id]);

  const handleBookmarkAtCurrentTime = () => {
    // In a real implementation, you'd get the current time from the YouTube player
    const currentTime = Math.floor(Math.random() * 300); // Simulated current time
    setCurrentTimestamp(currentTime);
    setIsBookmarkModalOpen(true);
  };

  const handleCreateBookmark = () => {
    createBookmarkMutation.mutate({
      timestampSeconds: currentTimestamp,
      note: bookmarkNote,
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = progress ? 
    Math.round((progress.currentTimeSeconds / Math.max(progress.durationSeconds, 1)) * 100) : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              {video.title}
              <div className="flex items-center space-x-2">
                {progress?.isCompleted && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {progress && !progress.isCompleted && (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {progressPercentage}% Complete
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Video Player Container */}
          <div className="aspect-video bg-black rounded-lg mb-4 relative">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&start=${progress?.currentTimeSeconds || 0}`}
              title={video.title}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          {/* Progress Bar */}
          {progress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress: {formatTime(progress.currentTimeSeconds)} / {formatTime(progress.durationSeconds)}</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Video Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button onClick={handleBookmarkAtCurrentTime} variant="outline" size="sm">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Bookmark
              </Button>
              
              {watchlistStatus?.isInWatchlist ? (
                <Button 
                  onClick={() => removeFromWatchlistMutation.mutate()}
                  variant="outline" 
                  size="sm"
                  disabled={removeFromWatchlistMutation.isPending}
                >
                  <HeartOff className="h-4 w-4 mr-2" />
                  Remove from Watchlist
                </Button>
              ) : (
                <Button 
                  onClick={() => addToWatchlistMutation.mutate()}
                  variant="outline" 
                  size="sm"
                  disabled={addToWatchlistMutation.isPending}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {video.category && (
                <Badge variant="secondary">{video.category.name}</Badge>
              )}
              <span>{video.duration || "N/A"}</span>
              <span>{video.viewCount} views</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Info */}
            <div className="lg:col-span-2 space-y-4">
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
            
            {/* Bookmarks Sidebar */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmarks ({bookmarks.length})
                </h4>
                <ScrollArea className="h-64 w-full rounded border p-2">
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No bookmarks yet. Create one while watching!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="border rounded p-2 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-blue-600">
                              {formatTime(bookmark.timestampSeconds)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBookmarkMutation.mutate(bookmark.id)}
                              disabled={deleteBookmarkMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {bookmark.note && (
                            <p className="text-gray-600">{bookmark.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bookmark Creation Modal */}
      <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Bookmark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Timestamp</Label>
              <Input 
                value={formatTime(currentTimestamp)} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note for this bookmark..."
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsBookmarkModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBookmark}
                disabled={createBookmarkMutation.isPending}
              >
                {createBookmarkMutation.isPending ? "Creating..." : "Create Bookmark"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}