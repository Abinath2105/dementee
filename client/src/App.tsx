import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import DashboardPage from "@/pages/dashboard-page";
import MentorSetupPage from "@/pages/mentor-setup-page";
import MentorProfilePage from "@/pages/mentor-profile-page";
import StudentProfilePage from "@/pages/student-profile-page";
import AdvancedDashboardPage from "@/pages/advanced-dashboard-page";
import AssignmentsPage from "@/pages/assignments-page";
import PlatformSettingsPage from "@/pages/platform-settings-page";
import StudentAdmissionsPage from "@/pages/student-admissions-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/mentor/profile" component={MentorProfilePage} />
      <ProtectedRoute path="/student/profile" component={StudentProfilePage} />
      <ProtectedRoute path="/advanced-dashboard" component={AdvancedDashboardPage} />
      <ProtectedRoute path="/assignments" component={AssignmentsPage} />
      <ProtectedRoute path="/admin/platform-settings" component={PlatformSettingsPage} />
      <ProtectedRoute path="/admin/student-admissions" component={StudentAdmissionsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/mentor/setup" component={MentorSetupPage} />
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
