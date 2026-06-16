import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  visitor_id: string;
  sender_type: "user" | "admin";
  message_text: string;
  is_read: boolean;
  created_at: string;
  listing_id: string | null;
}

interface UserMessagingBoxProps {
  visitorId: string;
  className?: string;
}

export function UserMessagingBox({ visitorId, className = "" }: UserMessagingBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visitorId) {
      loadMessages();
    }
  }, [visitorId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_user_messages")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);

      // Mark unread admin messages as read
      const unreadAdminMsgs = (data || []).filter(m => m.sender_type === "admin" && !m.is_read);
      if (unreadAdminMsgs.length > 0) {
        await supabase
          .from("admin_user_messages")
          .update({ is_read: true })
          .in("id", unreadAdminMsgs.map(m => m.id));
      }
    } catch (err) {
      console.error("[UserMessaging] Load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !visitorId) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("admin_user_messages").insert({
        visitor_id: visitorId,
        sender_type: "user",
        message_text: newMessage.trim(),
        is_read: false,
      });

      if (error) throw error;

      setNewMessage("");
      await loadMessages();
      toast.success("Message sent to admin");

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("[UserMessaging] Send error:", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = messages.filter(m => m.sender_type === "admin" && !m.is_read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              My Messages
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">Communicate with AgriSMES admin</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border">
              {/* Messages Area */}
              <ScrollArea className="h-[250px] p-3" ref={scrollRef}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Send a message to request appointments or ask questions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.sender_type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] font-medium">
                              {msg.sender_type === "user" ? "You" : "Admin"}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                          <p className={`text-[10px] mt-1 ${
                            msg.sender_type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t border-border bg-muted/20">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Request an appointment, ask about a listing..."
                    className="min-h-[60px] resize-none text-sm"
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
                    className="h-[60px] w-12"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Use this to schedule meetings or discuss listings
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default UserMessagingBox;
