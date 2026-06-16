import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gift,
  MessageSquare,
  Image,
  FileText,
  Shield,
  TrendingUp,
  Lock,
  Unlock,
  ArrowRight,
  Users,
  Star,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchorGroup, GovernanceFramework } from "@/components/TrustAnchor";
import { ChatCTABlock } from "@/components/LiveChatCTA";
import rewardflowIcon from "@/assets/rewardflow-icon.png";

const POINT_ACTIONS = [
  { action: "Ask meaningful trade questions", points: "+15", icon: MessageSquare },
  { action: "Upload product images for analysis", points: "+25", icon: Image },
  { action: "Submit contact/inquiry forms", points: "+50", icon: FileText },
  { action: "Provide detailed commodity context", points: "+30", icon: TrendingUp },
];

const LEVELS = [
  { name: "Basic", points: "20+", color: "bg-muted" },
  { name: "Silver", points: "50+", color: "bg-gray-300" },
  { name: "Gold", points: "100+", color: "bg-yellow-400" },
  { name: "Premium", points: "200+", color: "bg-primary" },
  { name: "Platinum", points: "5000+", color: "bg-gradient-to-r from-primary to-accent" },
];

export default function RewardFlowInfo() {
  const navigate = useNavigate();

  const openChat = () => {
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openChatWidget'));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-institutional py-12 px-4 sm:px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <img
                src={rewardflowIcon}
                alt="RewardFlow"
                className="h-16 w-16"
                style={{ filter: "sepia(1) saturate(5) hue-rotate(90deg) brightness(0.9)" }}
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            RewardFlow: Access Through Engagement
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AgriSMES uses RewardFlow as its access governance system.
            Points govern visibility, priority, and service access — not entertainment.
          </p>
        </motion.div>

        {/* What is RewardFlow */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              What is RewardFlow?
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                RewardFlow is AgriSMES's status-based engagement system. Unlike typical gamification,
                RewardFlow is designed for <strong className="text-foreground">access governance</strong>:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span>Points determine access to exclusive services and listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span>Higher engagement signals higher trust and priority</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span>Filters out low-quality inquiries and spam</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span>Rewards meaningful participation in the trade ecosystem</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* How Points are Earned */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            How Points Are Earned
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {POINT_ACTIONS.map((item, idx) => (
              <motion.div
                key={item.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.action}</p>
                </div>
                <span className="text-primary font-bold">{item.points}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Levels */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Engagement Levels
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {LEVELS.map((level) => (
              <div
                key={level.name}
                className="px-4 py-2 rounded-full border border-border bg-card flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${level.color}`} />
                <span className="text-sm font-medium text-foreground">{level.name}</span>
                <span className="text-xs text-muted-foreground">({level.points} pts)</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Why RewardFlow Matters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Why RewardFlow Improves Trade Quality
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Trust Signal</h3>
                <p className="text-xs text-muted-foreground">
                  Higher points indicate genuine trade interest
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Quality Filter</h3>
                <p className="text-xs text-muted-foreground">
                  Reduces spam and low-effort inquiries
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Safety Layer</h3>
                <p className="text-xs text-muted-foreground">
                  Protects contact details and listings
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Trust Anchors */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <TrustAnchorGroup variants={["review", "privacy", "integrity"]} />
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <ChatCTABlock 
            title="Ready to Start Earning?"
            description="Open the AI Live Chat to begin your trade journey and earn RewardFlow points through meaningful engagement."
          />
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
