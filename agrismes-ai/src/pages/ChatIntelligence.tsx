import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  TrendingUp, 
  Users, 
  Globe, 
  Package,
  AlertCircle,
  Calendar,
  ChevronRight,
  Lock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: string;
  session_id: string;
  visitor_id: string;
  page_path: string | null;
  user_language_detected: string;
  user_role: string | null;
  commodity: string | null;
  intent_stage: string | null;
  escalation_flag: boolean;
  email_sent_flag: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  message_role: string;
  message_text_original: string;
  message_text_english: string | null;
  key_topics: string[];
  extracted_keywords: string[];
  created_at: string;
}

interface Analytics {
  totalConversations: number;
  totalMessages: number;
  escalations: number;
  topCommodities: Record<string, number>;
  topKeywords: Record<string, number>;
  topTopics: Record<string, number>;
  intentDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  conversationsPerDay: Record<string, number>;
}

export default function ChatIntelligence() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dateRange, setDateRange] = useState<"7" | "30">("7");

  // Check authentication and admin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if user has admin role
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");

        if (error || !roles || roles.length === 0) {
          setIsAuthenticated(false);
          setIsLoading(false);
          toast.error("Access denied. Admin privileges required.");
          return;
        }

        setIsAuthenticated(true);
        await loadData();
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadData = async () => {
    try {
      // Load conversations
      const daysAgo = dateRange === "7" ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: convData, error: convError } = await supabase
        .from("chat_conversations")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      if (convError) throw convError;
      setConversations(convData || []);

      // Load all messages for analytics
      const { data: msgData, error: msgError } = await supabase
        .from("chat_messages_log")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (msgError) throw msgError;

      // Compute analytics
      computeAnalytics(convData || [], msgData || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load conversation data");
    }
  };

  const computeAnalytics = (convs: Conversation[], msgs: Message[]) => {
    const topCommodities: Record<string, number> = {};
    const topKeywords: Record<string, number> = {};
    const topTopics: Record<string, number> = {};
    const intentDistribution: Record<string, number> = {};
    const languageDistribution: Record<string, number> = {};
    const conversationsPerDay: Record<string, number> = {};

    // Process conversations
    convs.forEach(conv => {
      if (conv.commodity) {
        topCommodities[conv.commodity] = (topCommodities[conv.commodity] || 0) + 1;
      }
      if (conv.intent_stage) {
        intentDistribution[conv.intent_stage] = (intentDistribution[conv.intent_stage] || 0) + 1;
      }
      if (conv.user_language_detected) {
        languageDistribution[conv.user_language_detected] = (languageDistribution[conv.user_language_detected] || 0) + 1;
      }
      const day = conv.created_at.split("T")[0];
      conversationsPerDay[day] = (conversationsPerDay[day] || 0) + 1;
    });

    // Process messages
    msgs.forEach(msg => {
      if (msg.extracted_keywords) {
        msg.extracted_keywords.forEach(kw => {
          topKeywords[kw] = (topKeywords[kw] || 0) + 1;
        });
      }
      if (msg.key_topics) {
        msg.key_topics.forEach(topic => {
          topTopics[topic] = (topTopics[topic] || 0) + 1;
        });
      }
    });

    setAnalytics({
      totalConversations: convs.length,
      totalMessages: msgs.length,
      escalations: convs.filter(c => c.escalation_flag).length,
      topCommodities,
      topKeywords,
      topTopics,
      intentDistribution,
      languageDistribution,
      conversationsPerDay,
    });
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages_log")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Failed to load conversation messages");
    }
  };

  const handleConversationSelect = async (conv: Conversation) => {
    setSelectedConversation(conv);
    await loadMessages(conv.id);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [dateRange, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This page is only accessible to authenticated administrators.
            </p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedKeywords = analytics
    ? Object.entries(analytics.topKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
    : [];

  const sortedTopics = analytics
    ? Object.entries(analytics.topTopics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  const sortedCommodities = analytics
    ? Object.entries(analytics.topCommodities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chat Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              Internal market intelligence dashboard
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === "7" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("7")}
            >
              Last 7 days
            </Button>
            <Button
              variant={dateRange === "30" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("30")}
            >
              Last 30 days
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalConversations || 0}</p>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalMessages || 0}</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.escalations || 0}</p>
                  <p className="text-sm text-muted-foreground">Escalations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {analytics?.intentDistribution?.active || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Sourcing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Top Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Top Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sortedKeywords.map(([keyword, count]) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword} ({count})
                      </Badge>
                    ))}
                    {sortedKeywords.length === 0 && (
                      <p className="text-sm text-muted-foreground">No keywords yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Top Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sortedTopics.map(([topic, count]) => (
                      <Badge key={topic} variant="outline">
                        {topic} ({count})
                      </Badge>
                    ))}
                    {sortedTopics.length === 0 && (
                      <p className="text-sm text-muted-foreground">No topics yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Commodities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Top Commodities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sortedCommodities.map(([commodity, count]) => (
                      <Badge key={commodity} variant="default">
                        {commodity} ({count})
                      </Badge>
                    ))}
                    {sortedCommodities.length === 0 && (
                      <p className="text-sm text-muted-foreground">No commodities yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intent & Language Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Intent Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics?.intentDistribution || {}).map(([intent, count]) => (
                      <div key={intent} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{intent}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {Object.keys(analytics?.intentDistribution || {}).length === 0 && (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics?.languageDistribution || {}).map(([lang, count]) => (
                      <div key={lang} className="flex justify-between items-center">
                        <span className="text-sm">
                          {lang === "en" ? "English" : lang === "sw" ? "Kiswahili" : lang === "fr" ? "French" : lang === "am" ? "Amharic" : lang}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {Object.keys(analytics?.languageDistribution || {}).length === 0 && (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Conversation List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Conversations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleConversationSelect(conv)}
                        className={`w-full text-left p-4 border-b hover:bg-accent/50 transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {conv.escalation_flag && (
                                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium truncate">
                                {conv.commodity || "General Inquiry"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">
                                {conv.user_language_detected}
                              </Badge>
                              {conv.intent_stage && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {conv.intent_stage}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {conv.message_count} messages • {new Date(conv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-sm text-muted-foreground p-4">No conversations yet</p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Message Detail */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedConversation
                      ? `Conversation from ${new Date(selectedConversation.created_at).toLocaleString()}`
                      : "Select a conversation"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div className="flex flex-wrap gap-2 pb-4 border-b">
                        {selectedConversation.user_role && (
                          <Badge>Role: {selectedConversation.user_role}</Badge>
                        )}
                        {selectedConversation.commodity && (
                          <Badge variant="secondary">Commodity: {selectedConversation.commodity}</Badge>
                        )}
                        {selectedConversation.intent_stage && (
                          <Badge variant="outline">Intent: {selectedConversation.intent_stage}</Badge>
                        )}
                        {selectedConversation.escalation_flag && (
                          <Badge variant="destructive">Escalated</Badge>
                        )}
                      </div>

                      {/* Messages */}
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.message_role === "user"
                                  ? "bg-primary/10 ml-8"
                                  : "bg-muted mr-8"
                              }`}
                            >
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {msg.message_role === "user" ? "User" : "AI Assistant"}
                              </p>
                              <p className="text-sm">{msg.message_text_original}</p>
                              {msg.message_text_english && msg.message_text_english !== msg.message_text_original && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  English: {msg.message_text_english}
                                </p>
                              )}
                              {msg.extracted_keywords && msg.extracted_keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {msg.extracted_keywords.map((kw, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px]">
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {messages.length === 0 && (
                            <p className="text-sm text-muted-foreground">No messages in this conversation</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Select a conversation from the list to view details.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
