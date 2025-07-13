import { Link } from "wouter";
import { Category } from "@/../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  videoCount?: number;
  onClick?: () => void;
}

export function CategoryCard({ category, videoCount = 0, onClick }: CategoryCardProps) {
  const cardContent = (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group">
      <div className="relative overflow-hidden rounded-t-lg">
        {category.coverImage ? (
          <img
            src={category.coverImage}
            alt={category.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-4xl font-bold">
              {category.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {category.name}
        </CardTitle>
        
        {category.mentorName && (
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <User className="h-4 w-4 mr-1" />
            <span>{category.mentorName}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {category.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {category.description}
          </p>
        )}
        
        <div className="flex justify-between items-center">
          <Badge variant="secondary">
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return <div onClick={onClick}>{cardContent}</div>;
  }

  return (
    <Link href={`/category/${category.slug}`}>
      {cardContent}
    </Link>
  );
}