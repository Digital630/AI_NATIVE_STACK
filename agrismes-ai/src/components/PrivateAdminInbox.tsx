import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Shield,
  Clock,
  CheckCheck,
  Inbox,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  listing_id: string | null;
  visitor_id: string;
  sender_type: "user" | "admin";
  message_text: string;
  is_read: boolean;
  created_at: string;
}

interface PrivateAdminInboxProps {
  visitorId: string;
  listingId?: string;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function PrivateAdminInbox({
  visitorId,
  listingId,
  isOpen,
  onClose,
  isAdmin = false,
}: PrivateAdminInboxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && visitorId) {
      loadMessages();
    }
  }, [isOpen, visitorId, listingId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("admin_user_messages")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: true });

      if (listingId) {
        query = query.eq("listing_id", listingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages((data as Message[]) || []);

      // Mark as read if admin
      if (isAdmin && data && data.length > 0) {
        const unreadIds = data
          .filter((m) => !m.is_read && m.sender_type === "user")
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from("admin_user_messages")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    } catch (err) {
      console.error("[PrivateAdminInbox] Load error:", err);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("admin_user_messages").insert({
        listing_id: listingId || null,
        visitor_id: visitorId,
        sender_type: isAdmin ? "admin" : "user",
        message_text: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      await loadMessages();
      toast.success("Message sent");
    } catch (err) {
      console.error("[PrivateAdminInbox] Send error:", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            {isAdmin ? "Admin Inbox" : "Message Admin"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Private messages from users about listings"
              : "Send a private message to AgriSMES administrators"}
          </DialogDescription>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {isAdmin
                  ? "User messages will appear here"
                  : "Start a conversation with the admin team"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64 px-4 py-3" ref={scrollRef}>
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isFromAdmin = msg.sender_type === "admin";
                  const isOwnMessage = isAdmin ? isFromAdmin : !isFromAdmin;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        {/* Sender label for admin view */}
                        {isAdmin && !isFromAdmin && (
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] opacity-70">User</span>
                          </div>
                        )}
                        {!isAdmin && isFromAdmin && (
                          <div className="flex items-center gap-1 mb-1">
                            <Shield className="w-3 h-3" />
                            <span className="text-[10px] opacity-70">AgriSMES Admin</span>
                          </div>
                        )}

                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message_text}
                        </p>

                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] opacity-50">
                            {formatTime(msg.created_at)}
                          </span>
                          {isOwnMessage && msg.is_read && (
                            <CheckCheck className="w-3 h-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 pt-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder={
                isAdmin
                  ? "Reply to user..."
                  : "Type your message to admin..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="shrink-0 h-[60px] w-10"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {isAdmin
              ? "Replies are sent directly to the user's inbox"
              : "Only AgriSMES administrators can see and reply to your messages"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Button to open inbox - for use in listings
export function MessageAdminButton({
  visitorId,
  listingId,
  variant = "outline",
}: {
  visitorId: string;
  listingId?: string;
  variant?: "outline" | "default" | "ghost";
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Message Admin</span>
      </Button>
      <PrivateAdminInbox
        visitorId={visitorId}
        listingId={listingId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isAdmin={false}
      />
    </>
  );
}

export default PrivateAdminInbox;
