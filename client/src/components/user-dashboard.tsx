import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, BookOpen, Bookmark, Heart, Play, CheckCircle, Calendar, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { VideoProgress, VideoBookmark, UserWatchlist } from "@shared/schema";

interface ProgressStats {
  totalVideos: number;
  completedVideos: number;
  totalWatchTime: number;
}

export function UserDashboard() {
  const { user } = useAuth();

  // Fetch user progress statistics
  const { data: progressStats } = useQuery<ProgressStats>({
    queryKey: ["/api/user/progress/stats"],
    enabled: !!user,
  });

  // Fetch user video progress
  const { data: userProgress = [] } = useQuery<VideoProgress[]>({
    queryKey: ["/api/user/progress"],
    enabled: !!user,
  });

  // Fetch user bookmarks
  const { data: userBookmarks = [] } = useQuery<VideoBookmark[]>({
    queryKey: ["/api/user/bookmarks"],
    enabled: !!user,
  });

  // Fetch user watchlist
  const { data: watchlist = [] } = useQuery<UserWatchlist[]>({
    queryKey: ["/api/watchlist"],
    enabled: !!user,
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const completionRate = progressStats ? 
    Math.round((progressStats.completedVideos / Math.max(progressStats.totalVideos, 1)) * 100) : 0;

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="text-gray-600">Track your progress and manage your learning journey</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Watched</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressStats?.totalVideos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total videos started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressStats?.completedVideos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Videos completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(progressStats?.totalWatchTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total time watched
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Content Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Recent Progress</TabsTrigger>
          <TabsTrigger value="bookmarks">My Bookmarks</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Learning Activity</CardTitle>
              <CardDescription>
                Your recent video watching progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {userProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No learning progress yet. Start watching videos to see your progress here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProgress.map((progress) => {
                      const progressPercentage = Math.round(
                        (progress.currentTimeSeconds / Math.max(progress.durationSeconds, 1)) * 100
                      );
                      
                      return (
                        <div key={progress.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">Video #{progress.videoId}</h4>
                              <p className="text-sm text-gray-600">
                                Last watched: {formatDate(progress.lastWatchedAt)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {progress.isCompleted ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  {progressPercentage}% Complete
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{formatTime(progress.currentTimeSeconds)} / {formatTime(progress.durationSeconds)}</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bookmark className="h-5 w-5 mr-2" />
                My Bookmarks ({userBookmarks.length})
              </CardTitle>
              <CardDescription>
                Quick access to your saved video moments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {userBookmarks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No bookmarks yet. Create bookmarks while watching videos to find them here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userBookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-blue-600">
                                {formatTime(bookmark.timestampSeconds)}
                              </span>
                              <span className="text-sm text-gray-500">
                                Video #{bookmark.videoId}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Created: {formatDate(bookmark.createdAt)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Play className="h-3 w-3 mr-1" />
                            Jump to
                          </Button>
                        </div>
                        
                        {bookmark.note && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            {bookmark.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                My Watchlist ({watchlist.length})
              </CardTitle>
              <CardDescription>
                Videos you've saved to watch later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {watchlist.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Your watchlist is empty. Add videos to your watchlist while browsing!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {watchlist.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">Video #{item.videoId}</h4>
                            <p className="text-sm text-gray-600">
                              Added: {formatDate(item.addedAt)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Play className="h-3 w-3 mr-1" />
                            Watch
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}