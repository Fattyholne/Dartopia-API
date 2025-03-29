import React, { useEffect } from "react";
import { Conversation, Message } from "@/pages/Index";
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
    <div className="space-y-6 mb-6"> {/* Increased spacing between messages */}
      {conversation.messages.length === 0 ? (
        <EmptyConversation />
      ) : (
        conversation.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === conversation.messages.length - 1}
          />
        ))
      )}
      <div ref={messageEndRef} className="h-4" /> {/* Added height to ensure proper scrolling */}
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
  
  return (
    <div className={cn(
      "flex gap-6", /* Increased gap */
      isUser ? "flex-row" : "flex-row"
    )}>
      <div className={cn(
        "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-md border shadow-sm", /* Larger avatar */
        isUser ? "bg-background" : "bg-primary"
      )}>
        {isUser ? (
          <User className="h-5 w-5" /> /* Larger icon */
        ) : (
          <Bot className="h-5 w-5 text-primary-foreground" /> /* Larger icon */
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <Card className={cn(
          "p-6 overflow-hidden", /* More padding */
          message.status === "error" && "border-destructive"
        )}>
          <div className="prose prose-lg dark:prose-invert max-w-none w-full break-words"> {/* Larger text via prose-lg */}
            {message.status === "sending" && isLast ? (
              <>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                <div className="mt-2 flex items-center">
                  <Skeleton className="h-5 w-5 rounded-full animate-pulse bg-muted" /> {/* Larger dots */}
                  <Skeleton className="h-5 w-5 rounded-full animate-pulse bg-muted ml-1" />
                  <Skeleton className="h-5 w-5 rounded-full animate-pulse bg-muted ml-1" />
                </div>
              </>
            ) : (
              <ReactMarkdown>{message.content || "No content available"}</ReactMarkdown>
            )}
          </div>
          
          {message.tokenCount && (
            <div className="mt-3 text-sm text-muted-foreground"> {/* Larger and more spaced */}
              Tokens: {message.tokenCount}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversationPanel;
