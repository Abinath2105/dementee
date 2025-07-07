import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Mail, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Play className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">VideoLearn Pro</h1>
            <p className="text-gray-600 mt-2">Your Learning Management Platform</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to access your learning platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email Address</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join our learning community today</CardDescription>
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
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center p-8 text-white">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4 text-6xl">
              <Mail className="h-16 w-16" />
              <Shield className="h-16 w-16" />
            </div>
            <h2 className="text-3xl font-bold">Secure Learning Platform</h2>
            <p className="text-blue-100 text-lg">
              Access curated video content, track your progress, and enhance your skills with our comprehensive learning management system.
            </p>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Email verification for secure access</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Curated video library</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Search and filter functionality</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>In-app video player</span>
            </div>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <OtpVerificationModal
          email={registrationEmail}
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
}
