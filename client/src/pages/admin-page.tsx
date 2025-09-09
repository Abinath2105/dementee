import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Video, Users, Eye, Clock, Plus, Edit, Trash2, ArrowLeft, Shield, UserCheck, EyeOff, UserPlus, Mail, Palette, KeyRound, Menu, X, FolderOpen, Bell, Calendar, FileText, Search, Filter } from "lucide-react";
import { AddVideoModal } from "@/components/add-video-modal";
import { EditVideoModal } from "@/components/edit-video-modal";
import { InviteUserModal } from "@/components/invite-user-modal";
import { AppSettingsModal } from "@/components/app-settings-modal";
import { AddCategoryModal } from "@/components/add-category-modal";
import { EditCategoryModal } from "@/components/edit-category-modal";
import { AssignCategoryModal } from "@/components/assign-category-modal";
import { ResetPasswordModal } from "@/components/reset-password-modal";
import { CategoryCard } from "@/components/category-card";
import BroadcastNotificationModal from "@/components/broadcast-notification-modal";
import EventModal from "@/components/event-modal";
import BlogPostModal from "@/components/blog-post-modal";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VideoWithCategory, AdminStats, User, Category, UserInvitation } from "@shared/schema";

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search and filter states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userVerificationFilter, setUserVerificationFilter] = useState("all");
  const [publicUserSearchTerm, setPublicUserSearchTerm] = useState("");
  
  // New feature states
  const [showBroadcastNotification, setShowBroadcastNotification] = useState(false);
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [showEvent, setShowEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showBlogPost, setShowBlogPost] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);
  
  // Confirmation dialog states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState<{
    title: string;
    description: string;
    confirmText: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);
  
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

  const { data: publicUsers = [], isLoading: publicUsersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/public-users"],
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

  // New feature queries
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/notifications"],
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: blogPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/blog"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => {
      return apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
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

  const convertPublicUserMutation = useMutation({
    mutationFn: async (publicUserId: number) => {
      const response = await fetch(`/api/admin/public-users/${publicUserId}/convert`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to convert public user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/public-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "Public user converted to student successfully",
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

  // New feature delete mutations
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete notification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Notification deleted",
        description: "Broadcast notification deleted successfully",
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

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Event deleted",
        description: "Event deleted successfully",
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

  const deleteBlogPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete blog post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({
        title: "Blog post deleted",
        description: "Blog post deleted successfully",
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
    const video = videos.find(v => v.id === videoId);
    setConfirmationConfig({
      title: "Delete Video",
      description: `Are you sure you want to delete the video "${video?.title}"? This action cannot be undone.`,
      confirmText: "Delete Video",
      variant: "destructive",
      onConfirm: () => deleteVideoMutation.mutate(videoId)
    });
    setShowConfirmation(true);
  };

  const handleAdminToggle = (userId: number, isAdmin: boolean) => {
    const user = users.find(u => u.id === userId);
    const action = isAdmin ? "grant admin privileges to" : "remove admin privileges from";
    setConfirmationConfig({
      title: isAdmin ? "Grant Admin Access" : "Remove Admin Access",
      description: `Are you sure you want to ${action} "${user?.fullName || user?.email}"? This will ${isAdmin ? "give them full administrative access" : "restrict them to regular user access"}.`,
      confirmText: isAdmin ? "Grant Admin" : "Remove Admin",
      variant: "default",
      onConfirm: () => updateUserAdminMutation.mutate({ userId, isAdmin })
    });
    setShowConfirmation(true);
  };

  const handleDeleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setConfirmationConfig({
      title: "Delete User Account",
      description: `Are you sure you want to delete the user "${user?.fullName || user?.email}"? This action cannot be undone and will permanently remove all user data.`,
      confirmText: "Delete User",
      variant: "destructive",
      onConfirm: () => deleteUserMutation.mutate(userId)
    });
    setShowConfirmation(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    setConfirmationConfig({
      title: "Delete Category",
      description: `Are you sure you want to delete the category "${category?.name}"? All videos in this category will be uncategorized.`,
      confirmText: "Delete Category",
      variant: "destructive",
      onConfirm: () => deleteCategoryMutation.mutate(categoryId)
    });
    setShowConfirmation(true);
  };

  // New feature handlers
  const handleDeleteNotification = async (notificationId: number) => {
    setConfirmationConfig({
      title: "Delete Notification",
      description: "Are you sure you want to delete this notification? This action cannot be undone.",
      confirmText: "Delete Notification",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/notifications/${notificationId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to delete notification");
          
          queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
          toast({
            title: "Success",
            description: "Notification deleted successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to delete notification",
            variant: "destructive",
          });
        }
      }
    });
    setShowConfirmation(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    setConfirmationConfig({
      title: "Delete Event",
      description: "Are you sure you want to delete this event? This action cannot be undone.",
      confirmText: "Delete Event",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/events/${eventId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to delete event");
          
          queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
          toast({
            title: "Success",
            description: "Event deleted successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to delete event",
            variant: "destructive",
          });
        }
      }
    });
    setShowConfirmation(true);
  };

  const handleDeleteBlogPost = async (postId: number) => {
    setConfirmationConfig({
      title: "Delete Blog Post",
      description: "Are you sure you want to delete this blog post? This action cannot be undone.",
      confirmText: "Delete Post",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/blog/${postId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to delete blog post");
          
          queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
          toast({
            title: "Success",
            description: "Blog post deleted successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to delete blog post",
            variant: "destructive",
          });
        }
      }
    });
    setShowConfirmation(true);
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
    setConfirmationConfig({
      title: "Delete Invitation",
      description: "Are you sure you want to delete this invitation? This action cannot be undone.",
      confirmText: "Delete Invitation",
      variant: "destructive",
      onConfirm: () => deleteInvitationMutation.mutate(invitationId)
    });
    setShowConfirmation(true);
  };

  const deletePublicUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/public-users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete public user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/public-users"] });
      toast({
        title: "Public user deleted",
        description: "Public user deleted successfully",
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

  const handleDeletePublicUser = (userId: number) => {
    const user = publicUsers.find(u => u.id === userId);
    setConfirmationConfig({
      title: "Delete Public User",
      description: `Are you sure you want to delete the public user "${user?.fullName || user?.email}"? This action cannot be undone.`,
      confirmText: "Delete User",
      variant: "destructive",
      onConfirm: () => deletePublicUserMutation.mutate(userId)
    });
    setShowConfirmation(true);
  };

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Failed to resend verification email");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification email sent",
        description: data.message,
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

  const convertToStudentMutation = useMutation({
    mutationFn: async (publicUser: any) => {
      const response = await fetch("/api/admin/convert-public-to-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          publicUserId: publicUser.id,
          email: publicUser.email,
          fullName: publicUser.fullName 
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to convert to student");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/public-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "User converted successfully",
        description: `${data.user.fullName} is now a student with full access. Login credentials sent to their email.`,
        duration: 8000,
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

  const handleResendVerification = (email: string) => {
    resendVerificationMutation.mutate(email);
  };

  const handleConvertToStudent = (publicUser: any) => {
    if (confirm(`Convert ${publicUser.fullName} (${publicUser.email}) to a full student account with category access? They will receive login credentials via email.`)) {
      convertToStudentMutation.mutate(publicUser);
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

  const handleRoleChange = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}/role`, { isAdmin });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChangeAction = (userId: number, isAdmin: boolean) => {
    const user = users.find(u => u.id === userId);
    const action = isAdmin ? "promote to admin" : "demote to regular user";
    setConfirmationConfig({
      title: isAdmin ? "Promote to Admin" : "Demote to User",
      description: `Are you sure you want to ${action} "${user?.fullName || user?.email}"?`,
      confirmText: isAdmin ? "Promote" : "Demote",
      variant: "default",
      onConfirm: () => handleRoleChange.mutate({ userId, isAdmin })
    });
    setShowConfirmation(true);
  };

  const handleCloseAssignCategory = () => {
    setSelectedUser(null);
    setShowAssignCategory(false);
  };

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = userSearchTerm === "" || 
        user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase());
      
      const matchesRole = userRoleFilter === "all" || 
        (userRoleFilter === "admin" && user.isAdmin) ||
        (userRoleFilter === "student" && !user.isAdmin);
      
      const matchesVerification = userVerificationFilter === "all" ||
        (userVerificationFilter === "verified" && user.isVerified) ||
        (userVerificationFilter === "unverified" && !user.isVerified);
      
      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, userSearchTerm, userRoleFilter, userVerificationFilter]);

  // Filtered public users based on search
  const filteredPublicUsers = useMemo(() => {
    return publicUsers.filter(user => {
      return publicUserSearchTerm === "" ||
        user.fullName?.toLowerCase().includes(publicUserSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(publicUserSearchTerm.toLowerCase());
    });
  }, [publicUsers, publicUserSearchTerm]);



  const sidebarItems = [
    { id: "videos", label: "Videos", icon: Video },
    { id: "categories", label: "Categories", icon: Play },
    { id: "users", label: "Users", icon: Users },
    { id: "public-users", label: "Public Users", icon: UserPlus },
    { id: "invitations", label: "Invitations", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "events", label: "Events", icon: Calendar },
    { id: "blog", label: "Blog Posts", icon: FileText },
    { id: "settings", label: "Settings", icon: Palette },
  ];

  const SidebarContent = () => (
    <div className="space-y-2 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Admin Dashboard</h2>
        <p className="text-sm text-gray-600">Manage your platform</p>
      </div>
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - Mobile Responsive */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              {/* Mobile menu button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="mr-3 md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              
              <div className="flex flex-col leading-tight mr-2 sm:mr-3 flex-shrink-0">
                <div className="text-base sm:text-lg font-bold text-blue-600">Zmartclass</div>
                <div className="text-xs text-gray-500 font-normal -mt-1 text-right">De mentee</div>
              </div>
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

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-14 lg:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <SidebarContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64">
          <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header - Mobile Responsive */}
            <div className="mb-6 sm:mb-8 md:hidden">
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

            {/* Content based on active tab */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === "videos" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Video Management</h2>
                      <p className="text-sm text-gray-600">Add, edit, and manage your video content</p>
                    </div>
                    <Button onClick={() => setShowAddVideo(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Video
                    </Button>
                  </div>
                  
                  {/* Mobile Videos View */}
                  <div className="block md:hidden space-y-4">
                    {videos.map((video) => (
                      <Card key={video.id} className="p-4">
                        <div className="flex space-x-3">
                          <img
                            src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-20 h-15 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://img.youtube.com/vi/${video.youtubeId}/default.jpg`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{video.title}</h3>
                            <p className="text-xs text-gray-500 mb-2">YouTube ID: {video.youtubeId}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {video.categories?.map((category, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {category.name}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{video.views}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingVideo(video);
                                    setShowEditVideo(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteVideo(video.id)}
                                  disabled={deleteVideoMutation.isPending}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Video Table */}
                  <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[250px]">Title</TableHead>
                          <TableHead className="min-w-[200px]">Categories</TableHead>
                          <TableHead className="min-w-[80px]">Views</TableHead>
                          <TableHead className="min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {videos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                                  alt={video.title}
                                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://img.youtube.com/vi/${video.youtubeId}/default.jpg`;
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p 
                                    className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => handleEditVideo(video)}
                                    title="Click to edit video"
                                  >
                                    {video.title}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">YouTube ID: {video.youtubeId}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {video.categories?.map((category, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs truncate">
                                    {category.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{video.views}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingVideo(video);
                                    setShowEditVideo(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteVideo(video.id)}
                                  disabled={deleteVideoMutation.isPending}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {activeTab === "categories" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Category Management</h2>
                      <p className="text-sm text-gray-600">Organize your content with categories</p>
                    </div>
                    <Button onClick={() => setShowAddCategory(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <Card key={category.id} className="hover:shadow-md transition-shadow overflow-hidden">
                        {/* Cover Image */}
                        <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
                          {category.coverImage ? (
                            <img
                              src={category.coverImage}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <FolderOpen className="h-12 w-12 text-white opacity-80" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 text-lg">{category.name}</h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingCategory(category);
                              setShowEditCategory(true);
                            }}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteCategoryMutation.mutate(category.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === "users" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">User Management</h2>
                      <p className="text-sm text-gray-600">Manage user accounts and permissions ({filteredUsers.length} users)</p>
                    </div>
                    <Button onClick={() => setShowInviteUser(true)} className="w-full sm:w-auto">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search users by name, username, or email..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={userVerificationFilter} onValueChange={setUserVerificationFilter}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="unverified">Unverified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(userSearchTerm || userRoleFilter !== "all" || userVerificationFilter !== "all") && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Filter className="h-4 w-4" />
                        <span>Showing {filteredUsers.length} of {users.length} users</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserSearchTerm("");
                            setUserRoleFilter("all");
                            setUserVerificationFilter("all");
                          }}
                          className="ml-2 h-6 px-2"
                        >
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Users View */}
                  <div className="block md:hidden space-y-4">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No users found matching your criteria</p>
                      </div>
                    ) : (
                      filteredUsers.map((userItem) => (
                      <Card key={userItem.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm">{userItem.fullName}</h3>
                            <p className="text-xs text-gray-500 mb-1">@{userItem.username}</p>
                            <p className="text-xs text-gray-500 mb-2">{userItem.email}</p>
                            <div className="flex items-center space-x-2 mb-3">
                              {userItem.isAdmin ? (
                                <Badge variant="default" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  Student
                                </Badge>
                              )}
                              <Badge variant={userItem.isVerified ? "default" : "secondary"} className="text-xs">
                                {userItem.isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Switch
                                checked={userItem.isAdmin}
                                onCheckedChange={(checked) => handleRoleChangeAction(userItem.id, checked)}
                                disabled={userItem.id === user?.id}
                              />
                              <span className="text-xs text-gray-600">Admin Role</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleAssignCategory(userItem)} className="text-xs px-2 py-1">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Categories
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setResetPasswordUser(userItem);
                              setShowResetPassword(true);
                            }} className="text-xs px-2 py-1">
                              <KeyRound className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/student/${userItem.id}`)} className="text-xs px-2 py-1">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(userItem.id)}
                              disabled={userItem.id === user?.id || deleteUserMutation.isPending}
                              className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                    )}
                  </div>
                  
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>No users found matching your criteria</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell>
                              <div className="font-medium">{userItem.fullName}</div>
                              <div className="text-sm text-gray-500">@{userItem.username}</div>
                            </TableCell>
                            <TableCell>{userItem.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={userItem.isAdmin}
                                  onCheckedChange={(checked) => handleRoleChangeAction(userItem.id, checked)}
                                  disabled={userItem.id === user?.id} // Prevent self role change
                                />
                                <span className="text-sm">
                                  {userItem.isAdmin ? (
                                    <Badge variant="default">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <Users className="h-3 w-3 mr-1" />
                                      Student
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={userItem.isVerified ? "default" : "secondary"}>
                                {userItem.isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleAssignCategory(userItem)}>
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setResetPasswordUser(userItem);
                                  setShowResetPassword(true);
                                }}>
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/student/${userItem.id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  disabled={userItem.id === user?.id || deleteUserMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {activeTab === "public-users" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Public Users</h2>
                    <p className="text-sm text-gray-600">Users who registered through the landing page ({filteredPublicUsers.length} users)</p>
                  </div>
                  
                  {/* Search Control for Public Users */}
                  <div className="mb-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search public users by name or email..."
                        value={publicUserSearchTerm}
                        onChange={(e) => setPublicUserSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {publicUserSearchTerm && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Filter className="h-4 w-4" />
                        <span>Showing {filteredPublicUsers.length} of {publicUsers.length} users</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPublicUserSearchTerm("")}
                          className="ml-2 h-6 px-2"
                        >
                          Clear search
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPublicUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>{publicUserSearchTerm ? "No users found matching your search" : "No public users found"}</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPublicUsers.map((publicUser) => (
                          <TableRow key={publicUser.id}>
                            <TableCell>{publicUser.fullName}</TableCell>
                            <TableCell>{publicUser.email}</TableCell>
                            <TableCell>{new Date(publicUser.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => convertPublicUserMutation.mutate(publicUser.id)}
                                disabled={convertPublicUserMutation.isPending}
                              >
                                {convertPublicUserMutation.isPending ? "Converting..." : "Convert to Student"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {activeTab === "invitations" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invitations</h2>
                    <p className="text-sm text-gray-600">Manage pending user invitations</p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Invited By</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((invitation) => (
                          <TableRow key={invitation.id}>
                            <TableCell>{invitation.email}</TableCell>
                            <TableCell>{invitation.invitedBy}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Pending</Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Broadcast Notifications</h2>
                      <p className="text-sm text-gray-600">Send notifications to users and manage communication</p>
                    </div>
                    <Button onClick={() => setShowBroadcastNotification(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Notification
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifications.map((notification: any) => (
                          <TableRow key={notification.id}>
                            <TableCell className="font-medium">{notification.title}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{notification.type}</Badge>
                            </TableCell>
                            <TableCell>{notification.targetAudience}</TableCell>
                            <TableCell>
                              <Badge variant={notification.isActive ? "default" : "secondary"}>
                                {notification.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(notification.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingNotification(notification);
                                    setShowBroadcastNotification(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === "events" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Events Management</h2>
                      <p className="text-sm text-gray-600">Create and manage events, webinars, and workshops</p>
                    </div>
                    <Button onClick={() => setShowEvent(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Participants</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event: any) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{event.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={event.status === 'active' ? "default" : "secondary"}>
                                {event.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{event.currentParticipants}/{event.maxParticipants}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingEvent(event);
                                    setShowEvent(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Blog Posts Tab */}
              {activeTab === "blog" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Blog Management</h2>
                      <p className="text-sm text-gray-600">Create and manage blog posts and articles</p>
                    </div>
                    <Button onClick={() => navigate('/admin/blog/new')} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blogPosts.map((post: any) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell>{post.author}</TableCell>
                            <TableCell>
                              <Badge variant={post.status === 'published' ? "default" : "secondary"}>
                                {post.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{post.viewCount || 0}</TableCell>
                            <TableCell>
                              {post.isFeatured && (
                                <Badge variant="outline">Featured</Badge>
                              )}
                            </TableCell>
                            <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteBlogPost(post.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {activeTab === "settings" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">App Settings</h2>
                    <p className="text-sm text-gray-600">Configure your application settings</p>
                  </div>
                  <Button onClick={() => setShowAppSettings(true)}>
                    <Palette className="h-4 w-4 mr-2" />
                    Open Settings
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Components */}
      <AddVideoModal 
        isOpen={showAddVideo}
        onClose={() => setShowAddVideo(false)}
      />
      
      <EditVideoModal 
        video={editingVideo}
        isOpen={showEditVideo}
        onClose={() => setShowEditVideo(false)}
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
        onClose={() => setShowEditCategory(false)}
      />
      
      <AssignCategoryModal
        user={selectedUser}
        isOpen={showAssignCategory}
        onClose={handleCloseAssignCategory}
      />
      
      <ResetPasswordModal
        user={resetPasswordUser}
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
      />
      
      {/* New feature modals */}
      <BroadcastNotificationModal
        isOpen={showBroadcastNotification}
        onClose={() => {
          setShowBroadcastNotification(false);
          setEditingNotification(null);
        }}
        notification={editingNotification}
        mode={editingNotification ? 'edit' : 'create'}
      />
      
      <EventModal
        isOpen={showEvent}
        onClose={() => {
          setShowEvent(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        mode={editingEvent ? 'edit' : 'create'}
      />
      
      <BlogPostModal
        isOpen={showBlogPost}
        onClose={() => {
          setShowBlogPost(false);
          setEditingBlogPost(null);
        }}
        post={editingBlogPost}
        mode={editingBlogPost ? 'edit' : 'create'}
      />

      {/* Confirmation Dialog */}
      {confirmationConfig && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={confirmationConfig.onConfirm}
          title={confirmationConfig.title}
          description={confirmationConfig.description}
          confirmText={confirmationConfig.confirmText}
          variant={confirmationConfig.variant}
        />
      )}
    </div>
  );
}
