import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Film, Gamepad, Book, Music, Tv } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  metadata?: {
    type?: 'movie' | 'anime' | 'game' | 'book' | 'music';
    itemId?: string;
    title?: string;
    poster?: string;
  };
}

interface ChatWindowProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendUsername: string;
  friendAvatar: string | null;
  currentUserId: string;
}

const ChatWindow = ({ open, onClose, friendId, friendUsername, friendAvatar, currentUserId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetchMessages();
      subscribeToMessages();
      markMessagesAsRead();
    }
  }, [open, friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat_${currentUserId}_${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId}))`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', friendId)
      .eq('read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const sendRecommendation = async (type: 'movie' | 'anime' | 'game' | 'book' | 'music') => {
    const content = `Check out this ${type}!`;
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content,
      });

      if (error) throw error;
      toast.success(`${type} recommendation sent!`);
    } catch (error: any) {
      toast.error('Failed to send recommendation');
    }
  };

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'anime': return <Tv className="w-4 h-4" />;
      case 'game': return <Gamepad className="w-4 h-4" />;
      case 'book': return <Book className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={friendAvatar || undefined} />
              <AvatarFallback>{friendUsername[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{friendUsername}</DialogTitle>
              <DialogDescription>Send messages and recommendations</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-fade-in ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={friendAvatar || undefined} />
                        <AvatarFallback>{friendUsername[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.metadata?.type && (
                          <div className="flex items-center gap-2 mb-1 opacity-70">
                            {getMediaIcon(message.metadata.type)}
                            <span className="text-xs">Recommendation</span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendRecommendation('movie')}
              className="gap-1"
            >
              <Film className="w-4 h-4" />
              Movie
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendRecommendation('anime')}
              className="gap-1"
            >
              <Tv className="w-4 h-4" />
              Anime
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendRecommendation('game')}
              className="gap-1"
            >
              <Gamepad className="w-4 h-4" />
              Game
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendRecommendation('book')}
              className="gap-1"
            >
              <Book className="w-4 h-4" />
              Book
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendRecommendation('music')}
              className="gap-1"
            >
              <Music className="w-4 h-4" />
              Music
            </Button>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} size="icon" className="shrink-0 h-auto">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatWindow;
