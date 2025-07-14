import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Reply, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type VideoWithCategory } from "@shared/schema";

interface VideoCommentsProps {
  video: VideoWithCategory;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
  parentId?: number;
  replies?: Comment[];
}

export function VideoComments({ video }: VideoCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/videos", video.id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${video.id}/comments`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: number }) => {
      return await apiRequest(`/api/videos/${video.id}/comments`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos", video.id, "comments"] });
      setNewComment("");
      setReplyingTo(null);
      setReplyContent("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate({ content: newComment.trim() });
    }
  };

  const handleSubmitReply = (parentId: number) => {
    if (replyContent.trim()) {
      commentMutation.mutate({ content: replyContent.trim(), parentId });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.user.fullName}</span>
            <span className="text-xs text-gray-500">@{comment.user.username}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs h-auto p-1 text-blue-600 hover:text-blue-700"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>
      
      {replyingTo === comment.id && (
        <div className="ml-11 mt-2 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmitReply(comment.id)}
              disabled={!replyContent.trim() || commentMutation.isPending}
              size="sm"
            >
              Reply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || commentMutation.isPending}
            size="sm"
          >
            Post Comment
          </Button>
        </div>

        {/* Comments list */}
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}