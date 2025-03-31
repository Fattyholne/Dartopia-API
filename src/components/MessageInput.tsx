import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Mic, Video, ScreenShare, Volume2, Smile, Image, Type, Palette } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

// Initialize Giphy client (you'll need to replace this with your API key)
const gf = new GiphyFetch('your-giphy-api-key');

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'system-ui'
];

interface MessageInputProps {
  onSendMessage: (message: string, formatting?: MessageFormatting) => void;
  isDisabled?: boolean;
  onMicClick?: () => void;
  onVideoClick?: () => void;
  onScreenShareClick?: () => void;
  enableVoice?: boolean;
  onVoiceToggle?: () => void;
}

interface MessageFormatting {
  fontSize: string;
  fontFamily: string;
  color: string;
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
  const [showEmojis, setShowEmojis] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [formatting, setFormatting] = useState<MessageFormatting>({
    fontSize: '16px',
    fontFamily: 'system-ui',
    color: '#000000'
  });

  // Function to handle emoji selection
  const onEmojiSelect = (emoji: any) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const newMessage = 
      message.slice(0, cursorPosition) + 
      emoji.native + 
      message.slice(cursorPosition);
    setMessage(newMessage);
    setShowEmojis(false);
  };

  // Function to handle GIF selection
  const onGifSelect = (gif: any) => {
    const gifUrl = gif.images.original.url;
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const newMessage = 
      message.slice(0, cursorPosition) + 
      `[GIF:${gifUrl}]` + 
      message.slice(cursorPosition);
    setMessage(newMessage);
    setShowGifs(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message, formatting);
      setMessage("");

      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "120px"; // Changed from 48px to 120px for initial height
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "120px"; // Changed from 48px to 120px for initial height
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

        <div className="flex items-center space-x-2 ml-2">
          <Select
            value={formatting.fontSize}
            onValueChange={(value) => setFormatting(prev => ({ ...prev, fontSize: value }))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map(size => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={formatting.fontFamily}
            onValueChange={(value) => setFormatting(prev => ({ ...prev, fontFamily: value }))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                style={{ 
                  backgroundColor: formatting.color,
                  color: formatting.color === '#ffffff' ? '#000000' : '#ffffff'
                }}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <HexColorPicker
                color={formatting.color}
                onChange={(color) => setFormatting(prev => ({ ...prev, color }))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Popover open={showEmojis} onOpenChange={setShowEmojis}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Picker 
              data={data} 
              onEmojiSelect={onEmojiSelect}
              theme="light"
              previewPosition="none"
            />
          </PopoverContent>
        </Popover>

        <Popover open={showGifs} onOpenChange={setShowGifs}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              title="Add GIF"
            >
              <Image className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] h-[400px] overflow-y-auto p-0" align="start">
            <Grid
              width={320}
              columns={2}
              fetchGifs={(offset: number) => gf.trending({ offset, limit: 10 })}
              onGifClick={onGifSelect}
              noLink={true}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex space-x-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] max-h-[200px] resize-none pr-16"
          style={{
            fontSize: formatting.fontSize,
            fontFamily: formatting.fontFamily,
            color: formatting.color
          }}
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
