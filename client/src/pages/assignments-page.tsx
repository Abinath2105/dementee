import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen,
  Clock,
  Trophy,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  ArrowLeft,
  Calendar,
  Filter,
  Search,
  FileText,
  Code,
  PenTool,
  Brain
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Assignment, AssignmentSubmission } from "@shared/schema";

interface AssignmentWithProgress extends Assignment {
  submission?: AssignmentSubmission;
  questionsCount: number;
  isOverdue: boolean;
}

interface AssignmentModalProps {
  assignment: AssignmentWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
}

function AssignmentModal({ assignment, isOpen, onClose }: AssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!assignment) return null;

  const startAssignmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/assignments/${assignment.id}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment Started",
        description: "Good luck with your assignment!",
      });
      onClose();
      // Navigate to assignment taking page
      window.location.href = `/assignments/${assignment.id}/take`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Brain className="h-5 w-5 text-blue-500" />;
      case 'coding': return <Code className="h-5 w-5 text-green-500" />;
      case 'essay': return <PenTool className="h-5 w-5 text-purple-500" />;
      case 'project': return <FileText className="h-5 w-5 text-orange-500" />;
      default: return <BookOpen className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (assignment.submission?.status === "completed" || assignment.submission?.status === "graded") {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (assignment.submission?.status === "in_progress") {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    }
    if (assignment.isOverdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(assignment.type)}
            {assignment.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <div className="flex items-center text-sm text-gray-600">
              <Trophy className="h-4 w-4 mr-1" />
              {assignment.points} points
            </div>
          </div>

          {assignment.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600">{assignment.description}</p>
            </div>
          )}

          {assignment.instructions && (
            <div>
              <h3 className="font-medium mb-2">Instructions</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{assignment.instructions}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                {assignment.timeLimit ? `${assignment.timeLimit} minutes` : "No time limit"}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                {assignment.dueDate 
                  ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`
                  : "No due date"
                }
              </span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600">
                {assignment.questionsCount} questions
              </span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-600 capitalize">
                {assignment.difficultyLevel} level
              </span>
            </div>
          </div>

          {assignment.submission && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Your Progress</h3>
              <div className="space-y-2">
                {assignment.submission.score !== null && (
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-medium">
                      {assignment.submission.score}/{assignment.submission.maxScore}
                    </span>
                  </div>
                )}
                {assignment.submission.timeSpent > 0 && (
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <span className="font-medium">
                      {Math.round(assignment.submission.timeSpent / 60)} minutes
                    </span>
                  </div>
                )}
                {assignment.submission.feedback && (
                  <div>
                    <span className="font-medium">Feedback:</span>
                    <p className="text-sm text-gray-600 mt-1">{assignment.submission.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {(!assignment.submission || assignment.submission.status === "in_progress") && (
              <Button 
                onClick={() => startAssignmentMutation.mutate()}
                disabled={startAssignmentMutation.isPending}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                {assignment.submission?.status === "in_progress" ? "Continue" : "Start Assignment"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithProgress | null>(null);

  const { data: assignments = [], isLoading } = useQuery<AssignmentWithProgress[]>({
    queryKey: ["/api/assignments", searchQuery, filterType, filterStatus],
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/assignments/stats"],
    enabled: !!user,
  });

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || assignment.type === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "completed" && assignment.submission?.status === "graded") ||
                         (filterStatus === "in_progress" && assignment.submission?.status === "in_progress") ||
                         (filterStatus === "available" && !assignment.submission);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'coding': return <Code className="h-4 w-4 text-green-500" />;
      case 'essay': return <PenTool className="h-4 w-4 text-purple-500" />;
      case 'project': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Assignments</h1>
            <div className="w-32"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Points Earned</p>
                    <p className="text-2xl font-bold">{stats.totalPoints}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
              <p className="text-gray-600">
                {searchQuery || filterType !== "all" || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "No assignments have been created yet"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => {
              const isCompleted = assignment.submission?.status === "graded";
              const isInProgress = assignment.submission?.status === "in_progress";
              const progress = assignment.submission ? 
                (assignment.submission.score || 0) / (assignment.submission.maxScore || 100) * 100 : 0;

              return (
                <Card 
                  key={assignment.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(assignment.type)}
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {isCompleted ? (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        ) : isInProgress ? (
                          <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                        ) : assignment.isOverdue ? (
                          <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignment.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Trophy className="h-4 w-4 mr-1" />
                          {assignment.points} points
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {assignment.timeLimit ? `${assignment.timeLimit}m` : "Untimed"}
                        </div>
                      </div>
                      
                      {assignment.dueDate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      )}

                      {assignment.submission && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
      />
    </div>
  );
}