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
import { X, Eye, EyeOff, Save } from "lucide-react";
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
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with video data
  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setCategoryId(video.categoryId ? video.categoryId.toString() : "");
      setDescription(video.description || "");
      setTags(video.tags || []);
      setIsPublic(video.isPublic);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a video title",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      title: title.trim(),
      categoryId: categoryId ? parseInt(categoryId) : null,
      description: description.trim() || null,
      tags: tags.length > 0 ? tags : [],
      isPublic,
    };

    updateVideoMutation.mutate(videoData);
  };

  const handleClose = () => {
    if (video) {
      setTitle(video.title || "");
      setCategoryId(video.categoryId ? video.categoryId.toString() : "");
      setDescription(video.description || "");
      setTags(video.tags || []);
      setIsPublic(video.isPublic);
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
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                    {category.mentorName && ` (${category.mentorName})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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