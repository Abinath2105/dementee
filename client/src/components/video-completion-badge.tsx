import { CheckCircle, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoCompletionBadgeProps {
  isCompleted: boolean;
  size?: "sm" | "md" | "lg";
}

export function VideoCompletionBadge({ isCompleted, size = "md" }: VideoCompletionBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  
  if (isCompleted) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
        <CheckCircle className={`${iconSize} mr-1`} />
        Completed
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