import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerCarouselProps {
  banners: string[];
  className?: string;
}

export function BannerCarousel({ banners, className = "" }: BannerCarouselProps) {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className={`relative h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Welcome to Zmartclass</h2>
          <p className="text-xl opacity-90">Your premier video learning platform</p>
        </div>
      </div>
    );
  }

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className={`relative h-64 rounded-lg overflow-hidden ${className}`}>
      {/* Banner Images */}
      <div className="relative h-full">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentBanner ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={banner}
              alt={`Banner ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
            onClick={prevBanner}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
            onClick={nextBanner}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentBanner ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentBanner(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}