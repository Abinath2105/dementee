import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, User, Phone, Mail, FileText } from 'lucide-react';

interface EventApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export default function EventApplicationModal({ isOpen, onClose, event }: EventApplicationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    occupation: '',
    company: '',
    experience: '',
    motivation: '',
    expectations: '',
    notes: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applicationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/events/${event?.id}/apply`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Application Submitted!',
        description: 'Your application has been submitted successfully. We will contact you soon!',
      });
      onClose();
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        occupation: '',
        company: '',
        experience: '',
        motivation: '',
        expectations: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phoneNumber) {
      toast({
        title: 'Error',
        description: 'Name, email, and phone number are required',
        variant: 'destructive',
      });
      return;
    }

    applicationMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Apply for {event.title}
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            <p><strong>Start:</strong> {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> {event.duration} minutes</p>
            <p><strong>Instructor:</strong> {event.instructorName}</p>
            {event.price && <p><strong>Price:</strong> ${event.price}</p>}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="Your current occupation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company/Organization</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Your company or organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Relevant Experience</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              placeholder="Tell us about your relevant experience or background"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">Why do you want to attend this event?</Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) => handleChange('motivation', e.target.value)}
              placeholder="What motivates you to attend this event?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectations">What do you hope to learn or achieve?</Label>
            <Textarea
              id="expectations"
              value={formData.expectations}
              onChange={(e) => handleChange('expectations', e.target.value)}
              placeholder="What are your expectations from this event?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information you'd like to share"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={applicationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {applicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}