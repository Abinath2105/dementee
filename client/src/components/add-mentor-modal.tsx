import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Briefcase, Award, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { InsertMentor } from "@shared/schema";

interface AddMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddMentorModal({ isOpen, onClose }: AddMentorModalProps) {
  const { toast } = useToast();
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [experience, setExperience] = useState("");
  const [photo, setPhoto] = useState("");

  const addMentorMutation = useMutation({
    mutationFn: async (mentorData: InsertMentor) => {
      const response = await fetch("/api/admin/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mentorData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create mentor");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Mentor added successfully",
        description: `${data.mentor.name} has been invited and will receive an email to set up their account.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add mentor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !profession.trim() || !experience.trim()) {
      toast({
        title: "All fields are required",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const mentorData: InsertMentor = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      profession: profession.trim(),
      experience: experience.trim(),
      photo: photo.trim() || undefined,
    };

    addMentorMutation.mutate(mentorData);
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setProfession("");
    setExperience("");
    setPhoto("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Mentor
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter mentor's full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mentor@example.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="profession">Profession *</Label>
            <Input
              id="profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g., Senior Software Engineer, UI/UX Designer"
              required
            />
          </div>

          <div>
            <Label htmlFor="experience">Experience & Expertise *</Label>
            <Textarea
              id="experience"
              rows={4}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Describe the mentor's experience, expertise, and what they can teach students..."
              required
            />
          </div>

          <div>
            <Label htmlFor="photo">Profile Photo URL (Optional)</Label>
            <Input
              id="photo"
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a URL to the mentor's profile photo
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Invitation Process</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  After adding the mentor, they will receive an invitation email with a link to set up their account password and access the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMentorMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {addMentorMutation.isPending ? "Adding Mentor..." : "Add Mentor & Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}