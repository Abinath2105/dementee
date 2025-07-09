import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LogOut, 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Target, 
  Clock, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter,
  ArrowLeft,
  Edit,
  Star,
  TrendingUp,
  Award,
  Play,
  Bookmark,
  Settings,
  Camera
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

interface StudentProfile extends UserType {
  completedVideos: number;
  totalWatchTime: number;
  skillsProgress: Array<{
    skill: string;
    level: number;
    progress: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export default function StudentProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    website: "",
    linkedinUrl: "",
    githubUrl: "",
    twitterUrl: "",
    skills: [] as string[],
    interests: [] as string[],
    learningGoals: [] as string[],
    experienceLevel: "beginner",
    preferredTopics: [] as string[],
    studySchedule: "",
    timezone: "",
  });
  
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Fetch student profile data
  const { data: studentProfile, isLoading, error } = useQuery<StudentProfile>({
    queryKey: ["/api/student/profile"],
    enabled: !!user,
  });

  // Fetch user progress stats
  const { data: progressStats } = useQuery({
    queryKey: ["/api/user/progress/stats"],
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("PUT", "/api/student/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form with current data
  const initializeEditForm = () => {
    if (studentProfile) {
      setEditForm({
        firstName: studentProfile.firstName || "",
        lastName: studentProfile.lastName || "",
        bio: studentProfile.bio || "",
        location: studentProfile.location || "",
        website: studentProfile.website || "",
        linkedinUrl: studentProfile.linkedinUrl || "",
        githubUrl: studentProfile.githubUrl || "",
        twitterUrl: studentProfile.twitterUrl || "",
        skills: studentProfile.skills || [],
        interests: studentProfile.interests || [],
        learningGoals: studentProfile.learningGoals || [],
        experienceLevel: studentProfile.experienceLevel || "beginner",
        preferredTopics: studentProfile.preferredTopics || [],
        studySchedule: studentProfile.studySchedule || "",
        timezone: studentProfile.timezone || "",
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skill)
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !editForm.interests.includes(newInterest.trim())) {
      setEditForm({
        ...editForm,
        interests: [...editForm.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setEditForm({
      ...editForm,
      interests: editForm.interests.filter(i => i !== interest)
    });
  };

  const addGoal = () => {
    if (newGoal.trim() && !editForm.learningGoals.includes(newGoal.trim())) {
      setEditForm({
        ...editForm,
        learningGoals: [...editForm.learningGoals, newGoal.trim()]
      });
      setNewGoal("");
    }
  };

  const removeGoal = (goal: string) => {
    setEditForm({
      ...editForm,
      learningGoals: editForm.learningGoals.filter(g => g !== goal)
    });
  };

  const addTopic = () => {
    if (newTopic.trim() && !editForm.preferredTopics.includes(newTopic.trim())) {
      setEditForm({
        ...editForm,
        preferredTopics: [...editForm.preferredTopics, newTopic.trim()]
      });
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setEditForm({
      ...editForm,
      preferredTopics: editForm.preferredTopics.filter(t => t !== topic)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load profile</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const displayName = studentProfile?.firstName && studentProfile?.lastName 
    ? `${studentProfile.firstName} ${studentProfile.lastName}`
    : studentProfile?.fullName || studentProfile?.username || "Student";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Learning
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={studentProfile?.avatar || ""} alt={displayName} />
                      <AvatarFallback>
                        {displayName.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    {displayName}
                  </h1>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{studentProfile?.email}</span>
                  </div>

                  {studentProfile?.location && (
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{studentProfile.location}</span>
                    </div>
                  )}

                  <Badge variant="secondary" className="mb-4">
                    {studentProfile?.experienceLevel || "Beginner"} Level
                  </Badge>

                  {studentProfile?.bio && (
                    <p className="text-gray-600 text-center text-sm mb-4">
                      {studentProfile.bio}
                    </p>
                  )}

                  {/* Social Links */}
                  <div className="flex space-x-2 mb-4">
                    {studentProfile?.website && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={studentProfile.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {studentProfile?.linkedinUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={studentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {studentProfile?.githubUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={studentProfile.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {studentProfile?.twitterUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={studentProfile.twitterUrl} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <Button onClick={initializeEditForm} className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Learning Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Videos Completed</span>
                    <span className="font-medium">
                      {progressStats?.completedVideos || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Watch Time</span>
                    <span className="font-medium">
                      {Math.round((progressStats?.totalWatchTime || 0) / 60)} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skill Level</span>
                    <Badge variant="outline">
                      {studentProfile?.experienceLevel || "Beginner"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile?.skills?.length ? (
                      studentProfile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No skills added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Interests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile?.interests?.length ? (
                      studentProfile.interests.map((interest) => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No interests added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Learning Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {studentProfile?.learningGoals?.length ? (
                      studentProfile.learningGoals.map((goal, index) => (
                        <div key={index} className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">{goal}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No learning goals set yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preferred Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Preferred Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile?.preferredTopics?.length ? (
                      studentProfile.preferredTopics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No preferred topics selected yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Study Schedule */}
              {studentProfile?.studySchedule && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Study Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{studentProfile.studySchedule}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select value={editForm.experienceLevel} onValueChange={(value) => setEditForm({...editForm, experienceLevel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={editForm.website}
                    onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                    placeholder="https://your-website.com"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn</Label>
                  <Input
                    id="linkedinUrl"
                    value={editForm.linkedinUrl}
                    onChange={(e) => setEditForm({...editForm, linkedinUrl: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <Label htmlFor="githubUrl">GitHub</Label>
                  <Input
                    id="githubUrl"
                    value={editForm.githubUrl}
                    onChange={(e) => setEditForm({...editForm, githubUrl: e.target.value})}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="twitterUrl">Twitter</Label>
                  <Input
                    id="twitterUrl"
                    value={editForm.twitterUrl}
                    onChange={(e) => setEditForm({...editForm, twitterUrl: e.target.value})}
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button type="button" onClick={addSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editForm.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Interests</h3>
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button type="button" onClick={addInterest}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editForm.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="cursor-pointer" onClick={() => removeInterest(interest)}>
                    {interest} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Learning Goals</h3>
              <div className="flex gap-2">
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add a learning goal..."
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                />
                <Button type="button" onClick={addGoal}>Add</Button>
              </div>
              <div className="space-y-2">
                {editForm.learningGoals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{goal}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeGoal(goal)}>×</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Topics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferred Topics</h3>
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Add a preferred topic..."
                  onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                />
                <Button type="button" onClick={addTopic}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editForm.preferredTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="cursor-pointer" onClick={() => removeTopic(topic)}>
                    {topic} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Study Schedule */}
            <div>
              <Label htmlFor="studySchedule">Study Schedule</Label>
              <Input
                id="studySchedule"
                value={editForm.studySchedule}
                onChange={(e) => setEditForm({...editForm, studySchedule: e.target.value})}
                placeholder="e.g., Weekends, 2-3 hours daily"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}