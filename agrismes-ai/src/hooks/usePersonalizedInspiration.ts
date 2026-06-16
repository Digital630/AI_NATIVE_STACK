/**
 * Hook to generate personalized inspirational messages based on chat history
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Skill/trait mappings based on key topics and keywords
const SKILL_MAPPINGS: Record<string, { skill: string; messages: string[] }> = {
  // Commodities
  coffee: { 
    skill: "coffee trade expertise",
    messages: [
      "Your coffee trade insights are exceptional!",
      "You've shown great knowledge of the coffee market.",
      "Your understanding of coffee sourcing is impressive!"
    ]
  },
  cashew: {
    skill: "cashew market knowledge",
    messages: [
      "Your cashew industry knowledge stands out!",
      "You have a sharp eye for the cashew market.",
      "Your cashew sourcing expertise is remarkable!"
    ]
  },
  cocoa: {
    skill: "cocoa trade understanding",
    messages: [
      "Your cocoa market insights are valuable!",
      "You've demonstrated strong cocoa expertise.",
      "Your understanding of cocoa trade is impressive!"
    ]
  },
  spices: {
    skill: "spice trade knowledge",
    messages: [
      "Your spice market knowledge is exceptional!",
      "You have great insights into the spice trade.",
      "Your understanding of spice sourcing is admirable!"
    ]
  },
  sesame: {
    skill: "sesame market expertise",
    messages: [
      "Your sesame trade knowledge is impressive!",
      "You've shown great understanding of sesame markets.",
      "Your sesame sourcing insights stand out!"
    ]
  },
  avocado: {
    skill: "avocado export knowledge",
    messages: [
      "Your avocado market insights are valuable!",
      "You have great knowledge of avocado exports.",
      "Your understanding of avocado trade is excellent!"
    ]
  },
  macadamia: {
    skill: "macadamia industry knowledge",
    messages: [
      "Your macadamia market expertise is impressive!",
      "You've shown great macadamia trade understanding.",
      "Your macadamia industry insights stand out!"
    ]
  },
  
  // Business skills based on topics
  "quality/grade": {
    skill: "quality standards expertise",
    messages: [
      "Your attention to quality standards is exceptional!",
      "You have a keen eye for product grades and quality.",
      "Your quality-focused approach sets you apart!"
    ]
  },
  "pricing": {
    skill: "market pricing knowledge",
    messages: [
      "Your market pricing instincts are sharp!",
      "You have great business acumen for pricing.",
      "Your understanding of market dynamics is impressive!"
    ]
  },
  "export": {
    skill: "export process knowledge",
    messages: [
      "Your export process knowledge is valuable!",
      "You have strong export logistics understanding.",
      "Your export readiness approach is excellent!"
    ]
  },
  "import": {
    skill: "import process expertise",
    messages: [
      "Your import process knowledge is impressive!",
      "You have great understanding of import logistics.",
      "Your sourcing strategy is well-informed!"
    ]
  },
  "shipping": {
    skill: "logistics expertise",
    messages: [
      "Your logistics knowledge is exceptional!",
      "You have great shipping and logistics instincts.",
      "Your supply chain understanding is impressive!"
    ]
  },
  "certification": {
    skill: "certification knowledge",
    messages: [
      "Your certification expertise is valuable!",
      "You understand the importance of proper certifications.",
      "Your compliance-focused approach is commendable!"
    ]
  },
  "payment": {
    skill: "trade finance understanding",
    messages: [
      "Your trade finance knowledge is impressive!",
      "You have great payment terms understanding.",
      "Your financial acumen in trade is valuable!"
    ]
  },
  "sourcing": {
    skill: "strategic sourcing skills",
    messages: [
      "Your sourcing strategy is well thought out!",
      "You have excellent supplier relationship instincts.",
      "Your strategic sourcing approach is impressive!"
    ]
  },
  "marketing": {
    skill: "market positioning skills",
    messages: [
      "You have great marketing instincts!",
      "Your market positioning approach is strategic.",
      "Your marketing skills are impressive!"
    ]
  },
  "sustainability": {
    skill: "sustainability focus",
    messages: [
      "Your commitment to sustainability is admirable!",
      "You have a valuable sustainability-first approach.",
      "Your eco-conscious trade perspective stands out!"
    ]
  },
  "organic": {
    skill: "organic trade knowledge",
    messages: [
      "Your organic trade expertise is valuable!",
      "You understand the organic certification landscape well.",
      "Your organic sourcing knowledge is impressive!"
    ]
  },
  "fair trade": {
    skill: "ethical trade commitment",
    messages: [
      "Your commitment to fair trade is commendable!",
      "You have a strong ethical trade perspective.",
      "Your fair trade focus sets you apart!"
    ]
  }
};

// Default inspirational messages when no specific skill is detected
const DEFAULT_MESSAGES = [
  "Your engagement drives growth. Together, we're building bridges in agribusiness trade.",
  "Your curiosity and dedication make you a trade champion!",
  "You're part of a community building the future of African commerce.",
  "Your questions and insights drive meaningful trade connections.",
  "You're helping shape the future of agribusiness in Africa!"
];

interface PersonalizedMessage {
  message: string;
  detectedSkill?: string;
  isLoading: boolean;
}

export function usePersonalizedInspiration(visitorId: string): PersonalizedMessage {
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGES[0]);
  const [detectedSkill, setDetectedSkill] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!visitorId) {
      setIsLoading(false);
      return;
    }

    const fetchChatHistory = async () => {
      try {
        // First get conversation IDs for this visitor
        const { data: conversations, error: convError } = await supabase
          .from("chat_conversations")
          .select("id, commodity")
          .eq("visitor_id", visitorId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (convError) {
          console.debug("[PersonalizedInspiration] Error fetching conversations:", convError);
          setIsLoading(false);
          return;
        }

        if (!conversations || conversations.length === 0) {
          setIsLoading(false);
          return;
        }

        // Get message logs for these conversations
        const conversationIds = conversations.map(c => c.id);
        const { data: messageLogs, error: msgError } = await supabase
          .from("chat_messages_log")
          .select("extracted_keywords, key_topics")
          .in("conversation_id", conversationIds);

        if (msgError) {
          console.debug("[PersonalizedInspiration] Error fetching messages:", msgError);
        }

        // Collect all keywords and topics
        const allKeywords: string[] = [];
        const allTopics: string[] = [];

        // Add commodities from conversations
        conversations.forEach(c => {
          if (c.commodity) {
            allKeywords.push(c.commodity.toLowerCase());
          }
        });

        // Add extracted keywords and topics from messages
        if (messageLogs) {
          messageLogs.forEach(log => {
            if (log.extracted_keywords && Array.isArray(log.extracted_keywords)) {
              allKeywords.push(...log.extracted_keywords.map((k: string) => k.toLowerCase()));
            }
            if (log.key_topics && Array.isArray(log.key_topics)) {
              allTopics.push(...log.key_topics.map((t: string) => t.toLowerCase()));
            }
          });
        }

        // Find matching skills
        const matchedSkills: { skill: string; messages: string[]; count: number }[] = [];

        // Check keywords
        Object.entries(SKILL_MAPPINGS).forEach(([key, value]) => {
          const keyLower = key.toLowerCase();
          const count = allKeywords.filter(k => k.includes(keyLower)).length +
                       allTopics.filter(t => t.includes(keyLower)).length;
          
          if (count > 0) {
            matchedSkills.push({ ...value, count });
          }
        });

        // Sort by frequency and pick the top skill
        matchedSkills.sort((a, b) => b.count - a.count);

        if (matchedSkills.length > 0) {
          const topSkill = matchedSkills[0];
          const randomMessage = topSkill.messages[Math.floor(Math.random() * topSkill.messages.length)];
          setMessage(randomMessage);
          setDetectedSkill(topSkill.skill);
        } else {
          // Use a random default message
          setMessage(DEFAULT_MESSAGES[Math.floor(Math.random() * DEFAULT_MESSAGES.length)]);
        }

        setIsLoading(false);
      } catch (error) {
        console.debug("[PersonalizedInspiration] Error:", error);
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [visitorId]);

  return { message, detectedSkill, isLoading };
}
