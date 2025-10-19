import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface ProfileEditorProps {
  profile: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ProfileEditor = ({ profile, open, onClose, onUpdate }: ProfileEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'background' | null>(null);
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || '',
    background_gif_url: profile.background_gif_url || '',
  });

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = type === 'avatar' ? 5 : 10; // MB
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSize}MB`);
      return;
    }

    try {
      setUploading(type);
      const bucket = type === 'avatar' ? 'avatars' : 'backgrounds';
      const url = await uploadFile(file, bucket);

      setFormData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'background_gif_url']: url
      }));

      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your display name"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div>
              <Label>Avatar</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.avatar_url && (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'avatar')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploading === 'avatar'}
                  >
                    {uploading === 'avatar' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Profile Background (GIF)</Label>
              <div className="mt-2">
                {formData.background_gif_url && (
                  <div className="mb-4 h-32 rounded-lg overflow-hidden">
                    <img
                      src={formData.background_gif_url}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="background-upload"
                    accept="image/gif,image/webp,image/jpeg,image/png"
                    onChange={(e) => handleFileUpload(e, 'background')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('background-upload')?.click()}
                    disabled={uploading === 'background'}
                  >
                    {uploading === 'background' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Background
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 10MB, GIF recommended</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
