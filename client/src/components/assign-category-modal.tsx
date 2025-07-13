import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type User, type Category, type UserCategoryAccess } from "@shared/schema";
import { Loader2 } from "lucide-react";

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
      return apiRequest(`/api/admin/users/${userId}/categories/${categoryId}`, {
        method: "POST",
      });
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
      return apiRequest(`/api/admin/users/${userId}/categories/${categoryId}`, {
        method: "DELETE",
      });
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
    if (!user) return;

    if (isAssigned) {
      removeMutation.mutate({ userId: user.id, categoryId });
    } else {
      assignMutation.mutate({ userId: user.id, categoryId });
    }
  };

  const assignedCategoryIds = new Set(userAccess.map((access: UserCategoryAccess) => access.categoryId));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign Categories to {user?.fullName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {categoriesLoading || accessLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm">No categories available.</p>
              ) : (
                categories.map((category: Category) => {
                  const isAssigned = assignedCategoryIds.has(category.id);
                  const isLoading = assignMutation.isPending || removeMutation.isPending;

                  return (
                    <div key={category.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={isAssigned}
                        disabled={isLoading}
                        onCheckedChange={() => handleCategoryToggle(category.id, isAssigned)}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {category.name}
                        {category.mentorName && (
                          <span className="text-muted-foreground ml-1">
                            by {category.mentorName}
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={assignMutation.isPending || removeMutation.isPending}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}