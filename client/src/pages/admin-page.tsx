import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Video, Users, Eye, Clock, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { AddVideoModal } from "@/components/add-video-modal";
import { queryClient } from "@/lib/queryClient";
import type { VideoWithCategory, AdminStats } from "@shared/schema";

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const [showAddVideo, setShowAddVideo] = useState(false);

  // Redirect if not admin
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: videos = [], isLoading } = useQuery<VideoWithCategory[]>({
    queryKey: ["/api/videos"],
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete video");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const handleDeleteVideo = (videoId: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">VideoLearn Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Videos
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your video content and monitor platform activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Videos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalVideos || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalViews || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Watch Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalWatchTime || "0h"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={() => setShowAddVideo(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Video
          </Button>
        </div>

        {/* Video Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Video Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-9 bg-gray-200 rounded animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : videos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No videos found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    videos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <img
                              src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                              alt={video.title}
                              className="w-16 h-9 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-xs">
                                {video.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {video.duration || "N/A"} duration
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {video.category ? (
                            <Badge variant="outline">{video.category.name}</Badge>
                          ) : (
                            <span className="text-gray-400">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell>{video.viewCount}</TableCell>
                        <TableCell>
                          {new Date(video.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={deleteVideoMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddVideo && (
        <AddVideoModal
          isOpen={showAddVideo}
          onClose={() => setShowAddVideo(false)}
        />
      )}
    </div>
  );
}
