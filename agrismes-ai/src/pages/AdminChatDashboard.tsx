import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  Star,
  Globe,
  TrendingUp,
  Clock,
  Users,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

interface ChatSession {
  id: string;
  session_id: string;
  visitor_id: string;
  created_at: string;
  updated_at: string;
  user_language_detected: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone_whatsapp: string | null;
  country: string | null;
  commodity: string | null;
  message_count: number | null;
  submitted_contact_form: boolean | null;
  provided_whatsapp: boolean | null;
  asked_for_price: boolean | null;
  asked_for_documents: boolean | null;
  feedback_rating: string | null;
  feedback_text: string | null;
  quality_tag: string | null;
  session_duration_seconds: number | null;
}

interface LanguageStats {
  language: string;
  count: number;
}

interface TopicStats {
  topic: string;
  count: number;
}

export default function AdminChatDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [highQualitySessions, setHighQualitySessions] = useState<ChatSession[]>([]);
  const [needsImprovementSessions, setNeedsImprovementSessions] = useState<ChatSession[]>([]);
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        navigate("/");
        return;
      }

      setIsAuthenticated(true);
      fetchDashboardData();
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/");
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all sessions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: allSessions, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedSessions = (allSessions || []) as ChatSession[];
      setSessions(typedSessions);
      setTotalSessions(typedSessions.length);

      // Filter high quality sessions (Gold+ or form submitted)
      const highQuality = typedSessions
        .filter(s => s.quality_tag === "high_quality" || s.submitted_contact_form)
        .slice(0, 20);
      setHighQualitySessions(highQuality);

      // Filter needs improvement sessions (negative feedback or short sessions)
      const needsImprovement = typedSessions
        .filter(s => 
          s.quality_tag === "needs_improvement" || 
          s.feedback_rating === "not_helpful" ||
          (s.session_duration_seconds && s.session_duration_seconds < 60 && (s.message_count || 0) > 0)
        )
        .slice(0, 20);
      setNeedsImprovementSessions(needsImprovement);

      // Calculate language stats
      const langCounts: Record<string, number> = {};
      typedSessions.forEach(s => {
        const lang = s.user_language_detected || "unknown";
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      });
      const langStats = Object.entries(langCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setLanguageStats(langStats);

      // Fetch topic stats from messages
      const { data: messages } = await supabase
        .from("chat_messages_log")
        .select("key_topics")
        .gte("created_at", sevenDaysAgo.toISOString());

      const topicCounts: Record<string, number> = {};
      (messages || []).forEach(m => {
        const topics = m.key_topics as string[] | null;
        if (topics) {
          topics.forEach(topic => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          });
        }
      });
      const topStats = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
      setTopicStats(topStats);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageName = (code: string | null) => {
    const names: Record<string, string> = {
      en: "English",
      sw: "Kiswahili",
      fr: "French",
      am: "Amharic",
      ar: "Arabic",
      de: "German",
      es: "Spanish",
      pt: "Portuguese",
      zh: "Chinese",
      unknown: "Unknown",
    };
    return names[code || "unknown"] || code || "Unknown";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Checking authorization...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Chat Intelligence Dashboard</h1>
                <p className="text-sm text-muted-foreground">Weekly review & improvement tracking</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Star className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{highQualitySessions.length}</p>
                  <p className="text-xs text-muted-foreground">High Quality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{needsImprovementSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Needs Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{languageStats.length}</p>
                  <p className="text-xs text-muted-foreground">Languages Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="high-quality">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="high-quality" className="text-xs sm:text-sm">
                  <Star className="w-3 h-3 mr-1" />
                  High Quality
                </TabsTrigger>
                <TabsTrigger value="needs-improvement" className="text-xs sm:text-sm">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs Work
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  <Users className="w-3 h-3 mr-1" />
                  All Recent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="high-quality">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">High Quality Sessions</CardTitle>
                    <CardDescription>
                      Gold-level users or sessions that led to form submissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <SessionList 
                        sessions={highQualitySessions} 
                        onSelect={setSelectedSession}
                        selectedId={selectedSession?.id}
                        getLanguageName={getLanguageName}
                        formatDuration={formatDuration}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="needs-improvement">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Needs Improvement</CardTitle>
                    <CardDescription>
                      Sessions with negative feedback or ended quickly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <SessionList 
                        sessions={needsImprovementSessions} 
                        onSelect={setSelectedSession}
                        selectedId={selectedSession?.id}
                        getLanguageName={getLanguageName}
                        formatDuration={formatDuration}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Recent Sessions</CardTitle>
                    <CardDescription>Last 7 days of chat activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <SessionList 
                        sessions={sessions.slice(0, 50)} 
                        onSelect={setSelectedSession}
                        selectedId={selectedSession?.id}
                        getLanguageName={getLanguageName}
                        formatDuration={formatDuration}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Languages by Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {languageStats.map(({ language, count }) => (
                    <div key={language} className="flex items-center justify-between">
                      <span className="text-sm">{getLanguageName(language)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  {languageStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {topicStats.map(({ topic, count }) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic} ({count})
                    </Badge>
                  ))}
                  {topicStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">No topics extracted yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Detail */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Detail</CardTitle>
                  <CardDescription>
                    {format(new Date(selectedSession.created_at), "PPp")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-muted-foreground text-xs">Language</p>
                      <p>{getLanguageName(selectedSession.user_language_detected)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Messages</p>
                      <p>{selectedSession.message_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Duration</p>
                      <p>{formatDuration(selectedSession.session_duration_seconds)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Commodity</p>
                      <p>{selectedSession.commodity || "-"}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-xs mb-2">Outcome Flags</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={selectedSession.submitted_contact_form ? "default" : "secondary"} className="text-xs">
                        {selectedSession.submitted_contact_form ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Form
                      </Badge>
                      <Badge variant={selectedSession.provided_whatsapp ? "default" : "secondary"} className="text-xs">
                        {selectedSession.provided_whatsapp ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        WhatsApp
                      </Badge>
                      <Badge variant={selectedSession.asked_for_price ? "default" : "secondary"} className="text-xs">
                        {selectedSession.asked_for_price ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Price
                      </Badge>
                    </div>
                  </div>

                  {selectedSession.feedback_rating && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground text-xs mb-1">Feedback</p>
                      <div className="flex items-center gap-2">
                        {selectedSession.feedback_rating === "helpful" ? (
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="capitalize">{selectedSession.feedback_rating.replace("_", " ")}</span>
                      </div>
                      {selectedSession.feedback_text && (
                        <p className="mt-1 text-xs bg-muted p-2 rounded">
                          "{selectedSession.feedback_text}"
                        </p>
                      )}
                    </div>
                  )}

                  {selectedSession.user_name && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground text-xs">Contact Info</p>
                      <p>{selectedSession.user_name}</p>
                      {selectedSession.user_email && (
                        <p className="text-xs text-muted-foreground">{selectedSession.user_email}</p>
                      )}
                      {selectedSession.user_phone_whatsapp && (
                        <p className="text-xs text-muted-foreground">{selectedSession.user_phone_whatsapp}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Session List Component
function SessionList({ 
  sessions, 
  onSelect, 
  selectedId,
  getLanguageName,
  formatDuration
}: { 
  sessions: ChatSession[];
  onSelect: (session: ChatSession) => void;
  selectedId?: string;
  getLanguageName: (code: string | null) => string;
  formatDuration: (seconds: number | null) => string;
}) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No sessions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelect(session)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            selectedId === session.id 
              ? "border-primary bg-primary/5" 
              : "border-border hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {getLanguageName(session.user_language_detected)}
              </Badge>
              {session.feedback_rating === "helpful" && (
                <ThumbsUp className="w-3 h-3 text-green-500" />
              )}
              {session.feedback_rating === "not_helpful" && (
                <ThumbsDown className="w-3 h-3 text-red-500" />
              )}
              {session.submitted_contact_form && (
                <CheckCircle className="w-3 h-3 text-primary" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(session.created_at), "MMM d, HH:mm")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {session.message_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(session.session_duration_seconds)}
            </span>
            {session.commodity && (
              <Badge variant="secondary" className="text-[10px]">
                {session.commodity}
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
