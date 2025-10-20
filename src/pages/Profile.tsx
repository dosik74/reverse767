import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, UserCheck, Users, Star, Film } from "lucide-react";
import ProfileEditor from "@/components/ProfileEditor";
import FavoriteMovies from "@/components/FavoriteMovies";
import UserActivity from "@/components/UserActivity";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  background_gif_url: string | null;
  level: number;
  xp: number;
}

const Profile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({ movies: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
      if (currentUserId && currentUserId !== userId) {
        checkFollowStatus();
        checkFriendshipStatus();
      }
    }
  }, [userId, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const [moviesData, followersData, followingData] = await Promise.all([
      supabase.from('user_movies').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
    ]);

    setStats({
      movies: moviesData.count || 0,
      followers: followersData.count || 0,
      following: followingData.count || 0,
    });
  };

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const checkFriendshipStatus = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('status')
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .maybeSingle();

    setFriendshipStatus(data?.status || null);
  };

  const handleFollow = async () => {
    if (!currentUserId) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
        toast.success('Unfollowed');
      } else {
        await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: userId,
        });
        toast.success('Following');
      }
      setIsFollowing(!isFollowing);
      fetchStats();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const handleFriendRequest = async () => {
    if (!currentUserId) return;

    try {
      await supabase.from('friendships').insert({
        user_id: currentUserId,
        friend_id: userId,
        status: 'pending',
      });
      toast.success('Friend request sent');
      setFriendshipStatus('pending');
    } catch (error) {
      toast.error('Failed to send friend request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;
  const backgroundStyle = profile.background_gif_url
    ? { backgroundImage: `url(${profile.background_gif_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="min-h-screen">
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20" style={backgroundStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <Card className="card-glow">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32 border-4 border-background">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                        Level {profile.level}
                      </span>
                      <span className="text-sm text-muted-foreground">{profile.xp} XP</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <Button onClick={() => setShowEditor(true)}>Edit Profile</Button>
                    ) : (
                      <>
                        <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                          {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                          {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        {!friendshipStatus && (
                          <Button onClick={handleFriendRequest} variant="outline">
                            <Users className="w-4 h-4 mr-2" />
                            Add Friend
                          </Button>
                        )}
                        {friendshipStatus === 'pending' && (
                          <Button variant="outline" disabled>
                            Request Pending
                          </Button>
                        )}
                        {friendshipStatus === 'accepted' && (
                          <Button variant="outline" disabled>
                            <Users className="w-4 h-4 mr-2" />
                            Friends
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}

                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      <span className="font-bold text-lg">{stats.movies}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Movies</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-lg">{stats.followers}</span>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-lg">{stats.following}</span>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="favorites" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites">
              <Star className="w-4 h-4 mr-2" />
              Top 50
            </TabsTrigger>
            <TabsTrigger value="watched">
              <Film className="w-4 h-4 mr-2" />
              Watched
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity
            </TabsTrigger>
            <TabsTrigger value="stats">
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6 animate-fade-in">
            <FavoriteMovies userId={userId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="watched" className="mt-6 animate-fade-in">
            <UserActivity userId={userId!} showOnlyWatched={true} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6 animate-fade-in">
            <UserActivity userId={userId!} showOnlyWatched={false} />
          </TabsContent>

          <TabsContent value="stats" className="mt-6 animate-fade-in">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Stats coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showEditor && (
        <ProfileEditor
          profile={profile}
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onUpdate={fetchProfile}
        />
      )}
    </div>
  );
};

export default Profile;
