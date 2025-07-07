import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddVideoModal({ isOpen, onClose }: AddVideoModalProps) {
  const { toast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const addVideoMutation = useMutation({
    mutationFn: async (videoData: {
      youtubeUrl: string;
      categoryId?: number;
      description?: string;
      tags?: string[];
    }) => {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add video");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Video added successfully",
        description: "The video has been added to your library",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add video",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      toast({
        title: "YouTube URL required",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      youtubeUrl,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      description: description || undefined,
      tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
    };

    addVideoMutation.mutate(videoData);
  };

  const handleClose = () => {
    setYoutubeUrl("");
    setCategoryId("");
    setDescription("");
    setTags("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Video</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="youtube-url">YouTube Video URL</Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste the YouTube video link here. Title and thumbnail will be fetched automatically.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Custom Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Add a custom description for this video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas (e.g., javascript, react, frontend)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addVideoMutation.isPending}>
              {addVideoMutation.isPending ? "Adding Video..." : "Add Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
