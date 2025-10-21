import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FriendRequestActionsProps {
  friendshipId: string;
  onAction: () => void;
}

const FriendRequestActions = ({ friendshipId, onAction }: FriendRequestActionsProps) => {
  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      toast.success('Friend request accepted!');
      onAction();
    } catch (error: any) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      toast.success('Friend request rejected');
      onAction();
    } catch (error: any) {
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleAccept} size="sm" className="gap-1">
        <Check className="w-4 h-4" />
        Accept
      </Button>
      <Button onClick={handleReject} size="sm" variant="outline" className="gap-1">
        <X className="w-4 h-4" />
        Reject
      </Button>
    </div>
  );
};

export default FriendRequestActions;
