import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import AdminLogin from "@/pages/admin-login";
import StudentLogin from "@/pages/student-login";
import InvitationPage from "@/pages/invitation-page";
import { CategoryPage } from "@/pages/category-page";
import { VideoPage } from "@/pages/video-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/category/:slug" component={CategoryPage} />
      <ProtectedRoute path="/video/:videoId" component={VideoPage} />
      <Route path="/auth" component={StudentLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/invite/:token" component={InvitationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
