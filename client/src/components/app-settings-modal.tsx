import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, Upload } from "lucide-react";

const appSettingsSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  appLogo: z.string().optional(),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  bannerImages: z.array(z.string()),
  footerText: z.string().optional(),
});

type AppSettingsData = z.infer<typeof appSettingsSchema>;

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ isOpen, onClose }: AppSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newBannerUrl, setNewBannerUrl] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isOpen,
  });

  const form = useForm<AppSettingsData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      appName: "",
      appLogo: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#1f2937",
      bannerImages: [],
      footerText: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        appName: settings.appName || "",
        appLogo: settings.appLogo || "",
        primaryColor: settings.primaryColor || "#3b82f6",
        secondaryColor: settings.secondaryColor || "#1f2937",
        bannerImages: settings.bannerImages || [],
        footerText: settings.footerText || "",
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AppSettingsData>) => {
      return await apiRequest("PUT", "/api/admin/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "App settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      return data.url;
    },
  });

  const onSubmit = (data: AppSettingsData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleAddBanner = () => {
    if (newBannerUrl.trim()) {
      const currentBanners = form.getValues("bannerImages");
      form.setValue("bannerImages", [...currentBanners, newBannerUrl.trim()]);
      setNewBannerUrl("");
    }
  };

  const handleRemoveBanner = (index: number) => {
    const currentBanners = form.getValues("bannerImages");
    form.setValue("bannerImages", currentBanners.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: "appLogo" | "banner") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadMutation.mutateAsync(file);
      if (field === "appLogo") {
        form.setValue("appLogo", result.url);
      } else {
        const currentBanners = form.getValues("bannerImages");
        form.setValue("bannerImages", [...currentBanners, result.url]);
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>App Settings</DialogTitle>
          <DialogDescription>
            Customize your application's appearance and branding.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Name</FormLabel>
                  <FormControl>
                    <Input placeholder="VideoLearn Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Logo</FormLabel>
                  <div className="space-y-2">
                    {field.value && (
                      <div className="w-32 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img 
                          src={field.value} 
                          alt="App Logo Preview" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="icon" asChild>
                          <span>
                            <Upload className="h-4 w-4" />
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "appLogo")}
                        />
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input type="color" className="w-16" {...field} />
                        <Input placeholder="#3b82f6" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input type="color" className="w-16" {...field} />
                        <Input placeholder="#1f2937" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bannerImages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Images</FormLabel>
                  <div className="space-y-2">
                    {field.value.map((banner, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input value={banner} readOnly className="flex-1" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveBanner(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <Input
                        placeholder="https://example.com/banner.jpg"
                        value={newBannerUrl}
                        onChange={(e) => setNewBannerUrl(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBanner())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddBanner}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="icon" asChild>
                          <span>
                            <Upload className="h-4 w-4" />
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "banner")}
                        />
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="© 2024 VideoLearn Pro. All rights reserved."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateSettingsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}