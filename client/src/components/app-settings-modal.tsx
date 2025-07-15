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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const appSettingsSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  appLogo: z.string().optional(),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  bannerImages: z.array(z.string()),
  footerText: z.string().optional(),
  
  // Landing page configuration
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroButtonText: z.string().optional(),
  
  // Stats section
  statsTitle: z.string().optional(),
  stat1Label: z.string().optional(),
  stat1Value: z.string().optional(),
  stat2Label: z.string().optional(),
  stat2Value: z.string().optional(),
  stat3Label: z.string().optional(),
  stat3Value: z.string().optional(),
  stat4Label: z.string().optional(),
  stat4Value: z.string().optional(),
  
  // About section
  aboutTitle: z.string().optional(),
  aboutDescription: z.string().optional(),
  
  // Features section
  featuresTitle: z.string().optional(),
  feature1Title: z.string().optional(),
  feature1Description: z.string().optional(),
  feature2Title: z.string().optional(),
  feature2Description: z.string().optional(),
  feature3Title: z.string().optional(),
  feature3Description: z.string().optional(),
  
  // Contact section
  contactTitle: z.string().optional(),
  contactDescription: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  
  // Public user access configuration
  allowPublicRegistration: z.boolean().optional(),
  publicUserAccessCategories: z.array(z.number()).optional(),
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

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
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
      heroTitle: "",
      heroSubtitle: "",
      heroButtonText: "",
      statsTitle: "",
      stat1Label: "",
      stat1Value: "",
      stat2Label: "",
      stat2Value: "",
      stat3Label: "",
      stat3Value: "",
      stat4Label: "",
      stat4Value: "",
      aboutTitle: "",
      aboutDescription: "",
      featuresTitle: "",
      feature1Title: "",
      feature1Description: "",
      feature2Title: "",
      feature2Description: "",
      feature3Title: "",
      feature3Description: "",
      contactTitle: "",
      contactDescription: "",
      contactEmail: "",
      contactPhone: "",
      allowPublicRegistration: false,
      publicUserAccessCategories: [],
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
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        heroButtonText: settings.heroButtonText || "",
        statsTitle: settings.statsTitle || "",
        stat1Label: settings.stat1Label || "",
        stat1Value: settings.stat1Value || "",
        stat2Label: settings.stat2Label || "",
        stat2Value: settings.stat2Value || "",
        stat3Label: settings.stat3Label || "",
        stat3Value: settings.stat3Value || "",
        stat4Label: settings.stat4Label || "",
        stat4Value: settings.stat4Value || "",
        aboutTitle: settings.aboutTitle || "",
        aboutDescription: settings.aboutDescription || "",
        featuresTitle: settings.featuresTitle || "",
        feature1Title: settings.feature1Title || "",
        feature1Description: settings.feature1Description || "",
        feature2Title: settings.feature2Title || "",
        feature2Description: settings.feature2Description || "",
        feature3Title: settings.feature3Title || "",
        feature3Description: settings.feature3Description || "",
        contactTitle: settings.contactTitle || "",
        contactDescription: settings.contactDescription || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        allowPublicRegistration: settings.allowPublicRegistration || false,
        publicUserAccessCategories: settings.publicUserAccessCategories || [],
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: "banner") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadMutation.mutateAsync(file);
      const currentBanners = form.getValues("bannerImages");
      form.setValue("bannerImages", [...currentBanners, result.url]);
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
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="hero">Hero Section</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Zmartclass" {...field} />
                      </FormControl>
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
                          placeholder="© 2024 Zmartclass. All rights reserved."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="hero" className="space-y-4">
                <FormField
                  control={form.control}
                  name="heroTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Transform Your Learning Journey" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroSubtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Subtitle</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Join thousands of students advancing their careers with our expert-led courses"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Button Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Get Started Today" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statsTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stats Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Trusted by Students Worldwide" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stat1Label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 1 Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Active Students" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stat1Value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 1 Value</FormLabel>
                        <FormControl>
                          <Input placeholder="10,000+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stat2Label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 2 Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Courses" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stat2Value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 2 Value</FormLabel>
                        <FormControl>
                          <Input placeholder="50+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stat3Label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 3 Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Video Lessons" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stat3Value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 3 Value</FormLabel>
                        <FormControl>
                          <Input placeholder="500+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stat4Label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 4 Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Success Rate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stat4Value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stat 4 Value</FormLabel>
                        <FormControl>
                          <Input placeholder="95%" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <FormField
                  control={form.control}
                  name="aboutTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="About Zmartclass" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aboutDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="We're dedicated to making quality education accessible to everyone. Our platform combines cutting-edge technology with expert instruction to deliver exceptional learning experiences."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featuresTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Why Choose Zmartclass?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature1Title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature 1 Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Expert-Led Courses" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature1Description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature 1 Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Learn from industry professionals with real-world experience"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature2Title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature 2 Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Practical Learning" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature2Description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature 2 Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Hands-on projects and real case studies to build your portfolio"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature3Title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature 3 Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Fast-Track Progress" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="feature3Description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature 3 Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Accelerated learning paths designed for busy professionals"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Get In Touch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ready to start your learning journey? Contact us today!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="info@zmartclass.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="access" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Allow Public Registration</p>
                      <p className="text-sm text-muted-foreground">
                        Allow users to register from the landing page
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="allowPublicRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Category Access for Public Users</p>
                      <p className="text-sm text-muted-foreground">
                        Select categories that public users can access
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="publicUserAccessCategories"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category.id)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, category.id]);
                                    } else {
                                      field.onChange(value.filter(id => id !== category.id));
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-1.5 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  {category.name}
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

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