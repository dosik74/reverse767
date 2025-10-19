import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageCircle, Film } from "lucide-react";
import { format } from "date-fns";

interface Activity {
  id: string;
  type: 'rating' | 'comment' | 'favorite';
  movie_title: string;
  rating?: number;
  content?: string;
  created_at: string;
}

interface UserActivityProps {
  userId: string;
}

const UserActivity = ({ userId }: UserActivityProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [moviesData, setMoviesData] = useState<any[]>([]);

  useEffect(() => {
    loadMoviesData();
    fetchActivities();
  }, [userId]);

  const loadMoviesData = async () => {
    const response = await fetch('/data/movies.json');
    const data = await response.json();
    setMoviesData(data);
  };

  const fetchActivities = async () => {
    try {
      const [ratings, comments, favorites] = await Promise.all([
        supabase
          .from('user_movies')
          .select('movie_id, rating, created_at')
          .eq('user_id', userId)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('comments')
          .select('movie_id, content, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('favorite_movies')
          .select('movie_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const allActivities: Activity[] = [
        ...(ratings.data || []).map(r => ({
          id: `rating-${r.movie_id}`,
          type: 'rating' as const,
          movie_title: moviesData.find(m => m.id === r.movie_id)?.title || 'Unknown',
          rating: r.rating,
          created_at: r.created_at,
        })),
        ...(comments.data || []).map(c => ({
          id: `comment-${c.movie_id}-${c.created_at}`,
          type: 'comment' as const,
          movie_title: moviesData.find(m => m.id === c.movie_id)?.title || 'Unknown',
          content: c.content,
          created_at: c.created_at,
        })),
        ...(favorites.data || []).map(f => ({
          id: `favorite-${f.movie_id}`,
          type: 'favorite' as const,
          movie_title: moviesData.find(m => m.id === f.movie_id)?.title || 'Unknown',
          created_at: f.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(allActivities.slice(0, 20));
    } catch (error) {
      console.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="hover:border-primary transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-primary/20">
                {activity.type === 'rating' && <Star className="w-5 h-5 text-primary" />}
                {activity.type === 'comment' && <MessageCircle className="w-5 h-5 text-primary" />}
                {activity.type === 'favorite' && <Star className="w-5 h-5 text-accent" />}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {activity.type === 'rating' && `Rated ${activity.movie_title}`}
                      {activity.type === 'comment' && `Commented on ${activity.movie_title}`}
                      {activity.type === 'favorite' && `Added ${activity.movie_title} to favorites`}
                    </p>
                    {activity.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-bold">{activity.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {activity.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {activity.content}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserActivity;
