import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Save, Upload, Image, X, Tag, Eye } from 'lucide-react';
import RichTextEditor from '@/components/rich-text-editor';

export default function BlogEditorPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    author: '',
    authorEmail: '',
    status: 'draft',
    categoryId: '',
    tags: [] as string[],
    isPublic: true,
    isFeatured: false,
    publishedAt: '',
  });

  const isEdit = !!id;

  // Fetch blog post for editing
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['/api/admin/blog', id],
    queryFn: async () => {
      const response = await fetch(`/api/blog/id/${id}`);
      if (!response.ok) throw new Error('Failed to fetch blog post');
      return response.json();
    },
    enabled: isEdit,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  useEffect(() => {
    if (post && isEdit) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        coverImage: post.coverImage || '',
        author: post.author || '',
        authorEmail: post.authorEmail || '',
        status: post.status || 'draft',
        categoryId: post.categoryId ? post.categoryId.toString() : '',
        tags: post.tags || [],
        isPublic: post.isPublic !== undefined ? post.isPublic : true,
        isFeatured: post.isFeatured !== undefined ? post.isFeatured : false,
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : '',
      });
    }
  }, [post, isEdit]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/blog', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({
        title: 'Success',
        description: 'Blog post created successfully',
      });
      navigate('/admin');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create blog post',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/admin/blog/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({
        title: 'Success',
        description: 'Blog post updated successfully',
      });
      navigate('/admin');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog post',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast({
        title: 'Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug when title changes
    if (field === 'title' && value) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('coverImage', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      handleChange('coverImage', data.url);
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/blog/${formData.slug}`, '_blank');
    } else {
      toast({
        title: 'Error',
        description: 'Please save the post first to preview',
        variant: 'destructive',
      });
    }
  };

  if (isEdit && postLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!formData.slug}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter an engaging title for your blog post"
                  className="text-lg"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-base font-medium">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="auto-generated-from-title"
                />
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Content *</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => handleChange('content', content)}
                  placeholder="Start writing your blog post..."
                  className="min-h-[500px]"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cover Image */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Label className="text-base font-medium mb-3 block">Cover Image</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={formData.coverImage}
                      onChange={(e) => handleChange('coverImage', e.target.value)}
                      placeholder="Enter image URL or upload"
                      className="flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  {formData.coverImage && (
                    <div className="relative">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange('coverImage', '')}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Label htmlFor="excerpt" className="text-base font-medium mb-3 block">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Brief description of the blog post"
                  rows={4}
                />
              </div>

              {/* Metadata */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-base font-medium">Metadata</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => handleChange('author', e.target.value)}
                    placeholder="Enter author name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorEmail">Author Email</Label>
                  <Input
                    id="authorEmail"
                    type="email"
                    value={formData.authorEmail}
                    onChange={(e) => handleChange('authorEmail', e.target.value)}
                    placeholder="Enter author email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">📝 Draft</SelectItem>
                      <SelectItem value="published">✅ Published</SelectItem>
                      <SelectItem value="archived">📦 Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishedAt">Publish Date</Label>
                  <Input
                    id="publishedAt"
                    type="datetime-local"
                    value={formData.publishedAt}
                    onChange={(e) => handleChange('publishedAt', e.target.value)}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                <Label className="text-base font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleAddTag}
                  placeholder="Add tags (press Enter)"
                />
              </div>

              {/* Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-base font-medium">Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic">Public Post</Label>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => handleChange('isPublic', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Featured Post</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}