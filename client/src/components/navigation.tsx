import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  User, 
  Settings, 
  LogOut, 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  GraduationCap,
  Heart,
  Bookmark,
  Award,
  Bell,
  ChevronDown
} from "lucide-react";

export function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return null;
  }

  const isAdmin = user.isAdmin;
  const isMentor = user.isMentor;
  const isStudent = !isAdmin && !isMentor;

  const studentNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/advanced-dashboard", label: "Analytics", icon: TrendingUp },
    { href: "/assignments", label: "Assignments", icon: BookOpen },
  ];

  const userMenuItems = [
    ...(isStudent ? [
      { href: "/student/profile", label: "My Profile", icon: User },
      { href: "/dashboard", label: "Learning Dashboard", icon: BarChart3 },
      { href: "/watchlist", label: "Watchlist", icon: Heart },
      { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
      { href: "/achievements", label: "Achievements", icon: Award },
    ] : []),
    ...(isMentor ? [
      { href: "/mentor/profile", label: "Mentor Profile", icon: User },
      { href: "/mentor/dashboard", label: "Mentor Dashboard", icon: BarChart3 },
    ] : []),
    ...(isAdmin ? [
      { href: "/admin", label: "Admin Panel", icon: Settings },
      { href: "/admin/users", label: "User Management", icon: User },
    ] : []),
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Play className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-gray-900">VideoLearn Pro</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Student Navigation - Main Focus */}
            {isStudent && (
              <div className="hidden md:flex items-center space-x-2">
                {studentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button 
                        variant={isActive ? "default" : "ghost"} 
                        size="sm"
                        className={isActive ? "bg-primary text-white" : ""}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Admin/Mentor Quick Actions */}
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>

            {/* User Avatar & Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium">{user.fullName || user.username}</span>
                      <div className="flex items-center space-x-1">
                        {isAdmin && <Badge variant="destructive" className="text-xs">Admin</Badge>}
                        {isMentor && <Badge variant="secondary" className="text-xs">Mentor</Badge>}
                        {isStudent && <Badge variant="outline" className="text-xs">Student</Badge>}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* User Menu Items */}
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem className="cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isStudent && (
          <div className="md:hidden pb-3 border-t border-gray-200 mt-3 pt-3">
            <div className="flex space-x-2 overflow-x-auto">
              {studentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "default" : "ghost"} 
                      size="sm"
                      className={`whitespace-nowrap ${isActive ? "bg-primary text-white" : ""}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}