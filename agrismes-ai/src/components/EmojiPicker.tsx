import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Limited positive emojis for friendly chat interactions
const POSITIVE_EMOJIS = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "😊", label: "Happy" },
  { emoji: "🙏", label: "Thank you" },
  { emoji: "✅", label: "OK/Check" },
  { emoji: "👌", label: "Perfect" },
  { emoji: "🎉", label: "Celebration" },
  { emoji: "💪", label: "Strong" },
  { emoji: "🤝", label: "Handshake" },
  { emoji: "⭐", label: "Star" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🌟", label: "Sparkle" },
  { emoji: "👏", label: "Clap" },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Add emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2 z-[10001]" 
        align="start"
        side="top"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-6 gap-1">
          {POSITIVE_EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEmojiClick(emoji);
              }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors cursor-pointer"
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 border-t pt-2">
          Positive vibes only 😊
        </p>
      </PopoverContent>
    </Popover>
  );
}
