import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Mic, Video, ScreenShare, Volume2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
  onMicClick?: () => void;
  onVideoClick?: () => void;
  onScreenShareClick?: () => void;
  enableVoice?: boolean;
  onVoiceToggle?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isDisabled = false,
  onMicClick,
  onVideoClick,
  onScreenShareClick,
  enableVoice = false,
  onVoiceToggle
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message);
      setMessage("");

      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex space-x-2 mb-2">
        {onMicClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onMicClick}
            className="flex-shrink-0"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}

        {onVideoClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onVideoClick}
            className="flex-shrink-0"
          >
            <Video className="h-4 w-4" />
          </Button>
        )}

        {onScreenShareClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onScreenShareClick}
            className="flex-shrink-0"
          >
            <ScreenShare className="h-4 w-4" />
          </Button>
        )}

        {onVoiceToggle && (
          <Button
            type="button"
            variant={enableVoice ? "default" : "outline"}
            size="icon"
            onClick={onVoiceToggle}
            className={cn(
              "flex-shrink-0",
              enableVoice && "bg-primary text-primary-foreground"
            )}
            title={enableVoice ? "Voice responses enabled" : "Voice responses disabled"}
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex space-x-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[48px] max-h-[200px] resize-none pr-16"
          disabled={isDisabled}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isDisabled}
          className="absolute right-2 bottom-2"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
