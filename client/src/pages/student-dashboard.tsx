import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  BookOpen, 
  Star, 
  Trophy, 
  Target, 
  Calendar,
  TrendingUp,
  Eye,
  CheckCircle,
  Bookmark,
  Play,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { type VideoWithCategory, type UserLearningStats } from "@shared/schema";

export function StudentDashboard() {
  const { user } = useAuth();

  // Fetch user learning stats
  const { data: stats } = useQuery<UserLearningStats>({
    queryKey: ["/api/user/learning-stats"],
    queryFn: async () => {
      const response = await fetch("/api/user/learning-stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch learning stats");
      return response.json();
    },
  });

  // Fetch user's bookmarked videos
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/user/bookmarks"],
    queryFn: async () => {
      const response = await fetch("/api/user/bookmarks", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
  });

  // Fetch watch history
  const { data: watchHistory = [] } = useQuery({
    queryKey: ["/api/user/watch-history"],
    queryFn: async () => {
      const response = await fetch("/api/user/watch-history", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch watch history");
      return response.json();
    },
  });

  // Fetch user sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/user/sessions"],
    queryFn: async () => {
      const response = await fetch("/api/user/sessions", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  // Fetch upcoming events
  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  // Fetch user notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/user/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/user/notifications", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">My Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.fullName}!</p>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalWatchTime)}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.totalVideosWatched} videos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Videos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedVideos}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalVideosWatched > 0 ? 
                  `${Math.round((stats.completedVideos / stats.totalVideosWatched) * 100)}% completion rate` : 
                  'No videos watched yet'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground">
                {stats.currentStreak === 1 ? 'day' : 'days'} in a row
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookmarked</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bookmarkedVideos}</div>
              <p className="text-xs text-muted-foreground">
                Videos saved for later
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.categoriesProgress.map((category) => (
                    <div key={category.categoryId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{category.categoryName}</h4>
                        <Badge variant="secondary">
                          {category.completed}/{category.total} videos
                        </Badge>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                      <p className="text-sm text-gray-600">
                        {category.percentage}% complete
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming events</p>
                    <p className="text-sm text-gray-400 mt-2">Check back later for workshops and training sessions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event: any) => (
                      <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(event.startDate).toLocaleTimeString()}
                              </div>
                            </div>
                            {event.location && (
                              <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                            {event.registrationRequired && (
                              <Button size="sm" className="mt-2 w-full">
                                Register
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="relative">
                    <span className="w-5 h-5 text-blue-600">🔔</span>
                    {notifications.filter((n: any) => !n.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                    )}
                  </span>
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔔</div>
                    <p className="text-gray-500">No notifications yet</p>
                    <p className="text-sm text-gray-400 mt-2">We'll notify you about important updates</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification: any) => (
                      <div 
                        key={notification.id} 
                        className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                          notification.isRead 
                            ? 'bg-white hover:bg-gray-50' 
                            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            {notification.linkUrl && (
                              <p className="text-xs text-blue-600 mt-2 font-medium">
                                Click to open link
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {notification.type === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                            {notification.type === 'link' && <span className="w-4 h-4 text-blue-600">🔗</span>}
                            {notification.type === 'message' && <span className="w-4 h-4 text-green-600">💬</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  My Bookmarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookmarks.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bookmarked videos yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarks.map((bookmark: any) => (
                      <div key={bookmark.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <Link href={`/video/${bookmark.video.id}`}>
                          <div className="cursor-pointer">
                            <img 
                              src={bookmark.video.thumbnailUrl || '/api/placeholder/300/200'} 
                              alt={bookmark.video.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                            <h4 className="font-medium line-clamp-2 mb-1">{bookmark.video.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{bookmark.video.category?.name}</p>
                            <p className="text-xs text-gray-500">
                              Bookmarked on {formatDate(bookmark.createdAt)}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Watch History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {watchHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No watch history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {watchHistory.map((entry: any) => (
                      <div key={entry.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img 
                          src={entry.video.thumbnailUrl || '/api/placeholder/100/60'} 
                          alt={entry.video.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{entry.video.title}</h4>
                          <p className="text-sm text-gray-600">{entry.video.category?.name}</p>
                          <p className="text-xs text-gray-500">
                            Watched {formatDuration(entry.watchDuration)} • {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {entry.progressPercentage}% watched
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Learning Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No learning sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{formatDate(session.startTime)}</h4>
                          <p className="text-sm text-gray-600">
                            {session.deviceInfo || 'Unknown device'} • {session.ipAddress}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatDuration(session.totalWatchTime || 0)}</p>
                          <p className="text-sm text-gray-600">
                            {session.endTime ? 'Completed' : 'Active'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}