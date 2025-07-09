import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, Image, Palette, Type, FileText } from "lucide-react";

const platformSettingsSchema = z.object({
  platformName: z.string().min(1, "Platform name is required"),
  description: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
});

type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;

export default function PlatformSettingsPage() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/platform/settings"],
  });

  const form = useForm<PlatformSettingsFormData>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platformName: settings?.platformName || "De mentee Academy",
      description: settings?.description || "",
      primaryColor: settings?.primaryColor || "#2563eb",
      secondaryColor: settings?.secondaryColor || "#64748b",
    },
  });

  // Update form when settings data loads
  React.useEffect(() => {
    if (settings) {
      form.reset({
        platformName: settings.platformName || "De mentee Academy",
        description: settings.description || "",
        primaryColor: settings.primaryColor || "#2563eb",
        secondaryColor: settings.secondaryColor || "#64748b",
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PlatformSettingsFormData & { logoUrl?: string; faviconUrl?: string }) => {
      const response = await apiRequest("PUT", "/api/platform/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settings"] });
      toast({
        title: "Settings updated",
        description: "Platform settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFaviconPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PlatformSettingsFormData) => {
    try {
      let logoUrl = settings?.logoUrl;
      let faviconUrl = settings?.faviconUrl;

      // Upload logo if selected
      if (logoFile) {
        const logoResult = await uploadFileMutation.mutateAsync(logoFile);
        logoUrl = logoResult.url;
      }

      // Upload favicon if selected
      if (faviconFile) {
        const faviconResult = await uploadFileMutation.mutateAsync(faviconFile);
        faviconUrl = faviconResult.url;
      }

      await updateSettingsMutation.mutateAsync({
        ...data,
        logoUrl,
        faviconUrl,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update platform settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize your platform's branding and appearance
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="platformName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter platform name" {...field} />
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
                    <FormLabel>Platform Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter platform description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Branding Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Platform Logo</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {(logoPreview || settings?.logoUrl) && (
                    <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                      <img
                        src={logoPreview || settings?.logoUrl}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Recommended size: 200x60px. Supported formats: PNG, JPG, SVG
                </p>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {(faviconPreview || settings?.faviconUrl) && (
                    <div className="w-8 h-8 border rounded overflow-hidden bg-gray-50 dark:bg-gray-800">
                      <img
                        src={faviconPreview || settings?.faviconUrl}
                        alt="Favicon preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Recommended size: 32x32px. Supported formats: PNG, ICO
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            placeholder="#2563eb"
                            {...field}
                            className="flex-1"
                          />
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
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-16 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            placeholder="#64748b"
                            {...field}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending || uploadFileMutation.isPending}
            >
              {updateSettingsMutation.isPending || uploadFileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}