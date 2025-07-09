import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Mail, Shield, Users, GraduationCap, UserCheck, BookOpen, Award, TrendingUp, CheckCircle } from "lucide-react";
import { OtpVerificationModal } from "@/components/otp-verification-modal";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    loginMutation.mutate({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    
    registerMutation.mutate({
      email,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      fullName: formData.get("fullName") as string,
    }, {
      onSuccess: () => {
        setRegistrationEmail(email);
        setShowOtpModal(true);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <div className="flex items-center justify-center mb-4">
          <Play className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">VideoLearn Pro</h1>
        <p className="text-gray-600 mt-2 text-lg">Transform Your Learning Journey</p>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-8 gap-8">
        {/* Main Student Login Section */}
        <div className="flex-1 lg:flex-[2]">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <GraduationCap className="h-10 w-10 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Student Portal</h2>
              </div>
              <p className="text-gray-600">Join thousands of learners advancing their skills</p>
            </div>

            <Tabs defaultValue="student-login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student-login" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="student-register" className="text-sm">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="student-login">
                <Card className="border-0 shadow-none">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">Welcome Back, Learner!</CardTitle>
                    <CardDescription>Continue your learning journey</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-email">Email Address</Label>
                        <Input
                          id="student-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-password">Password</Label>
                        <Input
                          id="student-password"
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          required
                          className="h-12"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing In..." : "Sign In to Learn"}
                      </Button>
                      
                      {/* Student Benefits */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="flex flex-col items-center">
                            <BookOpen className="h-6 w-6 text-blue-600 mb-1" />
                            <span className="text-xs text-gray-700">Unlimited Courses</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Award className="h-6 w-6 text-blue-600 mb-1" />
                            <span className="text-xs text-gray-700">Certificates</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <TrendingUp className="h-6 w-6 text-blue-600 mb-1" />
                            <span className="text-xs text-gray-700">Progress Tracking</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Users className="h-6 w-6 text-blue-600 mb-1" />
                            <span className="text-xs text-gray-700">Community</span>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="student-register">
                <Card className="border-0 shadow-none">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">Start Your Learning Journey</CardTitle>
                    <CardDescription>Create your student account for free</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-fullName">Full Name</Label>
                        <Input
                          id="register-fullName"
                          name="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <Input
                          id="register-username"
                          name="username"
                          type="text"
                          placeholder="Choose a username"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email Address</Label>
                        <Input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          name="password"
                          type="password"
                          placeholder="Create a password"
                          required
                          className="h-12"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Create Student Account"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar - Admin & Mentor Login */}
        <div className="lg:flex-1 space-y-6">
          {/* Admin Section */}
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-red-600 mr-2" />
                <CardTitle className="text-lg text-red-800">Admin Portal</CardTitle>
              </div>
              <CardDescription className="text-red-700">Platform administration access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-3">
                <Input
                  name="email"
                  type="email"
                  placeholder="Admin email"
                  defaultValue="admin@example.com"
                  className="h-10"
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Admin password"
                  defaultValue="admin123"
                  className="h-10"
                />
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  disabled={loginMutation.isPending}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Login
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Mentor Section */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <UserCheck className="h-8 w-8 text-purple-600 mr-2" />
                <CardTitle className="text-lg text-purple-800">Mentor Portal</CardTitle>
              </div>
              <CardDescription className="text-purple-700">Instructor and mentor access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-3">
                <Input
                  name="email"
                  type="email"
                  placeholder="Mentor email"
                  defaultValue="mentor@example.com"
                  className="h-10"
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Mentor password"
                  defaultValue="mentor123"
                  className="h-10"
                />
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  disabled={loginMutation.isPending}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mentor Login
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Student Demo Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-sm text-blue-800">Quick Demo Access</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-3">
                <Input
                  name="email"
                  type="email"
                  placeholder="Student email"
                  defaultValue="test@example.com"
                  className="h-10"
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Student password"
                  defaultValue="password123"
                  className="h-10"
                />
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled={loginMutation.isPending}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Demo Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose VideoLearn Pro?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of students who have transformed their careers through our comprehensive video learning platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Video Learning</h3>
              <p className="text-gray-600">Engage with high-quality video content, bookmarks, and progress tracking</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Track your learning progress with detailed insights and performance metrics</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Achievements & Certificates</h3>
              <p className="text-gray-600">Earn badges and certificates to showcase your learning accomplishments</p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OtpVerificationModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          email={registrationEmail}
        />
      )}
    </div>
  );
}