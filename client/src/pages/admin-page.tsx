import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Play, Video, Users, Eye, Clock, Plus, Edit, Trash2, ArrowLeft, Shield, UserCheck, EyeOff, Settings, GraduationCap, CreditCard, BarChart3, FileVideo, BookOpen, Layout, Upload, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AddVideoModal } from "@/components/add-video-modal";
import { EditVideoModal } from "@/components/edit-video-modal";
import { AddMentorModal } from "@/components/add-mentor-modal";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoWithCategory, AdminStats, User, Category, MentorWithStats } from "@shared/schema";

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [editingVideo, setEditingVideo] = useState<VideoWithCategory | null>(null);
  const [showEditVideo, setShowEditVideo] = useState(false);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const { toast } = useToast();

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

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<MentorWithStats[]>({
    queryKey: ["/api/admin/mentors"],
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

  const updateUserAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAdmin }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user admin status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User admin status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "User deleted",
        description: "User account deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Category deleted",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVideoVisibilityMutation = useMutation({
    mutationFn: async ({ videoId, isPublic }: { videoId: number; isPublic: boolean }) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublic }),
      });
      if (!response.ok) throw new Error("Failed to update video visibility");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video updated",
        description: "Video visibility updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMentorMutation = useMutation({
    mutationFn: async (mentorId: number) => {
      const response = await fetch(`/api/admin/mentors/${mentorId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete mentor");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Mentor deleted",
        description: "Mentor profile deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (mentorId: number) => {
      const response = await fetch(`/api/admin/mentors/${mentorId}/resend-invitation`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend invitation");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Mentor invitation has been resent successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteVideo = (videoId: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const handleAdminToggle = (userId: number, isAdmin: boolean) => {
    updateUserAdminMutation.mutate({ userId, isAdmin });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user account? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeleteCategory = (categoryId: number) => {
    if (confirm("Are you sure you want to delete this category? All videos in this category will be uncategorized.")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const handleVisibilityToggle = (videoId: number, isPublic: boolean) => {
    updateVideoVisibilityMutation.mutate({ videoId, isPublic });
  };

  const handleEditVideo = (video: VideoWithCategory) => {
    setEditingVideo(video);
    setShowEditVideo(true);
  };

  const handleDeleteMentor = (mentorId: number) => {
    if (confirm("Are you sure you want to delete this mentor? This action cannot be undone.")) {
      deleteMentorMutation.mutate(mentorId);
    }
  };

  const handleResendInvitation = (mentorId: number) => {
    resendInvitationMutation.mutate(mentorId);
  };

  const handleCloseEditVideo = () => {
    setEditingVideo(null);
    setShowEditVideo(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">De mentee Academy</span>
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

        {/* Tabs for different management sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button onClick={() => setShowAddVideo(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Video or Category
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
                    <TableHead>Visibility</TableHead>
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
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
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
                      <TableCell colSpan={6} className="text-center py-8">
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
                              <div 
                                className="font-medium text-gray-900 truncate max-w-xs cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => handleEditVideo(video)}
                                title="Click to edit video"
                              >
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
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={video.isPublic}
                              onCheckedChange={(checked) => handleVisibilityToggle(video.id, checked)}
                              disabled={updateVideoVisibilityMutation.isPending}
                            />
                            <div className="flex items-center space-x-1">
                              {video.isPublic ? (
                                <>
                                  <Eye className="h-4 w-4 text-green-600" />
                                  <span className="text-xs text-green-600">Public</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 text-gray-600" />
                                  <span className="text-xs text-gray-600">Private</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{video.viewCount}</TableCell>
                        <TableCell>
                          {new Date(video.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditVideo(video)}
                              title="Edit video"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteVideo(video.id)}
                              disabled={deleteVideoMutation.isPending}
                              title="Delete video"
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

            {/* Categories Management */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Categories Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        {category.mentorName && (
                          <p className="text-sm text-gray-500">Mentor: {category.mentorName}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No categories found. Create one using the "Add Video or Category" button.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            {/* User Management Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No users found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell>
                              <div className="font-medium text-gray-900">
                                {userItem.username}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-gray-600">
                                {userItem.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={userItem.isVerified ? "default" : "secondary"}>
                                {userItem.isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={userItem.isAdmin}
                                  onCheckedChange={(checked) => handleAdminToggle(userItem.id, checked)}
                                  disabled={updateUserAdminMutation.isPending || userItem.id === user?.id}
                                />
                                {userItem.isAdmin && (
                                  <Shield className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(userItem.id)}
                                disabled={deleteUserMutation.isPending || userItem.id === user?.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors" className="mt-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button onClick={() => setShowAddMentor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mentor
              </Button>
            </div>

            {/* Mentors Management Table */}
            <Card>
              <CardHeader>
                <CardTitle>Mentor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mentor</TableHead>
                        <TableHead>Profession</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Credentials</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mentorsLoading ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                                <div className="space-y-1">
                                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : mentors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No mentors found</p>
                            <p className="text-sm text-gray-400 mt-1">Add your first mentor to get started</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        mentors.map((mentor) => (
                          <TableRow key={mentor.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {mentor.photo ? (
                                  <img
                                    src={mentor.photo}
                                    alt={mentor.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {mentor.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {mentor.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-gray-900">
                                {mentor.profession}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={mentor.isActive ? "default" : "secondary"}>
                                {mentor.isActive ? "Active" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={mentor.hasCredentials ? "default" : "outline"}>
                                {mentor.hasCredentials ? "Set Up" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {!mentor.isActive && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResendInvitation(mentor.id)}
                                    disabled={resendInvitationMutation.isPending}
                                    title="Resend invitation email"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteMentor(mentor.id)}
                                  disabled={deleteMentorMutation.isPending}
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
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileVideo className="h-5 w-5" />
                    Course Management
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Course</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Course Name</label>
                            <Input placeholder="e.g., Advanced React Development" className="mt-1" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Course Duration</label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30-days">30 Days</SelectItem>
                                <SelectItem value="60-days">60 Days</SelectItem>
                                <SelectItem value="90-days">90 Days</SelectItem>
                                <SelectItem value="6-months">6 Months</SelectItem>
                                <SelectItem value="12-months">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Course Description</label>
                          <Input placeholder="Brief description of the course content and objectives" className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Course Price</label>
                            <Input placeholder="₹50,000" className="mt-1" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Course Level</label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Course Category</label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="programming">Programming</SelectItem>
                              <SelectItem value="web-development">Web Development</SelectItem>
                              <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
                              <SelectItem value="data-science">Data Science</SelectItem>
                              <SelectItem value="mobile-development">Mobile Development</SelectItem>
                              <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Assigned Mentor</label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select mentor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dr-sarah-johnson">Dr. Sarah Johnson</SelectItem>
                              <SelectItem value="john-doe">John Doe</SelectItem>
                              <SelectItem value="jane-smith">Jane Smith</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Course Outline (Optional)</label>
                          <Input placeholder="Week 1: Fundamentals, Week 2: Advanced Topics..." className="mt-1" />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline">Cancel</Button>
                          <Button>Create Course</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Create comprehensive courses with video uploads, structured learning paths, and assignments.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAddVideo(true)}>
                    <CardContent className="p-6 text-center">
                      <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Create New Course</h3>
                      <p className="text-sm text-gray-600">Upload videos and build structured learning experiences</p>
                    </CardContent>
                  </Card>
                  
                  {/* Course list would go here - for now showing placeholder */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileVideo className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">30 Days UI/UX Course</h3>
                          <p className="text-sm text-gray-600">4 videos • Active</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Management
                  </CardTitle>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Bulk Actions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Bulk Student Actions</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Action Type</label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assign-course">Assign Course</SelectItem>
                                <SelectItem value="assign-batch">Assign Batch</SelectItem>
                                <SelectItem value="send-email">Send Email</SelectItem>
                                <SelectItem value="export-data">Export Data</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Target Students</label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select students" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all-students">All Students</SelectItem>
                                <SelectItem value="active-students">Active Students</SelectItem>
                                <SelectItem value="pending-students">Pending Students</SelectItem>
                                <SelectItem value="course-specific">Course Specific</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline">Cancel</Button>
                            <Button>Execute Action</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => setShowAddVideo(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Student Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">156</div>
                        <p className="text-sm text-gray-600">Total Students</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">134</div>
                        <p className="text-sm text-gray-600">Active</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">18</div>
                        <p className="text-sm text-gray-600">Pending</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">4</div>
                        <p className="text-sm text-gray-600">Inactive</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">92%</div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search students by name, email, or student ID..."
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          <SelectItem value="ui-ux">UI/UX Design</SelectItem>
                          <SelectItem value="web-dev">Web Development</SelectItem>
                          <SelectItem value="data-science">Data Science</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Batches</SelectItem>
                          <SelectItem value="dm-weekend-01">DM-Weekend-01</SelectItem>
                          <SelectItem value="dm-weekday-03">DM-Weekday-03</SelectItem>
                          <SelectItem value="dm-evening-02">DM-Evening-02</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Students Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </TableHead>
                          <TableHead>Student Details</TableHead>
                          <TableHead>Course & Batch</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Sample student data with full functionality */}
                        <TableRow>
                          <TableCell>
                            <input type="checkbox" className="rounded border-gray-300" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">Lakshman Kumar</div>
                                <div className="text-sm text-gray-600">lakshman@example.com</div>
                                <div className="text-xs text-gray-500">ID: DM2025001</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="mb-1">Advanced UI/UX</Badge>
                              <div className="text-sm text-gray-600">DM-Weekend-01</div>
                              <div className="text-xs text-gray-500">Mentor: John Doe</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-green-600 h-2 rounded-full" style={{width: '78%'}}></div>
                                </div>
                                <span className="text-sm font-medium">78%</span>
                              </div>
                              <div className="text-xs text-gray-600">12/15 modules completed</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="default" className="bg-green-100 text-green-800 mb-1">Paid</Badge>
                              <div className="text-sm text-gray-600">₹50,000</div>
                              <div className="text-xs text-gray-500">One-time payment</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>2 hours ago</div>
                              <div className="text-gray-600">Video: Design Principles</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" title="View Profile">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Send Message">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" title="Edit Student">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>Edit Student - Lakshman Kumar</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">First Name</label>
                                        <Input defaultValue="Lakshman" className="mt-1" />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Last Name</label>
                                        <Input defaultValue="Kumar" className="mt-1" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <Input defaultValue="lakshman@example.com" className="mt-1" />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Course</label>
                                      <Select defaultValue="ui-ux">
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ui-ux">Advanced UI/UX Design</SelectItem>
                                          <SelectItem value="web-dev">Full Stack Web Development</SelectItem>
                                          <SelectItem value="data-science">Data Science</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Batch</label>
                                      <Select defaultValue="dm-weekend-01">
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="dm-weekend-01">DM-Weekend-01</SelectItem>
                                          <SelectItem value="dm-weekday-03">DM-Weekday-03</SelectItem>
                                          <SelectItem value="dm-evening-02">DM-Evening-02</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Select defaultValue="active">
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="inactive">Inactive</SelectItem>
                                          <SelectItem value="graduated">Graduated</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                      <Button variant="outline">Cancel</Button>
                                      <Button>Update Student</Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="outline" className="text-red-600" title="Remove Student">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Additional sample rows */}
                        <TableRow>
                          <TableCell>
                            <input type="checkbox" className="rounded border-gray-300" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium">Priya Sharma</div>
                                <div className="text-sm text-gray-600">priya@example.com</div>
                                <div className="text-xs text-gray-500">ID: DM2025002</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="mb-1">Web Development</Badge>
                              <div className="text-sm text-gray-600">DM-Weekday-03</div>
                              <div className="text-xs text-gray-500">Mentor: Jane Smith</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                                </div>
                                <span className="text-sm font-medium">45%</span>
                              </div>
                              <div className="text-xs text-gray-600">9/20 modules completed</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 mb-1">Partial</Badge>
                              <div className="text-sm text-gray-600">₹35,000 / ₹75,000</div>
                              <div className="text-xs text-gray-500">Installment plan</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>1 day ago</div>
                              <div className="text-gray-600">Assignment: React Basics</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" title="View Profile">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Send Message">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Edit Student">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" title="Remove Student">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <input type="checkbox" className="rounded border-gray-300" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium">Rahul Verma</div>
                                <div className="text-sm text-gray-600">rahul@example.com</div>
                                <div className="text-xs text-gray-500">ID: DM2025003</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="mb-1">Data Science</Badge>
                              <div className="text-sm text-gray-600">DM-Evening-02</div>
                              <div className="text-xs text-gray-500">Mentor: Mike Wilson</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-orange-600 h-2 rounded-full" style={{width: '15%'}}></div>
                                </div>
                                <span className="text-sm font-medium">15%</span>
                              </div>
                              <div className="text-xs text-gray-600">3/18 modules completed</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="bg-red-100 text-red-800 mb-1">Pending</Badge>
                              <div className="text-sm text-gray-600">₹0 / ₹85,000</div>
                              <div className="text-xs text-gray-500">Payment overdue</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>3 days ago</div>
                              <div className="text-gray-600">Video: Python Basics</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Pending</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" title="View Profile">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Send Message">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" title="Edit Student">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" title="Remove Student">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Student Dashboard */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Link href="/dashboard">
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Student Dashboard</h3>
                    <p className="text-sm text-gray-600">View student learning progress and analytics</p>
                  </Link>
                </CardContent>
              </Card>

              {/* Fee Dashboard */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <CreditCard className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Fee Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-4">Track payments and financial analytics</p>
                  <Link href="/admin/fee-dashboard">
                    <Button className="w-full">
                      Access Fee Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Student Admissions */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Student Admissions</h3>
                  <p className="text-sm text-gray-600 mb-4">Manage admission workflow and applications</p>
                  <Link href="/admin/student-admissions">
                    <Button className="w-full">
                      Access Student Admissions
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Platform Settings */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Platform Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">Configure platform branding and settings</p>
                  <Link href="/admin/platform-settings">
                    <Button className="w-full">
                      Access Platform Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Batches Management */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Layout className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Batches Management</h3>
                  <p className="text-sm text-gray-600">Organize students into batches with mentors</p>
                </CardContent>
              </Card>

              {/* Advanced Analytics */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Link href="/advanced-dashboard">
                    <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                    <p className="text-sm text-gray-600">Detailed learning analytics and insights</p>
                  </Link>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showAddVideo && (
        <AddVideoModal
          isOpen={showAddVideo}
          onClose={() => setShowAddVideo(false)}
        />
      )}
      
      <EditVideoModal
        video={editingVideo}
        isOpen={showEditVideo}
        onClose={handleCloseEditVideo}
      />

      <AddMentorModal
        isOpen={showAddMentor}
        onClose={() => setShowAddMentor(false)}
      />
    </div>
  );
}
