import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

  // Fetch blog post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/blog', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blog post not found');
        }
        throw new Error('Failed to fetch blog post');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Calculate reading time
  useEffect(() => {
    if (post?.content) {
      const wordsPerMinute = 200;
      const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      const time = Math.ceil(wordCount / wordsPerMinute);
      setReadingTime(time);
    }
  }, [post?.content]);

  // Increment view count
  const incrementViewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/blog/${slug}/view`);
    },
  });

  useEffect(() => {
    if (post && !incrementViewMutation.isSuccess) {
      incrementViewMutation.mutate();
    }
  }, [post]);

  // Bookmark functionality
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const method = isBookmarked ? 'DELETE' : 'POST';
      await apiRequest(method, `/api/blog/${slug}/bookmark`);
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? 'Bookmark removed' : 'Post bookmarked',
        description: isBookmarked ? 'Removed from your reading list' : 'Added to your reading list',
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Blog post link copied to clipboard',
    });
  };

  const shareOnTwitter = () => {
    const text = `${post?.title} by ${post?.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-4">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              )}
              
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={shareOnTwitter}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={shareOnFacebook}>
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={shareOnLinkedIn}>
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          {/* Category & Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              {post.excerpt}
            </p>
          )}

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.author}</p>
                  {post.authorEmail && (
                    <p className="text-sm text-gray-500">{post.authorEmail}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{format(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{readingTime} min read</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{post.viewCount || 0} views</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div 
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-img:rounded-lg prose-img:shadow-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.author}</p>
                  <p className="text-sm text-gray-500">Author</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={shareOnTwitter}>
                <Twitter className="h-4 w-4 mr-2" />
                Share
              </Button>
              {user && (
                <Button
                  variant={isBookmarked ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}