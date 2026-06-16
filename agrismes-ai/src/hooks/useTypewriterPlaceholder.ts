import { useState, useEffect, useRef, useCallback } from "react";

const ROTATING_PROMPTS = [
  "Ask agribusiness-related questions in your preferred language…",
  "What commodity are you sourcing (coffee, cashew, cocoa, etc.)?",
  "What quantity and delivery terms do you need (FOB/CIF)?",
  "What documents or certifications does your market require?",
  "Tell me your target country and timeline.",
];

const TYPING_SPEED = 50; // ms per character (human-like)
const DELETE_SPEED = 30; // ms per character when deleting
const HOLD_DURATION = 2000; // ms to hold full sentence
const IDLE_RESUME_DELAY = 6000; // ms before resuming after idle

interface UseTypewriterPlaceholderOptions {
  isActive: boolean; // Whether the typewriter should run (chat is open, input not focused)
  inputValue: string; // Current input value
  onFocus: () => void; // Callback when input is focused
}

export function useTypewriterPlaceholder({
  isActive,
  inputValue,
  onFocus,
}: UseTypewriterPlaceholderOptions) {
  const [displayText, setDisplayText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "paused">("typing");
  const [charIndex, setCharIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const currentPrompt = ROTATING_PROMPTS[promptIndex];

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Pause animation when user interacts
  const pauseAnimation = useCallback(() => {
    setIsPaused(true);
    setPhase("paused");
    clearTimers();
  }, [clearTimers]);

  // Resume animation after idle delay
  const scheduleResume = useCallback(() => {
    clearTimers();
    idleTimerRef.current = setTimeout(() => {
      if (!inputValue.trim()) {
        setIsPaused(false);
        setPhase("typing");
        setCharIndex(0);
        setDisplayText("");
      }
    }, IDLE_RESUME_DELAY);
  }, [clearTimers, inputValue]);

  // Handle input focus - pause immediately
  const handleInputFocus = useCallback(() => {
    pauseAnimation();
    onFocus();
  }, [pauseAnimation, onFocus]);

  // Handle input blur - schedule resume if empty
  const handleInputBlur = useCallback(() => {
    if (!inputValue.trim()) {
      scheduleResume();
    }
  }, [inputValue, scheduleResume]);

  // Watch for input value changes
  useEffect(() => {
    if (inputValue.trim()) {
      // User is typing - pause animation
      pauseAnimation();
    } else if (isPaused) {
      // Input cleared - schedule resume
      scheduleResume();
    }
  }, [inputValue, isPaused, pauseAnimation, scheduleResume]);

  // Main typewriter animation loop
  useEffect(() => {
    if (!isActive || isPaused || phase === "paused") {
      return;
    }

    if (phase === "typing") {
      if (charIndex < currentPrompt.length) {
        animationRef.current = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, TYPING_SPEED);
      } else {
        // Finished typing - hold
        setPhase("holding");
      }
    } else if (phase === "holding") {
      animationRef.current = setTimeout(() => {
        setPhase("deleting");
      }, HOLD_DURATION);
    } else if (phase === "deleting") {
      if (charIndex > 0) {
        animationRef.current = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, DELETE_SPEED);
      } else {
        // Finished deleting - move to next prompt
        setPromptIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length);
        setPhase("typing");
      }
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isActive, isPaused, phase, charIndex, currentPrompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Reset when becoming active
  useEffect(() => {
    if (isActive && !isPaused && !inputValue.trim()) {
      setPhase("typing");
      setCharIndex(0);
      setDisplayText("");
    }
  }, [isActive, isPaused, inputValue]);

  return {
    placeholder: displayText || "Ask a question...",
    handleInputFocus,
    handleInputBlur,
    isAnimating: isActive && !isPaused && phase !== "paused",
  };
}
