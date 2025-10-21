import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";

interface Movie {
  id: number;
  title: string;
  russian: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  release_details?: {
    genres?: string[];
  };
}

const MOVIES_PER_PAGE = 20;
const GENRE_CATEGORIES = [
  { name: "Top Rated", filter: (m: Movie) => m.rating >= 8 },
  { name: "Horror", filter: (m: Movie) => m.description?.toLowerCase().includes("horror") || m.description?.toLowerCase().includes("ужас") },
  { name: "Drama", filter: (m: Movie) => m.description?.toLowerCase().includes("drama") || m.description?.toLowerCase().includes("драма") },
  { name: "Action", filter: (m: Movie) => m.description?.toLowerCase().includes("action") || m.description?.toLowerCase().includes("экшн") },
  { name: "Comedy", filter: (m: Movie) => m.description?.toLowerCase().includes("comedy") || m.description?.toLowerCase().includes("комед") },
];

const Index = () => {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = allMovies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.russian?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplayMovies(filtered.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(filtered.length > MOVIES_PER_PAGE);
    } else {
      setDisplayMovies(allMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(allMovies.length > MOVIES_PER_PAGE);
    }
  }, [searchQuery, allMovies]);

  const fetchMovies = async () => {
    try {
      const response = await fetch('/data/movies.json');
      const data = await response.json();
      setAllMovies(data);
      setDisplayMovies(data.slice(0, MOVIES_PER_PAGE));
      setHasMore(data.length > MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * MOVIES_PER_PAGE;
    const end = start + MOVIES_PER_PAGE;
    
    const source = searchQuery ? 
      allMovies.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.russian?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) : allMovies;
    
    setDisplayMovies(prev => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  const getCategoryMovies = (filterFn: (m: Movie) => boolean) => {
    return allMovies.filter(filterFn).slice(0, 20);
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[400px] bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center relative z-10 animate-fade-up">
          <h1 className="text-6xl font-display font-bold mb-6 gradient-text text-center">Reverse</h1>
          <p className="text-xl text-muted-foreground mb-8 text-center max-w-2xl">
            Your personal movie tracking and recommendation platform
          </p>
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search movies, series, games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {!searchQuery && GENRE_CATEGORIES.map((category, idx) => {
          const movies = getCategoryMovies(category.filter);
          if (movies.length === 0) return null;
          
          return (
            <div key={category.name} className="mb-16 animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <h2 className="text-3xl font-display font-bold mb-6 gradient-text">{category.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          );
        })}

        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold mb-6 gradient-text">Search Results</h2>
          </div>
        )}

        {(searchQuery || !GENRE_CATEGORIES.some(c => getCategoryMovies(c.filter).length > 0)) && (
          <>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-12">
                    <Button onClick={loadMore} size="lg" className="gap-2">
                      Load More Movies
                    </Button>
                  </div>
                )}
              </>
            )}

            {!loading && displayMovies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No movies found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
