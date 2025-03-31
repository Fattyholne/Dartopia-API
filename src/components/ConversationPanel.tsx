import React, { useEffect } from "react";
import { Conversation, Message, MessageFormatting } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ConversationPanelProps {
  conversation: Conversation;
  isStreaming: boolean;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversation,
  isStreaming,
  messageEndRef
}) => {
  console.log('ConversationPanel render:', {
    conversationId: conversation?.id,
    messageCount: conversation?.messages.length,
    isStreaming
  });

  // Enhanced auto-scrolling: scroll when messages change or streaming status changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    // Scroll immediately
    scrollToBottom();
    
    // Also set a short timeout to ensure scroll happens after any rendering delays
    const scrollTimer = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [conversation?.messages, isStreaming, messageEndRef]);

  if (!conversation) {
    console.log('No conversation provided to ConversationPanel');
    return null;
  }

  return (
    <div className="space-y-6 mb-6">
      {conversation.messages.length === 0 ? (
        <EmptyConversation />
      ) : (
        <div className="flex flex-col gap-6">
          {conversation.messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isLast={index === conversation.messages.length - 1}
            />
          ))}
        </div>
      )}
      <div ref={messageEndRef} className="h-4" />
    </div>
  );
};

const EmptyConversation = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <Bot size={64} className="text-primary mb-6" /> {/* Larger icon */}
    <h2 className="text-3xl font-bold mb-4">Dartopia AI Assistant</h2> {/* Larger heading */}
    <p className="text-lg text-muted-foreground max-w-md leading-relaxed"> {/* Larger text with better line height */}
      Type a message below to start a conversation with your AI assistant.
      Ask coding questions, request explanations, or get help with your project.
    </p>
  </div>
);

const MessageItem: React.FC<{ message: Message; isLast: boolean }> = ({ message, isLast }) => {
  const isUser = message.role === "user";
  
  const formatContent = (content: string) => {
    // Split into paragraphs first
    const paragraphs = content.split('\n');
    
    // Process each paragraph to add line breaks every ~80 characters at word boundaries
    return paragraphs.map(paragraph => {
      const words = paragraph.split(' ');
      const lines = [];
      let currentLine = [];
      let currentLineLength = 0;
      
      for (let word of words) {
        if (currentLineLength + word.length > 80) {
          lines.push(currentLine.join(' '));
          currentLine = [word];
          currentLineLength = word.length;
        } else {
          currentLine.push(word);
          currentLineLength += word.length + 1; // +1 for space
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      return lines.join('\n');
    }).join('\n\n');
  };
  
  return (
    <div className={cn(
      "flex gap-6",
      isUser ? "flex-row" : "flex-row"
    )}>
      <div className={cn(
        "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
        isUser ? "bg-background" : "bg-primary"
      )}>
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5 text-primary-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 max-w-[85%]"> {/* Added min-width and increased max-width */}
        <Card className={cn(
          "p-6 overflow-hidden break-words whitespace-pre-wrap relative", /* Added relative for potential loading indicator */
          message.status === "error" && "border-destructive"
        )}>
          <div className="prose prose-lg dark:prose-invert w-full break-words"
            style={message.formatting ? {
              fontSize: message.formatting.fontSize,
              fontFamily: message.formatting.fontFamily,
              color: message.formatting.color
            } : undefined}
          >
            {message.status === "sending" && isLast ? (
              <>
                <ReactMarkdown>{formatContent(message.content)}</ReactMarkdown>
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <Skeleton className="h-2 w-2 rounded-full animate-pulse bg-muted" />
                  <Skeleton className="h-2 w-2 rounded-full animate-pulse bg-muted animation-delay-200" />
                  <Skeleton className="h-2 w-2 rounded-full animate-pulse bg-muted animation-delay-400" />
                </div>
              </>
            ) : (
              <ReactMarkdown className="break-words">{formatContent(message.content || "No content available")}</ReactMarkdown>
            )}
          </div>
          
          {message.tokenCount && (
            <div className="mt-3 text-sm text-muted-foreground">
              Tokens: {message.tokenCount}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversationPanel;
