import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, Heart, Plus, Check } from "lucide-react";
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

  useEffect(() => {
    if (id) {
      fetchMovie();
      fetchUserMovie();
    }
  }, [id]);

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
        className="h-96 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(15,15,28,1)), url(${movie.poster})`,
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex gap-6">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-48 rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
              }}
            />
            <div className="flex flex-col justify-end">
              <h1 className="text-4xl font-bold mb-2">{movie.russian || movie.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{movie.year}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{movie.rating.toFixed(1)}</span>
                </div>
                <Button onClick={() => setShowRatingDialog(true)}>
                  {userMovie?.rating ? `Your Rating: ${userMovie.rating}` : 'Rate Movie'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
              </CardContent>
            </Card>

            <CommentsList movieId={Number(id)} />
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