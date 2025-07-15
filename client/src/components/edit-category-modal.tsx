import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Image } from "lucide-react";
import type { Category } from "@shared/schema";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  mentorName: z.string().optional(),
});

type CategoryData = z.infer<typeof categorySchema>;

interface EditCategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCategoryModal({ category, isOpen, onClose }: EditCategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedBackgroundImageUrl, setUploadedBackgroundImageUrl] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#f3f4f6");

  const form = useForm<CategoryData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      mentorName: category?.mentorName || "",
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      console.log('Resetting form with category:', category);
      form.reset({
        name: category.name,
        description: category.description || "",
        mentorName: category.mentorName || "",
      });
      setUploadedImageUrl(category.coverImage || "");
      setUploadedBackgroundImageUrl(category.backgroundImage || "");
      setBackgroundColor(category.backgroundColor || "#f3f4f6");
    }
  }, [category, form]);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to upload image");
      const data = await response.json();
      return data.url;
    },
    onSuccess: (url: string) => {
      setUploadedImageUrl(url);
      toast({
        title: "Success",
        description: "Cover image uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryData) => {
      if (!category) throw new Error("No category selected");
      
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      console.log('Updating category with data:', { ...data, slug, coverImage: uploadedImageUrl });
      
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          slug,
          coverImage: uploadedImageUrl,
          backgroundImage: uploadedBackgroundImageUrl,
          backgroundColor: backgroundColor,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to update category");
      }
      
      return await response.json();
    },
    onSuccess: (updatedCategory) => {
      console.log('Category updated successfully:', updatedCategory);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      form.reset();
      setUploadedImageUrl("");
      setUploadedBackgroundImageUrl("");
      setBackgroundColor("#f3f4f6");
      onClose();
    },
    onError: (error: Error) => {
      console.error('Update category error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      
      fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      .then(response => {
        if (!response.ok) throw new Error("Failed to upload background image");
        return response.json();
      })
      .then(data => {
        setUploadedBackgroundImageUrl(data.url);
        toast({
          title: "Success",
          description: "Background image uploaded successfully",
        });
      })
      .catch(error => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      });
    }
  };

  const onSubmit = (data: CategoryData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    updateCategoryMutation.mutate(data);
  };

  const handleRemoveImage = () => {
    setUploadedImageUrl("");
  };

  const handleRemoveBackgroundImage = () => {
    setUploadedBackgroundImageUrl("");
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details and customization options below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column - Basic Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Details</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter category description" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mentorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mentor Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mentor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedImageUrl ? (
                      <div className="relative">
                        <img 
                          src={uploadedImageUrl} 
                          alt="Cover" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadImageMutation.isPending}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadImageMutation.isPending ? "Uploading..." : "Upload Cover Image"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Right Column - Visual Customization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Visual Customization</h3>
                
                {/* Background Image Upload */}
                <div className="space-y-2">
                  <Label>Background Image (For Hero Section)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {uploadedBackgroundImageUrl ? (
                      <div className="relative">
                        <img 
                          src={uploadedBackgroundImageUrl} 
                          alt="Background" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveBackgroundImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => backgroundImageInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Background Image
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={backgroundImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="#f3f4f6"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Used as fallback when no background image is set</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}