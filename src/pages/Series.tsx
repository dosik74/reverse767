import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SeriesCard from "@/components/SeriesCard";

interface Series {
  id: number;
  title: string;
  russian?: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  release_details?: {
    seasons?: number;
    episodes?: number;
    studio?: string;
    genres?: string[];
  };
}

const SERIES_PER_PAGE = 20;

const Series = () => {
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [displaySeries, setDisplaySeries] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  useEffect(() => {
    const source = allSeries;
    if (searchQuery) {
      const filtered = source.filter(
        (series) =>
          series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          series.russian?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          series.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplaySeries(filtered.slice(0, SERIES_PER_PAGE));
      setPage(1);
      setHasMore(filtered.length > SERIES_PER_PAGE);
    } else {
      setDisplaySeries(source.slice(0, SERIES_PER_PAGE));
      setPage(1);
      setHasMore(source.length > SERIES_PER_PAGE);
    }
  }, [searchQuery, allSeries]);

  const fetchSeries = async () => {
    try {
      const response = await fetch('/data/series.json');
      const data = await response.json();
      setAllSeries(data);
      setDisplaySeries(data.slice(0, SERIES_PER_PAGE));
      setHasMore(data.length > SERIES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * SERIES_PER_PAGE;
    const end = start + SERIES_PER_PAGE;

    const source = searchQuery
      ? allSeries.filter(
          (series) =>
            series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            series.russian?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            series.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allSeries;

    setDisplaySeries((prev) => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">Сериалы</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Поиск сериалов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displaySeries.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={loadMore}>Загрузить ещё</Button>
            </div>
          )}
        </>
      )}

      {!loading && displaySeries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ничего не найдено</p>
        </div>
      )}
    </div>
  );
};

export default Series;
