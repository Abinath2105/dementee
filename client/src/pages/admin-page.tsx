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
import { Play, Video, Users, Eye, Clock, Plus, Edit, Trash2, ArrowLeft, Shield, UserCheck, EyeOff, UserPlus, Mail, Palette, KeyRound } from "lucide-react";
import { AddVideoModal } from "@/components/add-video-modal";
import { EditVideoModal } from "@/components/edit-video-modal";
import { InviteUserModal } from "@/components/invite-user-modal";
import { AppSettingsModal } from "@/components/app-settings-modal";
import { AddCategoryModal } from "@/components/add-category-modal";
import { EditCategoryModal } from "@/components/edit-category-modal";
import { AssignCategoryModal } from "@/components/assign-category-modal";
import { ResetPasswordModal } from "@/components/reset-password-modal";
import { CategoryCard } from "@/components/category-card";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoWithCategory, AdminStats, User, Category, UserInvitation } from "@shared/schema";

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [editingVideo, setEditingVideo] = useState<VideoWithCategory | null>(null);
  const [showEditVideo, setShowEditVideo] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAssignCategory, setShowAssignCategory] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
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

  const { data: invitations = [] } = useQuery<UserInvitation[]>({
    queryKey: ["/api/admin/invitations"],
  });

  const { data: appSettings } = useQuery({
    queryKey: ["/api/settings"],
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

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete invitation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      toast({
        title: "Invitation deleted",
        description: "Invitation deleted successfully",
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

  const handleDeleteInvitation = (invitationId: number) => {
    if (confirm("Are you sure you want to delete this invitation?")) {
      deleteInvitationMutation.mutate(invitationId);
    }
  };

  const handleEditVideo = (video: VideoWithCategory) => {
    setEditingVideo(video);
    setShowEditVideo(true);
  };

  const handleCloseEditVideo = () => {
    setEditingVideo(null);
    setShowEditVideo(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowEditCategory(true);
  };

  const handleCloseEditCategory = () => {
    setEditingCategory(null);
    setShowEditCategory(false);
  };

  const handleAssignCategory = (userItem: User) => {
    setSelectedUser(userItem);
    setShowAssignCategory(true);
  };

  const handleCloseAssignCategory = () => {
    setSelectedUser(null);
    setShowAssignCategory(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Mobile Responsive */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              {appSettings?.appLogo ? (
                <img src={appSettings.appLogo} alt="Zmartclass Logo" className="h-8 w-auto mr-2 sm:mr-3 flex-shrink-0" />
              ) : (
                <div className="flex flex-col leading-tight mr-2 sm:mr-3 flex-shrink-0">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">Zmartclass</div>
                  <div className="text-xs text-gray-500 font-normal -mt-1 text-right">De mentee</div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link href="/">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Videos
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your video content and monitor platform activity</p>
        </div>

        {/* Stats - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total Videos</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {stats?.totalVideos || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Active Users</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total Views</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {stats?.totalViews || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Watch Time</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {stats?.totalWatchTime || "0h"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different management sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                            <div className="max-w-[150px]">
                              <Badge 
                                variant="outline" 
                                className="truncate block"
                                title={video.category.name}
                              >
                                {video.category.name}
                              </Badge>
                            </div>
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


          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button onClick={() => setShowAddCategory(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => {
                const categoryVideoCount = videos.filter(v => v.categoryId === category.id).length;
                return (
                  <div key={category.id} className="space-y-2">
                    <div className="relative group">
                      <CategoryCard
                        category={category}
                        videoCount={categoryVideoCount}
                        onClick={() => {}}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCategory(category)}
                          className="bg-white/90 hover:bg-white shadow-sm"
                          title="Edit category"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                          className="bg-red-500 hover:bg-red-600 text-white shadow-sm"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Action buttons below each category */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCategory(category)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {categories.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">No categories yet</div>
                  <Button onClick={() => setShowAddCategory(true)}>
                    Create your first category
                  </Button>
                </div>
              )}
            </div>
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
                        <TableHead>Role</TableHead>
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
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-600">
                                    {userItem.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {userItem.fullName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{userItem.username}
                                  </div>
                                </div>
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
                                <div className="flex items-center space-x-1">
                                  {userItem.isAdmin ? (
                                    <>
                                      <Shield className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs text-blue-600 font-medium">Admin</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-600">Student</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`/admin/student/${userItem.id}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="View student analytics"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignCategory(userItem)}
                                  disabled={userItem.isAdmin}
                                  title={userItem.isAdmin ? "Admins have access to all categories" : "Manage category access"}
                                  className="relative"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  {!userItem.isAdmin && (
                                    <span className="sr-only">Assign Categories</span>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setResetPasswordUser(userItem);
                                    setShowResetPassword(true);
                                  }}
                                  title="Reset Password"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  disabled={deleteUserMutation.isPending || userItem.id === user?.id}
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

          <TabsContent value="invitations" className="mt-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button onClick={() => setShowInviteUser(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite New User
              </Button>
            </div>

            {/* Invitations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Invited Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No pending invitations
                          </TableCell>
                        </TableRow>
                      ) : (
                        invitations.map((invitation) => (
                          <TableRow key={invitation.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{invitation.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={invitation.role === 'admin' ? 'destructive' : 'default'}>
                                {invitation.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                invitation.acceptedAt ? "default" : 
                                new Date(invitation.expiresAt) < new Date() ? "destructive" : 
                                "secondary"
                              }>
                                {invitation.acceptedAt ? "Accepted" : 
                                 new Date(invitation.expiresAt) < new Date() ? "Expired" : 
                                 "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                disabled={deleteInvitationMutation.isPending}
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

          <TabsContent value="settings" className="mt-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button onClick={() => setShowAppSettings(true)}>
                <Palette className="h-4 w-4 mr-2" />
                Customize App
              </Button>
            </div>

            {/* Settings Overview */}
            <Card>
              <CardHeader>
                <CardTitle>App Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Branding</h3>
                      <p className="text-sm text-gray-600 mb-4">Customize your app's appearance and branding</p>
                      <Button onClick={() => setShowAppSettings(true)}>
                        Edit Branding
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">User Management</h3>
                      <p className="text-sm text-gray-600 mb-4">Control user access through email invitations</p>
                      <Button onClick={() => setShowInviteUser(true)}>
                        Invite Users
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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

      <InviteUserModal
        isOpen={showInviteUser}
        onClose={() => setShowInviteUser(false)}
      />

      <AppSettingsModal
        isOpen={showAppSettings}
        onClose={() => setShowAppSettings(false)}
      />

      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
      />

      <EditCategoryModal
        category={editingCategory}
        isOpen={showEditCategory}
        onClose={handleCloseEditCategory}
      />

      <AssignCategoryModal
        user={selectedUser}
        isOpen={showAssignCategory}
        onClose={handleCloseAssignCategory}
      />

      <ResetPasswordModal
        open={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        user={resetPasswordUser}
      />
    </div>
  );
}
