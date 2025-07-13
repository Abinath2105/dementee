import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type User, type Category, type UserCategoryAccess } from "@shared/schema";
import { Loader2, User as UserIcon, Shield, CheckCircle2, Circle } from "lucide-react";

interface AssignCategoryModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignCategoryModal({ user, isOpen, onClose }: AssignCategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isOpen && !!user,
  });

  // Fetch user's current category access
  const { data: userAccess = [], isLoading: accessLoading } = useQuery({
    queryKey: ["/api/admin/users", user?.id, "categories"],
    enabled: isOpen && !!user,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ userId, categoryId }: { userId: number; categoryId: number }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user?.id, "categories"] });
      toast({
        title: "Category assigned",
        description: "Category has been assigned to the user successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ userId, categoryId }: { userId: number; categoryId: number }) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user?.id, "categories"] });
      toast({
        title: "Category removed",
        description: "Category access has been removed from the user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Removal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCategoryToggle = (categoryId: number, isAssigned: boolean) => {
    if (!user || user.isAdmin) return;

    if (isAssigned) {
      removeMutation.mutate({ userId: user.id, categoryId });
    } else {
      assignMutation.mutate({ userId: user.id, categoryId });
    }
  };

  const assignedCategoryIds = new Set(userAccess.map((access: UserCategoryAccess) => access.categoryId));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Category Assignment</DialogTitle>
          <DialogDescription>
            Manage category access for this user. Users can only see and access categories assigned to them.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            {/* User Information Card */}
            <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-semibold">
                  {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg">{user.fullName}</h3>
                  {user.isAdmin && (
                    <Badge variant="destructive" className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Admin</span>
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center space-x-1">
                  <UserIcon className="h-3 w-3" />
                  <span>{user.username} • {user.email}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.isAdmin ? "Has access to all categories" : "Access limited to assigned categories"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Category Assignment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Available Categories</h4>
                <div className="text-sm text-muted-foreground">
                  {assignedCategoryIds.size} of {categories.length} assigned
                </div>
              </div>

              {categoriesLoading || accessLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {categories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No categories available.</p>
                      <p className="text-xs text-muted-foreground mt-1">Create categories first in the Categories tab.</p>
                    </div>
                  ) : (
                    categories.map((category: Category) => {
                      const isAssigned = assignedCategoryIds.has(category.id);
                      const isLoading = assignMutation.isPending || removeMutation.isPending;

                      return (
                        <div 
                          key={category.id} 
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            isAssigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isAssigned ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm truncate">{category.name}</p>
                              {isAssigned && (
                                <Badge variant="outline" className="text-xs">
                                  Assigned
                                </Badge>
                              )}
                            </div>
                            {category.mentorName && (
                              <p className="text-xs text-muted-foreground truncate">
                                by {category.mentorName}
                              </p>
                            )}
                            {category.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <Checkbox
                            checked={isAssigned}
                            disabled={isLoading || user.isAdmin}
                            onCheckedChange={() => handleCategoryToggle(category.id, isAssigned)}
                            className="flex-shrink-0"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                {user.isAdmin ? "Admin users automatically have full access" : "Changes take effect immediately"}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={assignMutation.isPending || removeMutation.isPending}
              >
                {assignMutation.isPending || removeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}