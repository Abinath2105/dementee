import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video } from "lucide-react";
import { Navigation } from "@/components/navigation";
import type { Category, CourseWithVideos } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: courses = [] } = useQuery<CourseWithVideos[]>({
    queryKey: ["/api/courses", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const response = await fetch(`/api/courses?categoryId=${selectedCategory}`);
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
    enabled: !!selectedCategory
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">De mentee Academy</h1>
          <p className="text-xl mb-8 opacity-90">Learn from curated video courses</p>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse Categories</h2>
        
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500">
              {user?.isAdmin ? "Start by creating categories and courses in the admin panel." : "Check back soon for new content!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Courses Section */}
        {selectedCategory && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Courses</h3>
              <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                Back to Categories
              </Button>
            </div>
            
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No courses available in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{course.title}</CardTitle>
                      {course.description && (
                        <p className="text-sm text-gray-600">{course.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="mb-2">
                        {course.videos?.length || 0} videos
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}