import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
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
  BarChart3,
  User as UserIcon,
  Mail,
  Monitor,
  MapPin
} from "lucide-react";
import { type VideoWithCategory, type UserLearningStats, type User } from "@shared/schema";

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0");

  // Fetch user details
  const { data: student } = useQuery<User>({
    queryKey: ["/api/admin/users", userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  // Fetch user learning stats
  const { data: stats } = useQuery<UserLearningStats>({
    queryKey: ["/api/admin/users", userId, "learning-stats"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/learning-stats`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch learning stats");
      return response.json();
    },
  });

  // Fetch user's bookmarked videos
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/admin/users", userId, "bookmarks"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/bookmarks`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
  });

  // Fetch watch history
  const { data: watchHistory = [] } = useQuery({
    queryKey: ["/api/admin/users", userId, "watch-history"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/watch-history`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch watch history");
      return response.json();
    },
  });

  // Fetch user sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/admin/users", userId, "sessions"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/sessions`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  // Fetch user completions
  const { data: completions = [] } = useQuery({
    queryKey: ["/api/admin/users", userId, "completions"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/completions`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch completions");
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!student || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
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
            <div className="flex items-center">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Student Analytics</h1>
                <p className="text-sm text-gray-600">{student.fullName} (@{student.username})</p>
              </div>
            </div>
            <Badge variant={student.isAdmin ? "default" : "secondary"}>
              {student.isAdmin ? "Admin" : "Student"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Student Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Full Name</p>
                  <p className="text-sm text-gray-600">{student.fullName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Active</p>
                  <p className="text-sm text-gray-600">
                    {stats.lastActiveDate ? formatDate(stats.lastActiveDate.toString()) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <CardTitle className="text-sm font-medium">Preferred Device</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.preferredDevice || 'Unknown'}</div>
              <p className="text-xs text-muted-foreground">
                Most used device
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="completions">Completions</TabsTrigger>
            <TabsTrigger value="history">Watch History</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
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

          <TabsContent value="completions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Completed Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No completed videos yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completions.map((completion: any) => (
                      <div key={completion.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img 
                          src={completion.video.thumbnailUrl || '/api/placeholder/100/60'} 
                          alt={completion.video.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{completion.video.title}</h4>
                          <p className="text-sm text-gray-600">{completion.video.category?.name}</p>
                          <p className="text-xs text-gray-500">
                            Completed on {formatDate(completion.completedAt)} • 
                            Watch time: {formatDuration(completion.watchTime)}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          ✓ Complete
                        </Badge>
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
                            {formatDate(entry.createdAt)} • {entry.deviceInfo} • {entry.ipAddress}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDuration(entry.watchDuration)}</p>
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
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Monitor className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{formatDate(session.startTime)}</h4>
                            <p className="text-sm text-gray-600">
                              {session.deviceInfo || 'Unknown device'}
                            </p>
                            <p className="text-xs text-gray-500">
                              IP: {session.ipAddress}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatDuration(session.totalWatchTime || 0)}</p>
                          <Badge variant={session.endTime ? "secondary" : "default"}>
                            {session.endTime ? 'Completed' : 'Active'}
                          </Badge>
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
                  Bookmarked Videos
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
                      <div key={bookmark.id} className="border rounded-lg p-4">
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