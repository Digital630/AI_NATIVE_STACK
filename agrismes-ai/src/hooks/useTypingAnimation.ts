import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypingAnimationOptions {
  /** Characters per millisecond for typing speed */
  typingSpeed?: number;
  /** Minimum delay between chunks (ms) */
  minChunkDelay?: number;
  /** Maximum delay between chunks (ms) */
  maxChunkDelay?: number;
  /** Whether to add natural pauses at punctuation */
  naturalPauses?: boolean;
  /** Callback when typing is complete */
  onComplete?: () => void;
}

interface UseTypingAnimationReturn {
  /** The currently displayed text (animated) */
  displayedText: string;
  /** Whether the animation is still running */
  isTyping: boolean;
  /** Start typing a new message */
  startTyping: (fullText: string) => void;
  /** Skip to the end immediately */
  skipToEnd: () => void;
  /** Reset the animation */
  reset: () => void;
}

/**
 * Hook to simulate natural typing animation for long responses.
 * Breaks text into segments and reveals them with realistic delays.
 */
export function useTypingAnimation(
  options: UseTypingAnimationOptions = {}
): UseTypingAnimationReturn {
  const {
    typingSpeed = 0.05, // chars per ms (~50 chars per second)
    minChunkDelay = 20,
    maxChunkDelay = 80,
    naturalPauses = true,
    onComplete,
  } = options;

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getNextChunkSize = useCallback((text: string, currentIndex: number): number => {
    // Determine chunk size based on content
    const remaining = text.length - currentIndex;
    if (remaining <= 0) return 0;

    // Base chunk size: 1-5 characters
    let chunkSize = Math.min(remaining, Math.floor(Math.random() * 4) + 1);

    // If we're at a word boundary, complete the word
    const nextSpace = text.indexOf(" ", currentIndex);
    if (nextSpace !== -1 && nextSpace - currentIndex < 10) {
      chunkSize = Math.min(remaining, nextSpace - currentIndex + 1);
    }

    return chunkSize;
  }, []);

  const getDelayAfterChunk = useCallback((chunk: string): number => {
    let delay = minChunkDelay + Math.random() * (maxChunkDelay - minChunkDelay);

    if (naturalPauses) {
      // Add longer pauses at punctuation
      const lastChar = chunk.trim().slice(-1);
      if (lastChar === "." || lastChar === "!" || lastChar === "?") {
        delay += 150 + Math.random() * 100; // Sentence pause
      } else if (lastChar === ",") {
        delay += 50 + Math.random() * 50; // Comma pause
      } else if (lastChar === ":") {
        delay += 80 + Math.random() * 50; // Colon pause
      } else if (lastChar === "\n") {
        delay += 100 + Math.random() * 100; // Line break pause
      }
    }

    return delay;
  }, [minChunkDelay, maxChunkDelay, naturalPauses]);

  const typeNextChunk = useCallback(() => {
    const fullText = fullTextRef.current;
    const currentIndex = currentIndexRef.current;

    if (currentIndex >= fullText.length) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    const chunkSize = getNextChunkSize(fullText, currentIndex);
    const newIndex = currentIndex + chunkSize;
    currentIndexRef.current = newIndex;

    setDisplayedText(fullText.slice(0, newIndex));

    const chunk = fullText.slice(currentIndex, newIndex);
    const delay = getDelayAfterChunk(chunk);

    timeoutRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(typeNextChunk);
    }, delay);
  }, [getNextChunkSize, getDelayAfterChunk, onComplete]);

  const startTyping = useCallback((fullText: string) => {
    cleanup();
    fullTextRef.current = fullText;
    currentIndexRef.current = 0;
    setDisplayedText("");
    setIsTyping(true);

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(typeNextChunk);
  }, [cleanup, typeNextChunk]);

  const skipToEnd = useCallback(() => {
    cleanup();
    setDisplayedText(fullTextRef.current);
    setIsTyping(false);
    onComplete?.();
  }, [cleanup, onComplete]);

  const reset = useCallback(() => {
    cleanup();
    fullTextRef.current = "";
    currentIndexRef.current = 0;
    setDisplayedText("");
    setIsTyping(false);
  }, [cleanup]);

  return {
    displayedText,
    isTyping,
    startTyping,
    skipToEnd,
    reset,
  };
}

/**
 * Utility to break long text into natural segments for display.
 * Used for showing long responses in digestible chunks.
 */
export function segmentLongText(text: string, maxSegmentLength = 200): string[] {
  if (!text || text.length <= maxSegmentLength) {
    return [text];
  }

  const segments: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSegmentLength) {
      segments.push(remaining);
      break;
    }

    // Find a good break point (sentence end, then comma, then space)
    let breakPoint = -1;
    const searchRange = remaining.slice(0, maxSegmentLength);

    // Prefer sentence endings
    const sentenceEnd = Math.max(
      searchRange.lastIndexOf(". "),
      searchRange.lastIndexOf("! "),
      searchRange.lastIndexOf("? ")
    );
    if (sentenceEnd > maxSegmentLength * 0.5) {
      breakPoint = sentenceEnd + 2;
    } else {
      // Try comma
      const commaBreak = searchRange.lastIndexOf(", ");
      if (commaBreak > maxSegmentLength * 0.5) {
        breakPoint = commaBreak + 2;
      } else {
        // Fall back to space
        const spaceBreak = searchRange.lastIndexOf(" ");
        breakPoint = spaceBreak > 0 ? spaceBreak + 1 : maxSegmentLength;
      }
    }

    segments.push(remaining.slice(0, breakPoint).trim());
    remaining = remaining.slice(breakPoint).trim();
  }

  return segments.filter(s => s.length > 0);
}
