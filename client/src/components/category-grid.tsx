import { Category } from "@shared/schema";
import { CategoryCard } from "@/components/category-card";

interface CategoryGridProps {
  categories: Category[];
  videoCounts: { [key: number]: number };
  className?: string;
}

export function CategoryGrid({ categories, videoCounts, className = "" }: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Browse Categories</h2>
        <p className="text-sm sm:text-base text-gray-600">Choose a category to explore videos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            videoCount={videoCounts[category.id] || 0}
          />
        ))}
      </div>
    </div>
  );
}