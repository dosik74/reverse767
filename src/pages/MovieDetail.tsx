import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, Heart, Plus, Check, Sparkles, Play } from "lucide-react";
import { toast } from "sonner";
import RatingDialog from "@/components/RatingDialog";
import CommentsList from "@/components/CommentsList";

interface Movie {
  id: number;
  title: string;
  russian: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
}

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userMovie, setUserMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [favoriteRank, setFavoriteRank] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (id) {
      fetchMovie();
      fetchUserMovie();
      checkFavoriteStatus();
    }
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMovie = async () => {
    try {
      const response = await fetch('/data/movies.json');
      const data = await response.json();
      const found = data.find((m: Movie) => m.id === Number(id));
      setMovie(found);
    } catch (error) {
      toast.error('Failed to load movie');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMovie = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
      .maybeSingle();

    setUserMovie(data);
  };

  const checkFavoriteStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorite_movies')
      .select('rank')
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
      .maybeSingle();

    setFavoriteRank(data?.rank || null);
  };

  const addToTop50 = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to add to favorites');
      return;
    }

    try {
      const { count } = await supabase
        .from('favorite_movies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count >= 50) {
        toast.error('You already have 50 favorites. Remove one first!');
        return;
      }

      const nextRank = (count || 0) + 1;

      const { error } = await supabase
        .from('favorite_movies')
        .insert({
          user_id: user.id,
          movie_id: Number(id),
          rank: nextRank,
        });

      if (error) throw error;

      toast.success(`Added to Top ${nextRank}!`);
      setFavoriteRank(nextRank);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeFromTop50 = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorite_movies')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', Number(id));

      if (error) throw error;

      toast.success('Removed from favorites');
      setFavoriteRank(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addToList = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: Number(id),
          status,
        });

      if (error) throw error;
      toast.success(`Added to ${status}`);
      fetchUserMovie();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-muted rounded-lg mb-8" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="h-[500px] bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(15,15,28,1)), url(${movie.poster})`,
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex gap-6 animate-fade-up">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-56 rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
              }}
            />
            <div className="flex flex-col justify-end space-y-4">
              <h1 className="text-5xl font-display font-bold mb-2 gradient-text">{movie.russian || movie.title}</h1>
              <p className="text-xl text-muted-foreground">{movie.year}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{movie.rating.toFixed(1)}</span>
                </div>
                <Button onClick={() => setShowRatingDialog(true)} size="lg" className="gap-2">
                  <Star className="w-4 h-4" />
                  {userMovie?.rating ? `Your Rating: ${userMovie.rating}` : 'Rate Movie'}
                </Button>
                {favoriteRank ? (
                  <Button onClick={removeFromTop50} variant="outline" size="lg" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Top {favoriteRank} ⭐
                  </Button>
                ) : (
                  <Button onClick={addToTop50} variant="outline" size="lg" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Add to Top 50
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="animate-fade-up card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Trailer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${movie.id}`}
                    title="Movie Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-lg">{movie.description}</p>
              </CardContent>
            </Card>

            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CommentsList movieId={Number(id)} />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add to List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={userMovie?.status === 'completed' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => addToList('completed')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Completed
                </Button>
                <Button
                  variant={userMovie?.status === 'watching' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => addToList('watching')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Watching
                </Button>
                <Button
                  variant={userMovie?.status === 'planned' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => addToList('planned')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Plan to Watch
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <RatingDialog
        open={showRatingDialog}
        onClose={() => setShowRatingDialog(false)}
        movieId={Number(id)}
        currentRating={userMovie?.rating}
        onRated={fetchUserMovie}
      />
    </div>
  );
};

export default MovieDetail;