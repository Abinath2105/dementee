import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, User, Lock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function MentorSetupPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Extract token from URL first
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');
  
  // Debug: Log token and location
  console.log('=== MENTOR SETUP DEBUG ===');
  console.log('Location:', location);
  console.log('URL Parts:', location.split('?'));
  console.log('Query String:', location.split('?')[1] || 'No query string');
  console.log('URLSearchParams:', urlParams.toString());
  console.log('Token:', token);
  console.log('All URL params:', Object.fromEntries(urlParams.entries()));
  console.log('=== END DEBUG ===');
  
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      console.log('No token found, redirecting to auth');
      navigate('/auth');
    }
  }, [token, navigate]);

  // Only check auth if we have a token
  const { user } = useAuth();
  
  // Show notice if user is already logged in (only if we have a token)
  if (token && user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Already Logged In</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              You are already logged in as {user.fullName}. Please log out first to set up a mentor account.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Return early if no token (will redirect via useEffect)
  if (!token) {
    return <div>Loading...</div>;
  }

  // Validate invitation token
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ["/api/mentor/invitation", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      
      const response = await fetch(`/api/mentor/invitation/${token}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid invitation");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const setupMutation = useMutation({
    mutationFn: async (setupData: { token: string; password: string; confirmPassword: string }) => {
      const response = await fetch("/api/mentor/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to setup account");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setIsSetupComplete(true);
      toast({
        title: "Account setup successful!",
        description: `Welcome to VideoLearn Pro, ${data.mentor.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Password required",
        description: "Please enter and confirm your password",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!token) return;

    setupMutation.mutate({ token, password, confirmPassword });
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  if (!token) {
    return null; // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                {error?.message || "This invitation link is invalid or has expired. Please contact support for assistance."}
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => navigate('/auth')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-900 dark:text-green-100">Setup Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Your mentor account has been successfully set up. You can now log in to access the platform.
            </p>
            <Button onClick={handleGoToLogin} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Welcome to VideoLearn Pro</CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up your mentor account
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Welcome, {invitation.mentorName}!
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Email: {invitation.mentorEmail}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Please create a secure password to complete your account setup.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={setupMutation.isPending}
            >
              <Lock className="h-4 w-4 mr-2" />
              {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}