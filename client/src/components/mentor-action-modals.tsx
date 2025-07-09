import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MentorSection, MentorResource } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  Award, 
  Target,
  Lightbulb,
  Star,
  Download,
  ExternalLink,
  Play,
  FileText
} from "lucide-react";

interface OpenToModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenToModal({ isOpen, onClose }: OpenToModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openToOptions = [
    { id: "mentoring", label: "Mentoring junior developers", icon: Users },
    { id: "collaboration", label: "Collaboration on projects", icon: MessageSquare },
    { id: "consulting", label: "Technical consulting", icon: Target },
    { id: "speaking", label: "Speaking engagements", icon: Calendar },
    { id: "teaching", label: "Teaching opportunities", icon: BookOpen },
  ];

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { openToOpportunities: string[] }) => {
      const response = await apiRequest("PUT", "/api/mentor/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/profile"] });
      toast({
        title: "Success",
        description: "Your availability preferences have been updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSave = () => {
    updateProfileMutation.mutate({ openToOpportunities: selectedOptions });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>What are you open to?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the opportunities you're interested in. This helps others know how they can work with you.
          </p>
          <div className="space-y-2">
            {openToOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOptions.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleOption(option.id)}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                  <span className={`flex-1 ${isSelected ? "text-blue-900 font-medium" : "text-gray-700"}`}>
                    {option.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddProfileSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProfileSectionModal({ isOpen, onClose }: AddProfileSectionModalProps) {
  const [selectedSection, setSelectedSection] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: any) => {
      const response = await apiRequest("POST", "/api/mentor/sections", sectionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/profile"] });
      toast({
        title: "Success",
        description: "Profile section added successfully.",
      });
      onClose();
      setSelectedSection("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add profile section. Please try again.",
        variant: "destructive",
      });
    },
  });

  const profileSections = [
    { id: "about", title: "About", description: "Share your story and what drives you", icon: FileText },
    { id: "experience", title: "Experience", description: "Add your work history", icon: Award },
    { id: "skills", title: "Skills", description: "Highlight your technical expertise", icon: Target },
    { id: "education", title: "Education", description: "Add your educational background", icon: BookOpen },
    { id: "certifications", title: "Certifications", description: "Showcase your professional certifications", icon: Award },
    { id: "projects", title: "Projects", description: "Display your portfolio work", icon: Lightbulb },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add section to your profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose a section to add to your mentor profile. This helps students learn more about your background.
          </p>
          <div className="grid gap-3">
            {profileSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className={`flex items-start p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSection === section.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <Icon className={`h-5 w-5 mt-0.5 mr-3 ${
                    selectedSection === section.id ? "text-blue-600" : "text-gray-500"
                  }`} />
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      selectedSection === section.id ? "text-blue-900" : "text-gray-900"
                    }`}>
                      {section.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedSection) {
                  createSectionMutation.mutate({
                    type: selectedSection,
                    title: selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1),
                    description: `${selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} section`
                  });
                }
              }}
              disabled={!selectedSection || createSectionMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createSectionMutation.isPending ? "Adding..." : "Add Section"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EnhanceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhanceProfileModal({ isOpen, onClose }: EnhanceProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["/api/mentor/profile"],
    enabled: isOpen,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["/api/mentor/sections"],
    enabled: isOpen,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["/api/mentor/resources"],
    enabled: isOpen,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/mentor/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const enhancementTips = [
    {
      title: "Add a professional headshot",
      description: "Profiles with photos get 14x more views",
      icon: Users,
      action: "Upload Photo",
      completed: !!profile?.photo,
    },
    {
      title: "Write a compelling bio",
      description: "Tell your story in the About section",
      icon: FileText,
      action: "Add Bio",
      completed: !!profile?.bio,
    },
    {
      title: "Showcase your skills",
      description: "Add at least 5 relevant skills",
      icon: Target,
      action: "Add Skills",
      completed: (profile?.skills?.length || 0) >= 5,
    },
    {
      title: "Add profile sections",
      description: "Include experience, education, and projects",
      icon: Award,
      action: "Add Sections",
      completed: sections.length >= 3,
    },
    {
      title: "Share helpful resources",
      description: "Provide learning materials for students",
      icon: BookOpen,
      action: "Add Resources",
      completed: resources.length >= 1,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enhance your profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">75%</div>
            <div className="text-sm text-blue-800">Profile Strength</div>
            <div className="text-xs text-blue-600 mt-1">Intermediate</div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Complete these to strengthen your profile:</h4>
            {enhancementTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                  <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{tip.title}</h5>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tip.completed ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Done
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs">
                        {tip.action}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResourcesModal({ isOpen, onClose }: ResourcesModalProps) {
  const [selectedTab, setSelectedTab] = useState("manage");
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    type: "link",
    url: "",
    category: "learning",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/mentor/resources"],
    enabled: isOpen,
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      const response = await apiRequest("POST", "/api/mentor/resources", resourceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/resources"] });
      toast({
        title: "Success",
        description: "Resource added successfully.",
      });
      setNewResource({
        title: "",
        description: "",
        type: "link",
        url: "",
        category: "learning",
      });
      setSelectedTab("manage");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest("DELETE", `/api/mentor/resources/${resourceId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/resources"] });
      toast({
        title: "Success",
        description: "Resource deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddResource = () => {
    if (!newResource.title || !newResource.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createResourceMutation.mutate(newResource);
  };

  const groupedResources = resources.reduce((acc: any, resource: any) => {
    const category = resource.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(resource);
    return acc;
  }, {});

  const categoryIcons = {
    learning: BookOpen,
    tools: Download,
    links: ExternalLink,
    other: FileText,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mentor Resources</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex gap-2 border-b">
            <Button 
              variant={selectedTab === "manage" ? "default" : "ghost"}
              onClick={() => setSelectedTab("manage")}
              size="sm"
            >
              Manage Resources
            </Button>
            <Button 
              variant={selectedTab === "add" ? "default" : "ghost"}
              onClick={() => setSelectedTab("add")}
              size="sm"
            >
              Add Resource
            </Button>
          </div>

          {selectedTab === "add" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  placeholder="Resource title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  placeholder="Resource description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="link">Link</option>
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                  <option value="download">Download</option>
                </select>
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  placeholder="Resource URL"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newResource.category}
                  onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="learning">Learning Materials</option>
                  <option value="tools">Tools & Templates</option>
                  <option value="links">External Links</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddResource} disabled={createResourceMutation.isPending}>
                  {createResourceMutation.isPending ? "Adding..." : "Add Resource"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedTab("manage")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {selectedTab === "manage" && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading resources...</p>
                </div>
              ) : Object.keys(groupedResources).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No resources added yet.</p>
                  <Button onClick={() => setSelectedTab("add")} className="mt-4">
                    Add Your First Resource
                  </Button>
                </div>
              ) : (
                Object.entries(groupedResources).map(([category, categoryResources]: [string, any]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons] || FileText;
                  return (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Icon className="h-5 w-5" />
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {categoryResources.map((resource: any) => (
                            <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-3">
                                {resource.type === "video" && <Play className="h-4 w-4 text-blue-600" />}
                                {resource.type === "document" && <FileText className="h-4 w-4 text-green-600" />}
                                {resource.type === "download" && <Download className="h-4 w-4 text-purple-600" />}
                                {resource.type === "link" && <ExternalLink className="h-4 w-4 text-orange-600" />}
                                <div>
                                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                                  <p className="text-sm text-gray-500">
                                    {resource.description || resource.url}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {resource.url && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(resource.url, '_blank')}>
                                    {resource.type === "link" ? "Visit" : resource.type === "download" ? "Download" : "View"}
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => deleteResourceMutation.mutate(resource.id)}
                                  disabled={deleteResourceMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}