import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3,
  BookOpen,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  Users,
  PlayCircle,
  CheckCircle,
  Star,
  Award,
  Flame,
  ArrowRight,
  Activity,
  Brain,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface DashboardStats {
  totalPoints: number;
  completedAssignments: number;
  completedVideos: number;
  studyTimeMinutes: number;
  currentStreak: number;
  level: number;
  achievements: Array<{
    id: number;
    title: string;
    description: string;
    badgeIcon: string;
    badgeColor: string;
    earnedAt: string;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    description: string;
    points: number;
    completedAt: string;
  }>;
  upcomingAssignments: Array<{
    id: number;
    title: string;
    dueDate: string;
    type: string;
    points: number;
  }>;
  learningPaths: Array<{
    id: number;
    title: string;
    description: string;
    progressPercentage: number;
    totalItems: number;
    completedItems: number;
  }>;
  weeklyProgress: Array<{
    day: string;
    studyMinutes: number;
    pointsEarned: number;
  }>;
}

export default function AdvancedDashboardPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const { data: dashboardStats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/advanced"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {
    totalPoints: 0,
    completedAssignments: 0,
    completedVideos: 0,
    studyTimeMinutes: 0,
    currentStreak: 0,
    level: 1,
    achievements: [],
    recentActivity: [],
    upcomingAssignments: [],
    learningPaths: [],
    weeklyProgress: []
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Learning
                </Button>
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Learning Dashboard</h1>
            <div className="flex items-center space-x-2">
              <Link href="/assignments">
                <Button size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Assignments
                </Button>
              </Link>
              <Link href="/learning-paths">
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Learning Paths
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Points</p>
                  <p className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                </div>
                <Trophy className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Current Level</p>
                  <p className="text-3xl font-bold">Level {stats.level}</p>
                </div>
                <Star className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Study Streak</p>
                  <p className="text-3xl font-bold">{stats.currentStreak} days</p>
                </div>
                <Flame className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Study Time</p>
                  <p className="text-3xl font-bold">{Math.round(stats.studyTimeMinutes / 60)}h</p>
                </div>
                <Clock className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Learning Progress */}
              <Card className="lg:col-span-2">
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
                      <span className="font-medium">{stats.completedVideos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Assignments Completed</span>
                      <span className="font-medium">{stats.completedAssignments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Study Time</span>
                      <span className="font-medium">{Math.round(stats.studyTimeMinutes / 60)} hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === 'assignment' && <BookOpen className="h-4 w-4 text-blue-500" />}
                          {activity.type === 'video' && <PlayCircle className="h-4 w-4 text-green-500" />}
                          {activity.type === 'achievement' && <Award className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                        <Badge variant="secondary">+{activity.points}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Learning Paths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Active Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.learningPaths.map((path) => (
                    <div key={path.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900 mb-2">{path.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{path.completedItems}/{path.totalItems} items</span>
                        </div>
                        <Progress value={path.progressPercentage} className="h-2" />
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        Continue Learning
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.upcomingAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{assignment.points} pts</Badge>
                        <Button size="sm">Start</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Study Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.weeklyProgress.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.day}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (day.studyMinutes / 120) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{day.studyMinutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Points Earned This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.weeklyProgress.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.day}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (day.pointsEarned / 100) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{day.pointsEarned}pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment System</h3>
                  <p className="text-gray-600 mb-4">
                    Complete assignments to earn points and track your progress
                  </p>
                  <Link href="/assignments">
                    <Button>
                      View All Assignments
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Your Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 border rounded-lg text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      <Badge variant="secondary">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  {stats.achievements.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No achievements yet. Keep learning to unlock badges!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Study Session</span>
                      <span className="font-medium">45 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Most Active Day</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preferred Learning Time</span>
                      <span className="font-medium">Evening</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="font-medium">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">Great Progress!</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        You're 23% ahead of your learning goals this month.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <Brain className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Skill Focus</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Consider focusing more on JavaScript fundamentals.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">Streak Tip</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Study for 15 more minutes to maintain your streak!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}