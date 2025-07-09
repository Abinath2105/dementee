import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Camera, Image } from "lucide-react";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadType: "photo" | "background";
  currentImage?: string | null;
}

export function PhotoUploadModal({ isOpen, onClose, uploadType, currentImage }: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      const fieldName = uploadType === "photo" ? "photo" : "background";
      formData.append(fieldName, file);

      console.log("Upload attempt:", {
        fieldName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const endpoint = uploadType === "photo" 
        ? "/api/mentor/upload-photo" 
        : "/api/mentor/upload-background";

      // Use fetch directly for file uploads instead of apiRequest
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload failed:", errorText);
        throw new Error(errorText || `Upload failed with status ${res.status}`);
      }

      const result = await res.json();
      console.log("Upload successful:", result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `${uploadType === "photo" ? "Profile photo" : "Background image"} updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/profile"] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const endpoint = uploadType === "photo" 
        ? "/api/mentor/delete-photo" 
        : "/api/mentor/delete-background";

      const res = await apiRequest("DELETE", endpoint);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Delete successful",
        description: `${uploadType === "photo" ? "Profile photo" : "Background image"} removed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/profile"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {uploadType === "photo" ? (
              <Camera className="h-5 w-5 mr-2" />
            ) : (
              <Image className="h-5 w-5 mr-2" />
            )}
            {uploadType === "photo" ? "Profile Photo" : "Background Image"}
          </DialogTitle>
          <DialogDescription>
            Upload a new {uploadType === "photo" ? "profile photo" : "background image"} or manage your current one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Image Preview */}
          {currentImage && !previewUrl && (
            <div className="space-y-2">
              <Label>Current {uploadType === "photo" ? "Photo" : "Background"}</Label>
              <div className="relative">
                <img
                  src={currentImage}
                  alt={`Current ${uploadType}`}
                  className={`w-full rounded-lg object-cover ${
                    uploadType === "photo" ? "h-32" : "h-24"
                  }`}
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">
              {currentImage ? "Replace with new image" : "Upload image"}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to select an image file
                </span>
                <span className="text-xs text-gray-500">
                  JPEG, PNG, GIF, WebP (max 5MB)
                </span>
              </label>
            </div>
          </div>

          {/* Preview New Image */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full rounded-lg object-cover ${
                    uploadType === "photo" ? "h-32" : "h-24"
                  }`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between space-x-2">
            <div>
              {currentImage && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Removing..." : "Remove Current"}
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}