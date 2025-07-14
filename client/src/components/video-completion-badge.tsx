import { CheckCircle, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoCompletionBadgeProps {
  isCompleted: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "icon-only";
}

export function VideoCompletionBadge({ 
  isCompleted, 
  size = "md", 
  variant = "default" 
}: VideoCompletionBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  
  if (isCompleted) {
    if (variant === "icon-only") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white px-2 py-1">
          <CheckCircle className={iconSize} />
        </Badge>
      );
    }
    
    if (variant === "minimal") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
          ✓ Complete
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
        <CheckCircle className={`${iconSize} mr-1`} />
        Completed
      </Badge>
    );
  }

  if (variant === "icon-only") {
    return (
      <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1">
        <PlayCircle className={iconSize} />
      </Badge>
    );
  }

  if (variant === "minimal") {
    return (
      <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs">
        Not Started
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
      <PlayCircle className={`${iconSize} mr-1`} />
      Start Learning
    </Badge>
  );
}