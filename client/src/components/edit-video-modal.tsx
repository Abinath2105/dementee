import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Eye, EyeOff, Save, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Category, VideoWithCategory } from "@shared/schema";

interface EditVideoModalProps {
  video: VideoWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditVideoModal({ video, isOpen, onClose }: EditVideoModalProps) {
  const { toast } = useToast();
  
  // Form fields
  const [title, setTitle] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with video data
  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setTags(video.tags || []);
      setIsPublic(video.isPublic);
      
      // Set up categories
      if (video.categories && video.categories.length > 0) {
        const categoryIds = video.categories.map(cat => cat.id);
        setSelectedCategoryIds(categoryIds);
        setPrimaryCategoryId(video.categoryId);
      } else {
        setSelectedCategoryIds([]);
        setPrimaryCategoryId(null);
      }
    }
  }, [video]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const updateVideoMutation = useMutation({
    mutationFn: async (videoData: any) => {
      const response = await fetch(`/api/videos/${video?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(videoData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update video");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Video updated",
        description: "Video has been updated successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update video",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoriesMutation = useMutation({
    mutationFn: async ({ categoryIds, primaryCategoryId }: { categoryIds: number[], primaryCategoryId: number }) => {
      const response = await fetch(`/api/videos/${video?.id}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryIds, primaryCategoryId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update video categories");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Categories updated",
        description: "Video categories have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update categories",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
        setTagInput("");
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag(tagInput);
      setTagInput("");
    }
  };

  const handleCategoryToggle = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds(prev => [...prev, categoryId]);
      // If this is the first category selected, make it primary
      if (selectedCategoryIds.length === 0) {
        setPrimaryCategoryId(categoryId);
      }
    } else {
      setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
      // If removing the primary category, set a new primary or null
      if (primaryCategoryId === categoryId) {
        const remaining = selectedCategoryIds.filter(id => id !== categoryId);
        setPrimaryCategoryId(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  const handlePrimaryChange = (categoryId: number) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setPrimaryCategoryId(categoryId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a video title",
        variant: "destructive",
      });
      return;
    }

    if (selectedCategoryIds.length === 0) {
      toast({
        title: "Category required",
        description: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    if (!primaryCategoryId) {
      toast({
        title: "Primary category required",
        description: "Please select a primary category",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      title: title.trim(),
      categoryId: primaryCategoryId,
      description: description.trim() || null,
      tags: tags.length > 0 ? tags : [],
      isPublic,
    };

    try {
      // Update basic video info first
      await updateVideoMutation.mutateAsync(videoData);
      
      // Then update categories
      await updateCategoriesMutation.mutateAsync({
        categoryIds: selectedCategoryIds,
        primaryCategoryId: primaryCategoryId,
      });
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error('Update failed:', error);
    }
  };

  const handleClose = () => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setTags(video.tags || []);
      setIsPublic(video.isPublic);
      
      // Reset categories
      if (video.categories && video.categories.length > 0) {
        const categoryIds = video.categories.map(cat => cat.id);
        setSelectedCategoryIds(categoryIds);
        setPrimaryCategoryId(video.categoryId);
      } else {
        setSelectedCategoryIds([]);
        setPrimaryCategoryId(null);
      }
    }
    setTagInput("");
    onClose();
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              required
            />
          </div>

          <div>
            <Label>Categories</Label>
            <p className="text-sm text-gray-600 mb-3">Select categories for this video. The primary category (marked with *) will be used for organization.</p>
            <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {category.name}
                      {category.mentorName && (
                        <span className="text-gray-500 text-xs ml-1">({category.mentorName})</span>
                      )}
                    </Label>
                  </div>
                  {selectedCategoryIds.includes(category.id) && (
                    <Button
                      type="button"
                      size="sm"
                      variant={primaryCategoryId === category.id ? "default" : "outline"}
                      onClick={() => handlePrimaryChange(category.id)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {primaryCategoryId === category.id ? "Primary" : "Set Primary"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {selectedCategoryIds.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">
                  Selected: {selectedCategoryIds.length} categories
                  {primaryCategoryId && (
                    <span className="ml-2">
                      • Primary: {categories.find(c => c.id === primaryCategoryId)?.name}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description (optional)"
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="border rounded-md p-3 min-h-[80px] focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    className="bg-black dark:bg-white text-white dark:text-black text-xs px-3 py-1 rounded-full font-normal hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:opacity-70 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                ref={tagInputRef}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={handleTagInputBlur}
                placeholder={tags.length === 0 ? "Type tags and press Enter or comma..." : "Add another tag..."}
                className="border-0 shadow-none focus-visible:ring-0 px-0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Type and press Enter or comma to add tags. Backspace to remove the last tag.
            </p>
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <div className="flex items-center space-x-3 mt-2">
              <Switch
                id="visibility"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <div className="flex items-center space-x-2">
                {isPublic ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Public</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Private</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isPublic ? "Video will be visible to all users" : "Video will only be visible to admins"}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateVideoMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateVideoMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}