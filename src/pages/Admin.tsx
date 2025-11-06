import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Ban, UserCheck, Users, TrendingUp } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  is_banned: boolean;
  level: number;
  xp: number;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, bannedUsers: 0, admins: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав администратора",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const loadData = async () => {
    try {
      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesMap: Record<string, string[]> = {};
      rolesData?.forEach((role: UserRole) => {
        if (!rolesMap[role.user_id]) {
          rolesMap[role.user_id] = [];
        }
        rolesMap[role.user_id].push(role.role);
      });
      setUserRoles(rolesMap);

      // Calculate stats
      const totalUsers = profilesData?.length || 0;
      const bannedUsers = profilesData?.filter(p => p.is_banned).length || 0;
      const admins = Object.values(rolesMap).filter(roles => roles.includes("admin")).length;
      setStats({ totalUsers, bannedUsers, admins });

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentBanStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: currentBanStatus ? "Пользователь разблокирован" : "Пользователь заблокирован",
      });

      loadData();
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус блокировки",
        variant: "destructive",
      });
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      // Remove all existing roles for user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Add new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as "admin" | "moderator" | "user" }]);

      if (insertError) throw insertError;

      toast({
        title: "Успешно",
        description: "Роль пользователя изменена",
      });

      loadData();
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить роль",
        variant: "destructive",
      });
    }
  };

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Панель администратора</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заблокировано</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bannedUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Администраторов</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
          <CardDescription>
            Просмотр и управление всеми пользователями системы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Уровень / XP</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile.display_name || profile.username}</div>
                        <div className="text-sm text-muted-foreground">@{profile.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>Уровень {profile.level} ({profile.xp} XP)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRoles[profile.id]?.[0] || "user"}
                        onValueChange={(value) => changeRole(profile.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {profile.is_banned ? (
                        <Badge variant="destructive">Заблокирован</Badge>
                      ) : (
                        <Badge variant="default">Активен</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={profile.is_banned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleBan(profile.id, profile.is_banned)}
                      >
                        {profile.is_banned ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Разблокировать
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Заблокировать
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
