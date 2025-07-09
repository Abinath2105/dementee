import { useState } from "react";
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

  const openToOptions = [
    { id: "mentoring", label: "Mentoring junior developers", icon: Users },
    { id: "collaboration", label: "Collaboration on projects", icon: MessageSquare },
    { id: "consulting", label: "Technical consulting", icon: Target },
    { id: "speaking", label: "Speaking engagements", icon: Calendar },
    { id: "teaching", label: "Teaching opportunities", icon: BookOpen },
  ];

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
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
              onClick={() => {
                // Save selected options logic here
                onClose();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save
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
                  // Add section logic here
                  onClose();
                }
              }}
              disabled={!selectedSection}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Add Section
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
  const enhancementTips = [
    {
      title: "Add a professional headshot",
      description: "Profiles with photos get 14x more views",
      icon: Users,
      action: "Upload Photo",
      completed: true,
    },
    {
      title: "Write a compelling summary",
      description: "Tell your story in the About section",
      icon: FileText,
      action: "Add Summary",
      completed: false,
    },
    {
      title: "Showcase your skills",
      description: "Add at least 5 relevant skills",
      icon: Target,
      action: "Add Skills",
      completed: false,
    },
    {
      title: "Get recommendations",
      description: "Ask colleagues for recommendations",
      icon: Star,
      action: "Request",
      completed: false,
    },
    {
      title: "Share your achievements",
      description: "Add certifications and awards",
      icon: Award,
      action: "Add Achievements",
      completed: false,
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
  const resourceCategories = [
    {
      title: "Learning Materials",
      icon: BookOpen,
      resources: [
        { name: "JavaScript Fundamentals Course", type: "video", duration: "4 hours" },
        { name: "React Best Practices Guide", type: "document", pages: "25 pages" },
        { name: "Node.js Workshop Recording", type: "video", duration: "2 hours" },
      ],
    },
    {
      title: "Templates & Tools",
      icon: Download,
      resources: [
        { name: "Project Starter Template", type: "download", size: "2.5 MB" },
        { name: "Code Review Checklist", type: "document", pages: "3 pages" },
        { name: "Development Setup Guide", type: "document", pages: "8 pages" },
      ],
    },
    {
      title: "External Links",
      icon: ExternalLink,
      resources: [
        { name: "My GitHub Portfolio", type: "link", url: "github.com" },
        { name: "Tech Blog Articles", type: "link", url: "medium.com" },
        { name: "YouTube Channel", type: "link", url: "youtube.com" },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mentor Resources</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Access helpful resources shared by your mentor to support your learning journey.
          </p>
          
          {resourceCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.resources.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                          {resource.type === "video" && <Play className="h-4 w-4 text-blue-600" />}
                          {resource.type === "document" && <FileText className="h-4 w-4 text-green-600" />}
                          {resource.type === "download" && <Download className="h-4 w-4 text-purple-600" />}
                          {resource.type === "link" && <ExternalLink className="h-4 w-4 text-orange-600" />}
                          <div>
                            <h4 className="font-medium text-gray-900">{resource.name}</h4>
                            <p className="text-sm text-gray-500">
                              {resource.duration || resource.pages || resource.size || resource.url}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          {resource.type === "link" ? "Visit" : resource.type === "download" ? "Download" : "View"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}