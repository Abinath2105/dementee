import { useState } from "react";
import EventApplicationModal from '@/components/event-application-modal';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Play, 
  Users, 
  BookOpen, 
  Trophy, 
  Star, 
  CheckCircle,
  ArrowRight,
  Video,
  GraduationCap,
  Target,
  Zap,
  Clock,
  Award,
  Mail,
  Eye,
  Calendar,
  Newspaper
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type ContactForm = z.infer<typeof contactSchema>;

export function LandingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("events");

  // Fetch app settings for dynamic content
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Fetch categories for course showcase
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch some featured videos
  const { data: featuredVideos } = useQuery({
    queryKey: ["/api/videos"],
  });

  // Fetch active events for landing page display
  const { data: events = [] } = useQuery({
    queryKey: ["/api/events", "public"],
    queryFn: () => fetch("/api/events?public=true&status=active").then(res => res.json()),
  });

  // Fetch blog posts for news section
  const { data: blogPosts = [] } = useQuery({
    queryKey: ["/api/blog", "published"],
    queryFn: () => fetch("/api/blog?status=published&public=true").then(res => res.json()),
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/login", {
        email: data.username,
        password: data.password
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Refetch user data to update auth state
      window.location.href = "/home";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you soon.",
      });
      contactForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    loginMutation.mutate(data);
    setIsLoading(false);
  };

  const onContactSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  // If user is already logged in, redirect to home
  if (user) {
    navigate("/home");
    return null;
  }

  const stats = [
    { icon: Users, label: settings?.stat1Label || "Active Students", value: settings?.stat1Value || "10,000+", color: "text-blue-600" },
    { icon: BookOpen, label: settings?.stat2Label || "Courses", value: settings?.stat2Value || categories?.length || "50+", color: "text-green-600" },
    { icon: Video, label: settings?.stat3Label || "Video Lessons", value: settings?.stat3Value || featuredVideos?.length || "500+", color: "text-purple-600" },
    { icon: Trophy, label: settings?.stat4Label || "Success Rate", value: settings?.stat4Value || "95%", color: "text-orange-600" },
  ];

  const features = [
    {
      icon: GraduationCap,
      title: settings?.feature1Title || "Expert-Led Courses",
      description: settings?.feature1Description || "Learn from industry professionals with real-world experience",
    },
    {
      icon: Target,
      title: settings?.feature2Title || "Practical Learning",
      description: settings?.feature2Description || "Hands-on projects and real case studies to build your portfolio",
    },
    {
      icon: Zap,
      title: settings?.feature3Title || "Fast-Track Progress",
      description: settings?.feature3Description || "Accelerated learning paths designed for busy professionals",
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Learn at your own pace with lifetime access to content",
    },
    {
      icon: Award,
      title: "Certification",
      description: "Earn recognized certificates upon course completion",
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join a thriving community of learners and mentors",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex flex-col leading-tight">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">Zmartclass</div>
                <div className="text-xs sm:text-sm text-gray-500 font-normal -mt-1 text-right">De mentee</div>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">About Us</a>
              <a href="#programs" className="text-gray-700 hover:text-blue-600 font-medium">Our Programs</a>
              <a href="#events-news" className="text-gray-700 hover:text-blue-600 font-medium">Events & News</a>
              <a href="#jobs" className="text-gray-700 hover:text-blue-600 font-medium">Jobs</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
              <Button 
                onClick={() => navigate("/register")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Get Started
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-4">
              <a 
                href="#about" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </a>
              <a 
                href="#programs" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Our Programs
              </a>
              <a 
                href="#events-news" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events & News
              </a>
              <a 
                href="#jobs" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </a>
              <a 
                href="#contact" 
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <Button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/register");
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  🚀 New Course Alert
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  {settings?.heroTitle || "Transform Your Learning Journey"}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {settings?.heroSubtitle || "Join thousands of students advancing their careers with our expert-led courses"}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-lg"
                  onClick={() => navigate("/register")}
                >
                  {settings?.heroButtonText || "Get Started Today"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-gray-300 hover:border-blue-600 px-8 py-3 rounded-lg"
                  onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Explore Courses
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-2 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Login Card */}
            <div className="lg:justify-self-end w-full max-w-md">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Sign in to continue your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg"
                        disabled={isLoading || loginMutation.isPending}
                      >
                        {isLoading || loginMutation.isPending ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        onClick={() => navigate("/register")}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create Account
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {settings?.featuresTitle || "Why Choose Zmartclass?"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide everything you need to succeed in your learning journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Preview Section */}
      <section id="courses" className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Popular Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our most popular courses designed by industry experts
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories?.slice(0, 6).map((category, index) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  {category.backgroundImage ? (
                    <img 
                      src={category.backgroundImage} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-gray-900">
                      Course
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description || "Comprehensive course covering all essential topics"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        <span>Multiple lessons</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        <span>4.9</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate("/register")}
                    >
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      {events && events.length > 0 && (
        <section id="events" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Upcoming Events & Workshops
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join our live sessions, workshops, and webinars to enhance your learning experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 6).map((event: any) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-green-500 to-blue-600 relative">
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="h-16 w-16 text-white/80" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-gray-900">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/70 text-white">
                        {new Date(event.startDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{event.currentParticipants}/{event.maxParticipants}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setSelectedEvent(event);
                          setApplicationModalOpen(true);
                        }}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Events and News Section */}
      {(events.length > 0 || blogPosts.length > 0) && (
        <section id="events-news" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Events and News
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Stay updated with our upcoming events and latest news
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto">
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="news" className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  News ({blogPosts.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="events" className="mt-0">
                {events.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.slice(0, 6).map((event: any) => (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                        {event.coverImage && (
                          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                            <img 
                              src={event.coverImage} 
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-blue-600 text-white">
                                {event.type}
                              </Badge>
                            </div>
                            {event.isPublic && (
                              <div className="absolute top-4 right-4">
                                <Badge className="bg-green-600 text-white">
                                  Open to All
                                </Badge>
                              </div>
                            )}
                            <div className="absolute bottom-4 left-4">
                              <Badge className="bg-black/70 text-white">
                                {new Date(event.startDate).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {event.description}
                          </p>
                          <div className="space-y-2 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(event.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <span>By {event.instructorName || 'Admin'}</span>
                            </div>
                            {event.meetingLink && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(event.meetingLink, '_blank')}
                              >
                                Join Event
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No Upcoming Events</h3>
                    <p className="text-gray-400">Check back soon for exciting events and workshops!</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="news" className="mt-0">
                {blogPosts.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.slice(0, 6).map((post: any) => (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                        <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-600 relative">
                          {post.coverImage ? (
                            <img 
                              src={post.coverImage} 
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-16 w-16 text-white/80" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-purple-600 text-white">
                              {post.status}
                            </Badge>
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-gray-700 text-white">
                                {post.tags[0]}
                              </Badge>
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4">
                            <Badge className="bg-black/70 text-white">
                              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {post.excerpt || post.content?.substring(0, 120) + '...'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {post.author || 'Admin'}</span>
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                <span>{post.viewCount || 0}</span>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.location.href = `/blog/${post.slug}`}
                            >
                              Read More
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No News Articles</h3>
                    <p className="text-gray-400">Stay tuned for the latest updates and insights!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      )}

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 inline-block">
              {settings?.aboutTitle || "About Zmartclass"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-8">
              {settings?.aboutDescription || "We're dedicated to making quality education accessible to everyone. Our platform combines cutting-edge technology with expert instruction to deliver exceptional learning experiences."}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                At Zmartclass, we believe that education should be accessible to everyone, regardless of their location or background. 
                Our platform connects learners with industry experts and provides practical, hands-on learning experiences that prepare 
                students for real-world challenges.
              </p>
              <p className="text-gray-600">
                Founded by De mentee, we combine cutting-edge technology with proven educational methodologies to create an 
                engaging learning environment that adapts to each student's needs and pace.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Expert Instructors</h4>
                    <p className="text-sm text-gray-600">Learn from industry professionals</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Practical Learning</h4>
                    <p className="text-sm text-gray-600">Real-world projects and applications</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Community Support</h4>
                    <p className="text-sm text-gray-600">Collaborative learning environment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Programs Section */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive learning programs designed to help you achieve your career goals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Video className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Video-Based Learning</h3>
              <p className="text-gray-600 mb-6">
                Engaging video content with interactive elements, quizzes, and practical exercises to reinforce learning.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  HD quality video lessons
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Interactive assignments
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Progress tracking
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Certification Programs</h3>
              <p className="text-gray-600 mb-6">
                Earn recognized certifications that validate your skills and enhance your professional profile.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Industry-recognized certificates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Skill assessments
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Career advancement
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mentorship Programs</h3>
              <p className="text-gray-600 mb-6">
                Connect with experienced professionals who provide guidance and support throughout your learning journey.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  One-on-one mentorship
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Career guidance
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Industry insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Career Opportunities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Launch your career with our job placement assistance and career development programs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Job Placement Support</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Resume Building</h4>
                    <p className="text-gray-600">Professional resume templates and guidance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Interview Preparation</h4>
                    <p className="text-gray-600">Mock interviews and feedback sessions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Industry Connections</h4>
                    <p className="text-gray-600">Network with hiring partners and employers</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Current Job Openings</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">Frontend Developer</h4>
                      <p className="text-sm text-gray-600">Remote • Full-time</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">New</Badge>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">UI/UX Designer</h4>
                      <p className="text-sm text-gray-600">Hybrid • Full-time</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Featured</Badge>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">Data Analyst</h4>
                      <p className="text-sm text-gray-600">Remote • Part-time</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Remote</Badge>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                View All Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {settings?.contactTitle || "Get In Touch"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {settings?.contactDescription || "Ready to start your learning journey? Contact us today!"}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-600">{settings?.contactEmail || "info@zmartclass.com"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-600">Join our community of learners</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-600">24/7 student support</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Office Hours</h3>
                  <div className="space-y-2 text-gray-600">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                  <FormField
                    control={contactForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contactForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How can we help you?"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful students who have transformed their careers with our courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium"
              onClick={() => navigate("/register")}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-medium"
              onClick={() => navigate("/register")}
            >
              View All Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-6 inline-block">
                <div className="flex flex-col leading-tight">
                  <span>Zmartclass</span>
                  <span className="text-lg text-gray-400 font-normal -mt-1 text-right">De mentee</span>
                </div>
              </h3>
              <p className="text-gray-400 mb-4">
                Empowering learners worldwide with high-quality, accessible education through innovative video-based courses. De mentee's mission is to make quality education accessible to everyone.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">Lifetime Access</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm">Expert Support</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Courses</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Zmartclass. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Event Application Modal */}
      <EventApplicationModal
        isOpen={applicationModalOpen}
        onClose={() => {
          setApplicationModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
}