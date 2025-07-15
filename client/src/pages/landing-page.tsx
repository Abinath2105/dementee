import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
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
  Award
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LandingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

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

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/home");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    setIsLoading(true);
    loginMutation.mutate(data);
    setIsLoading(false);
  };

  // If user is already logged in, redirect to home
  if (user) {
    navigate("/home");
    return null;
  }

  const stats = [
    { icon: Users, label: "Active Students", value: "10,000+", color: "text-blue-600" },
    { icon: BookOpen, label: "Courses", value: categories?.length || "50+", color: "text-green-600" },
    { icon: Video, label: "Video Lessons", value: featuredVideos?.length || "500+", color: "text-purple-600" },
    { icon: Trophy, label: "Success Rate", value: "95%", color: "text-orange-600" },
  ];

  const features = [
    {
      icon: GraduationCap,
      title: "Expert-Led Courses",
      description: "Learn from industry professionals with real-world experience",
    },
    {
      icon: Target,
      title: "Practical Learning",
      description: "Hands-on projects and real case studies to build your portfolio",
    },
    {
      icon: Zap,
      title: "Fast-Track Progress",
      description: "Accelerated learning paths designed for busy professionals",
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
                  Master New Skills with{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {settings?.appName || "VideoLearn Pro"}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Join thousands of students learning cutting-edge skills through our expert-designed courses. 
                  Start your journey today and unlock your potential.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-lg"
                  onClick={() => navigate("/register")}
                >
                  Start Learning Now
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
              Why Choose {settings?.appName || "VideoLearn Pro"}?
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
              <h3 className="text-2xl font-bold mb-4">{settings?.appName || "VideoLearn Pro"}</h3>
              <p className="text-gray-400 mb-4">
                Empowering learners worldwide with high-quality, accessible education through innovative video-based courses.
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
            <p>&copy; 2025 {settings?.appName || "VideoLearn Pro"}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}