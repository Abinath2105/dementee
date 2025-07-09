import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddVideoModal({ isOpen, onClose }: AddVideoModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("video");
  
  // Video form fields
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  
  // Category form fields
  const [categoryName, setCategoryName] = useState("");
  const [mentorName, setMentorName] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const addVideoMutation = useMutation({
    mutationFn: async (videoData: {
      title?: string;
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

  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: {
      name: string;
      mentorName?: string;
    }) => {
      const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryData.name,
          slug,
          mentorName: categoryData.mentorName || null,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category created successfully",
        description: "The new category has been added",
      });
      setCategoryName("");
      setMentorName("");
      setActiveTab("video");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVideoSubmit = (e: React.FormEvent) => {
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
      title: title || undefined,
      youtubeUrl,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      description: description || undefined,
      tags: tags ? tags.split(/[,\n]/).map(tag => tag.trim()).filter(Boolean) : undefined,
    };

    addVideoMutation.mutate(videoData);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName) {
      toast({
        title: "Category name required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    addCategoryMutation.mutate({
      name: categoryName,
      mentorName: mentorName || undefined,
    });
  };

  const handleClose = () => {
    setTitle("");
    setYoutubeUrl("");
    setCategoryId("");
    setDescription("");
    setTags("");
    setCategoryName("");
    setMentorName("");
    setActiveTab("video");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">Add Video</TabsTrigger>
            <TabsTrigger value="category">Create Category</TabsTrigger>
          </TabsList>
          
          <TabsContent value="video" className="mt-6">
            <form onSubmit={handleVideoSubmit} className="space-y-6">
              <div>
                <Label htmlFor="video-title">Custom Video Title (Optional)</Label>
                <Input
                  id="video-title"
                  placeholder="Override the YouTube title with a custom one..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use the original YouTube title
                </p>
              </div>
              
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
                  Paste the YouTube video link here. Metadata will be fetched automatically.
                </p>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name} {category.mentorName && `(${category.mentorName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">No suitable category?</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTab("category")}
                    className="h-auto p-0 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create New Category
                  </Button>
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
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use the YouTube description
                </p>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Textarea
                  id="tags"
                  rows={3}
                  placeholder="Enter tags separated by commas or one per line:
javascript, react, frontend
tutorial
beginner-friendly"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate tags with commas or put each tag on a new line
                </p>
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
          </TabsContent>
          
          <TabsContent value="category" className="mt-6">
            <form onSubmit={handleCategorySubmit} className="space-y-6">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="e.g., Web Development, Data Science, Machine Learning"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="mentor-name">Mentor Name (Optional)</Label>
                <Input
                  id="mentor-name"
                  placeholder="e.g., John Smith, Dr. Jane Doe"
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Associate this category with a specific instructor or mentor
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("video")}>
                  Back to Video
                </Button>
                <Button type="submit" disabled={addCategoryMutation.isPending}>
                  {addCategoryMutation.isPending ? "Creating Category..." : "Create Category"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
