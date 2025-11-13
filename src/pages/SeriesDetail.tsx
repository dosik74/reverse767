import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Plus, Check, Sparkles, Play, Tv, Calendar } from "lucide-react";
import { toast } from "sonner";
import RatingDialog from "@/components/RatingDialog";
import CommentsList from "@/components/CommentsList";

interface Series {
  id: number;
  title: string;
  russian: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  release_details?: {
    schedule?: string;
    source?: string;
    episodes?: number;
    seasons?: number;
    duration?: string | null;
    studio?: string;
    director?: string | null;
    cast?: string[];
    genres?: string[];
  };
  alerts?: {
    hd_available?: boolean;
    has_subtitles?: boolean;
    release_note?: string;
  };
}

const SeriesDetail = () => {
  const { id } = useParams();
  const [series, setSeries] = useState<Series | null>(null);
  const [userSeries, setUserSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [favoriteRank, setFavoriteRank] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (id) {
      fetchSeries();
      fetchUserSeries();
      checkFavoriteStatus();
    }
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchSeries = async () => {
    try {
      const response = await fetch('/data/series.json');
      const data = await response.json();
      const found = data.find((s: Series) => s.id === Number(id));
      setSeries(found);
    } catch (error) {
      toast.error('Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSeries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
      .maybeSingle();

    setUserSeries(data);
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
      fetchUserSeries();
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

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Series not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="h-[500px] bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(15,15,28,1)), url(${series.poster})`,
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex gap-6 animate-fade-up">
            <img
              src={series.poster}
              alt={series.title}
              className="w-56 rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
              }}
            />
            <div className="flex flex-col justify-end space-y-4">
              <h1 className="text-5xl font-display font-bold mb-2 gradient-text">
                {series.russian || series.title}
              </h1>
              <div className="flex items-center gap-2 text-lg text-muted-foreground">
                <span>{series.year}</span>
                {series.release_details?.seasons && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Tv className="w-4 h-4" />
                      <span>{series.release_details.seasons} сезон(ов)</span>
                    </div>
                  </>
                )}
                {series.release_details?.episodes && (
                  <>
                    <span>•</span>
                    <span>{series.release_details.episodes} серий</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{series.rating.toFixed(1)}</span>
                </div>
                <Button onClick={() => setShowRatingDialog(true)} size="lg" className="gap-2">
                  <Star className="w-4 h-4" />
                  {userSeries?.rating ? `Ваша оценка: ${userSeries.rating}` : 'Оценить'}
                </Button>
                {favoriteRank ? (
                  <Button onClick={removeFromTop50} variant="outline" size="lg" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Топ {favoriteRank} ⭐
                  </Button>
                ) : (
                  <Button onClick={addToTop50} variant="outline" size="lg" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    В топ 50
                  </Button>
                )}
              </div>
              {series.alerts?.release_note && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Calendar className="w-4 h-4" />
                  <span>{series.alerts.release_note}</span>
                </div>
              )}
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
                  Трейлер
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Трейлер скоро появится</p>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-lg">{series.description}</p>
                
                {series.release_details && (
                  <div className="mt-6 space-y-4">
                    {series.release_details.genres && series.release_details.genres.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Жанры</h3>
                        <div className="flex flex-wrap gap-2">
                          {series.release_details.genres.map((genre, idx) => (
                            <Badge key={idx} variant="secondary">{genre}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {series.release_details.studio && (
                      <div>
                        <h3 className="font-semibold mb-2">Студия</h3>
                        <p className="text-muted-foreground">{series.release_details.studio}</p>
                      </div>
                    )}
                    
                    {series.release_details.cast && series.release_details.cast.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">В ролях</h3>
                        <p className="text-muted-foreground">{series.release_details.cast.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CommentsList movieId={Number(id)} />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Добавить в список</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={userSeries?.status === 'completed' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => addToList('completed')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Просмотрено
                </Button>
                <Button
                  variant={userSeries?.status === 'watching' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => addToList('watching')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Смотрю
                </Button>
                <Button
                  variant={userSeries?.status === 'planned' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => addToList('planned')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Запланировано
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
        currentRating={userSeries?.rating}
        onRated={fetchUserSeries}
      />
    </div>
  );
};

export default SeriesDetail;
