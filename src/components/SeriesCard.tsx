import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Tv } from "lucide-react";

interface Series {
  id: number;
  title: string;
  russian?: string;
  year: string;
  rating: number;
  poster: string;
  release_details?: {
    seasons?: number;
    episodes?: number;
  };
}

const SeriesCard = ({ series }: { series: Series }) => {
  return (
    <Link to={`/series/${series.id}`}>
      <Card className="overflow-hidden hover-lift cursor-pointer group">
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={series.poster}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-1 text-yellow-400 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-semibold">{series.rating.toFixed(1)}</span>
            </div>
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {series.russian || series.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
              <span>{series.year}</span>
              {series.release_details?.seasons && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Tv className="w-3 h-3" />
                    <span>{series.release_details.seasons} сезон(ов)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default SeriesCard;
