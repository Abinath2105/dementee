import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Calendar, Clock, Users, Video, MapPin, DollarSign, Upload, ImageIcon } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  mode: 'create' | 'edit';
}

export default function EventModal({ isOpen, onClose, event, mode }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'webinar',
    status: 'active',
    instructorName: '',
    instructorEmail: '',
    maxParticipants: 100,
    price: 0,
    meetingLink: '',
    startDate: '',
    endDate: '',
    location: '',
    coverImage: '',
    isPublic: true,
  });

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Removed category selection as requested

  useEffect(() => {
    if (event && mode === 'edit') {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'webinar',
        status: event.status || 'active',
        instructorName: event.instructorName || '',
        instructorEmail: event.instructorEmail || '',
        maxParticipants: event.maxParticipants || 100,
        price: event.price || 0,
        meetingLink: event.meetingLink || '',
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        coverImage: event.coverImage || '',
        isPublic: event.isPublic !== undefined ? event.isPublic : true,
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        type: 'webinar',
        status: 'active',
        categoryId: '',
        instructorName: '',
        instructorEmail: '',
        maxParticipants: 100,
        price: 0,
        meetingLink: '',
        meetingPassword: '',
        startDate: '',
        endDate: '',
        duration: 60,
        location: '',
        coverImage: '',
        isPublic: true,
        registrationDeadline: '',
      });
    }
  }, [event, mode, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      toast({
        title: 'Success',
        description: 'Event created successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/admin/events/${event?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Error',
        description: 'Title, start date, and end date are required',
        variant: 'destructive',
      });
      return;
    }

    let coverImageUrl = formData.coverImage;

    // Upload cover image if a new file is selected
    if (coverImageFile) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('coverImage', coverImageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include',
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          coverImageUrl = uploadResult.url || uploadResult.coverImage;
        } else {
          throw new Error('Image upload failed');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to upload cover image',
          variant: 'destructive',
        });
        return;
      }
    }

    const submitData = {
      ...formData,
      coverImage: coverImageUrl,
      maxParticipants: parseInt(formData.maxParticipants.toString()),
      price: formData.price.toString(), // Keep as string per schema
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {mode === 'create' ? 'Create Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webinar">🎥 Webinar</SelectItem>
                  <SelectItem value="workshop">🛠️ Workshop</SelectItem>
                  <SelectItem value="course">📚 Course</SelectItem>
                  <SelectItem value="meetup">🤝 Meetup</SelectItem>
                  <SelectItem value="conference">🎤 Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter event description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPublic">Event Access</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleChange('isPublic', checked)}
                />
                <Label htmlFor="isPublic" className="text-sm">
                  {formData.isPublic ? 'Open to all logged-in users' : 'Restricted access'}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleChange('maxParticipants', e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructorName">Instructor Name</Label>
              <Input
                id="instructorName"
                value={formData.instructorName}
                onChange={(e) => handleChange('instructorName', e.target.value)}
                placeholder="Enter instructor name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructorEmail">Instructor Email</Label>
              <Input
                id="instructorEmail"
                type="email"
                value={formData.instructorEmail}
                onChange={(e) => handleChange('instructorEmail', e.target.value)}
                placeholder="Enter instructor email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              min="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) => handleChange('meetingLink', e.target.value)}
                placeholder="https://zoom.us/j/... (no password needed)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter event location"
              />
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('coverImage')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                  {(imagePreview || formData.coverImage) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCoverImageFile(null);
                        setImagePreview('');
                        handleChange('coverImage', '');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {(imagePreview || formData.coverImage) && (
                  <div className="relative w-32 h-20 rounded-md overflow-hidden border">
                    <img
                      src={imagePreview || formData.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleChange('isPublic', checked)}
              />
              <Label htmlFor="isPublic">Public Event</Label>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 
                  mode === 'create' ? 'Create Event' : 'Update Event'}
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}