import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Mail, Briefcase, Calendar, CheckCircle, Users, Video, ArrowLeft, Camera, Image, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import type { Mentor } from "@shared/schema";

interface MentorProfile extends Mentor {
  hasCredentials: boolean;
}

export default function MentorProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [backgroundUploadOpen, setBackgroundUploadOpen] = useState(false);

  // Fetch mentor profile data
  const { data: mentorProfile, isLoading, error } = useQuery<MentorProfile>({
    queryKey: ["/api/mentor/profile"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !mentorProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-4">Unable to load your mentor profile.</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <ArrowLeft className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-gray-900 font-medium">Back</span>
                </div>
              </Link>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cover Photo Area */}
          <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-lg -mb-16 relative overflow-hidden">
            {mentorProfile.backgroundImage ? (
              <img
                src={mentorProfile.backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-black/10"></div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={() => setBackgroundUploadOpen(true)}
            >
              <Image className="h-4 w-4 mr-2" />
              {mentorProfile.backgroundImage ? "Change Background" : "Add Background"}
            </Button>
          </div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
              <div className="relative mb-4 sm:mb-0">
                <Avatar className="h-40 w-40 border-4 border-white shadow-xl bg-white relative z-10">
                  <AvatarImage 
                    src={mentorProfile.photo || undefined} 
                    alt={mentorProfile.name}
                  />
                  <AvatarFallback className="text-4xl font-bold bg-blue-600 text-white">
                    {getInitials(mentorProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 bg-white shadow-md hover:bg-gray-50 rounded-full p-2"
                  onClick={() => setPhotoUploadOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4 sm:mt-0 flex-1">
                <div className="mb-4">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{mentorProfile.name}</h1>
                  <p className="text-xl text-gray-600 font-medium">{mentorProfile.profession}</p>
                  <p className="text-gray-500 mt-1">{mentorProfile.experience} experience</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center">
                    {mentorProfile.isActive ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-700 font-medium bg-green-50 px-3 py-1 rounded-full">Active Mentor</span>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-sm text-yellow-700 font-medium bg-yellow-50 px-3 py-1 rounded-full">Pending Activation</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{mentorProfile.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Passionate software engineer with over 10 years of experience in full-stack development, cloud architecture, and team leadership. I love mentoring developers and sharing knowledge about modern web technologies, DevOps practices, and career growth in tech.
                </p>
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-gray-600" />
                  Professional Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{mentorProfile.profession}</h3>
                      <p className="text-gray-600">VideoLearn Pro Platform</p>
                      <p className="text-sm text-gray-500 mt-1">{mentorProfile.experience}</p>
                      <div className="flex items-center mt-2">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          Since {formatDate(mentorProfile.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Expertise */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-sm py-1 px-3">React Development</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">Node.js</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">TypeScript</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">System Design</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">Cloud Architecture</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">Team Leadership</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">Mentoring</Badge>
                  <Badge variant="secondary" className="text-sm py-1 px-3">DevOps</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Activity Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Video className="h-5 w-5 mr-2 text-gray-600" />
                  Teaching Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">24</div>
                    <div className="text-sm text-gray-600">Videos Created</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">1,247</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">89</div>
                    <div className="text-sm text-gray-600">Students Mentored</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-gray-600">{mentorProfile.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Position</div>
                    <div className="text-sm text-gray-600">{mentorProfile.profession}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <Badge variant={mentorProfile.isActive ? "default" : "secondary"} 
                           className={mentorProfile.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                      {mentorProfile.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {mentorProfile.activatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Activated</span>
                      <span className="text-sm text-gray-600">
                        {formatDate(mentorProfile.activatedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Joined</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(mentorProfile.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Manage Videos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Photo Upload Modals */}
      <PhotoUploadModal
        isOpen={photoUploadOpen}
        onClose={() => setPhotoUploadOpen(false)}
        uploadType="photo"
        currentImage={mentorProfile.photo}
      />
      
      <PhotoUploadModal
        isOpen={backgroundUploadOpen}
        onClose={() => setBackgroundUploadOpen(false)}
        uploadType="background"
        currentImage={mentorProfile.backgroundImage}
      />
    </div>
  );
}