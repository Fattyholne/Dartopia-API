import React, { useState, useEffect, useRef, useCallback } from "react";
import ConversationPanel from "@/components/ConversationPanel";
import MessageInput from "@/components/MessageInput";
import Sidebar from "@/components/Sidebar";
import TokenUsage from "@/components/TokenUsage";
import SystemInstructions from "@/components/SystemInstructions";
import ModelSelector from "@/components/ModelSelector";
import ToolsPanel from "@/components/ToolsPanel";
import GoogleAIPanel from "@/components/GoogleAIPanel";
import ScreenSharePanel from "@/components/ScreenSharePanel";
import InteractionCards from "@/components/InteractionCards";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSocket } from "@/lib/socketClient";

export interface MessageFormatting {
  fontSize?: string;
  fontFamily?: string;
  color?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  systemInstructions?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  status: "sending" | "complete" | "error";
  tokenCount?: number;
  formatting?: MessageFormatting;
}

const defaultConversation: Conversation = {
  id: "default",
  title: "New Conversation",
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tokenUsage: {
    input: 0,
    output: 0,
    total: 0
  },
  systemInstructions: "You are Dartopia, an AI assistant specialized in dart scoring and analysis."
};

const Index = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>("conversations", []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage<string>("activeConversationId", "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const [isShowingInteractionCards, setIsShowingInteractionCards] = useState(true);
  const [activeTab, setActiveTab] = useState("settings");
  const [useContextChunking, setUseContextChunking] = useLocalStorage<boolean>("use_context_chunking", true);
  const [isConnected, setIsConnected] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const pendingMessageIdRef = useRef<string | null>(null);

  // Define helper functions first
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const createNewConversation = useCallback((): Conversation => {
    return {
      id: generateId(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      },
      systemInstructions: defaultConversation.systemInstructions
    };
  }, []);

  const generateTitleFromMessage = (message: string): string => {
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (words.length < message.split(' ').length ? '...' : '');
  };

  const estimateTokenCount = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Successfully connected to Dartopia backend"
      });
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.disconnected);
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Lost connection to Dartopia backend",
        variant: "destructive"
      });
    });

    socket.on('receive_message', (data) => {
      console.log('Socket receive_message event:', data);
      
      // Get the active conversation
      const activeConversation = conversations.find(c => c.id === activeConversationId);
      if (!activeConversation) {
        console.error('Active conversation not found');
        return;
      }
      
      if (pendingMessageIdRef.current) {
        const messageId = pendingMessageIdRef.current;
        
        // Find the message that was pending a response
        const messageToUpdate = activeConversation.messages.find(m => m.id === messageId);
        if (!messageToUpdate) {
          console.error('Pending message not found');
          return;
        }
        
        // Calculate token count
        const tokenCount = estimateTokenCount(data.response);
        
        // Update the message with the response
        const updatedMessage: Message = {
          ...messageToUpdate,
          content: data.response,
          status: "complete",
          tokenCount
        };
        
        const updatedConversation = {
          ...activeConversation,
          messages: activeConversation.messages.map(m => 
            m.id === messageId ? updatedMessage : m
          ),
          tokenUsage: {
            ...activeConversation.tokenUsage,
            output: activeConversation.tokenUsage.output + tokenCount,
            total: activeConversation.tokenUsage.total + tokenCount
          }
        };
        
        // Update the conversation in state
        setConversations(prevConversations => 
          prevConversations.map(c => c.id === activeConversationId ? updatedConversation : c)
        );
        
        // Clear the pending message ID
        pendingMessageIdRef.current = null;
        
        // Stop streaming indicator
        setIsStreaming(false);
        
        // Scroll to bottom
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    socket.on('error', (data) => {
      console.error('Error from server:', data);
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive"
      });
      
      if (pendingMessageIdRef.current) {
        handleErrorResponse();
      }
    });
    
    // Clean up event listeners when component unmounts
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('receive_message');
        socket.off('error');
      }
    };
  }, [activeConversationId, conversations, toast]);

  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = createNewConversation();
      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    } else if (!activeConversationId || !conversations.find(c => c.id === activeConversationId)) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, createNewConversation, setConversations, setActiveConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || 
    (conversations.length > 0 ? conversations[0] : defaultConversation);

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    setConversations([...conversations, newConversation]);
    setActiveConversationId(newConversation.id);
    setIsShowingInteractionCards(true);
    toast({
      title: "New conversation created",
      description: "Start a fresh conversation with the AI assistant."
    });
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    
    if (id === activeConversationId && updatedConversations.length > 0) {
      setActiveConversationId(updatedConversations[0].id);
    }
    
    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed."
    });
  };

  const updateConversation = useCallback((updatedConversation: Conversation) => {
    setConversations(prevConversations => {
      return prevConversations.map(c => 
        c.id === updatedConversation.id ? updatedConversation : c
      );
    });
  }, [setConversations]);

  const handleErrorResponse = () => {
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    if (!activeConversation) return;
    
    const messageId = pendingMessageIdRef.current;
    if (!messageId) return;
    
    // Update the message with error status
    const updatedMessage: Message = {
      ...activeConversation.messages.find(m => m.id === messageId)!,
      content: "Sorry, there was an error processing your request. Please try again.",
      status: "error"
    };
    
    const updatedConversation = {
      ...activeConversation,
      messages: activeConversation.messages.map(m => 
        m.id === messageId ? updatedMessage : m
      )
    };
    
    // Update the conversation in state
    setConversations(prevConversations => 
      prevConversations.map(c => c.id === activeConversationId ? updatedConversation : c)
    );
    
    // Clear the pending message ID
    pendingMessageIdRef.current = null;
    
    // Stop streaming indicator
    setIsStreaming(false);
  };

  const handleSendMessage = async (message: string, formatting?: MessageFormatting) => {
    setIsShowingInteractionCards(false);
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      status: "complete",
      tokenCount: estimateTokenCount(message),
      formatting
    };
    
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
      tokenUsage: {
        ...activeConversation.tokenUsage,
        input: activeConversation.tokenUsage.input + (userMessage.tokenCount || 0),
        total: activeConversation.tokenUsage.total + (userMessage.tokenCount || 0)
      }
    };
    
    if (updatedConversation.messages.length === 1) {
      updatedConversation.title = generateTitleFromMessage(message);
    }
    
    updateConversation(updatedConversation);
    
    const aiMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      status: "sending"
    };
    
    // Store the new message ID for the response handler
    pendingMessageIdRef.current = aiMessage.id;
    
    const conversationWithAiResponse = {
      ...updatedConversation,
      messages: [...updatedConversation.messages, aiMessage]
    };
    
    updateConversation(conversationWithAiResponse);
    
    try {
      setIsStreaming(true);
      const relevantHistory = getRelevantHistory(activeConversation.messages, useContextChunking);
      
      // Format conversation history for the backend
      const formattedHistory = relevantHistory.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Send message to backend via socket
      socketRef.current.emit('send_message', {
        message: message,
        model: selectedModel,
        history: formattedHistory,
        systemInstructions: activeConversation.systemInstructions,
        temperature: temperature
      });
      
      console.log('Message sent to server, waiting for response...');
      
    } catch (error) {
      console.error("Error sending message:", error);
      handleErrorResponse();
      
      toast({
        title: "Error",
        description: "Failed to send message to the AI service.",
        variant: "destructive"
      });
    }
  };

  const getRelevantHistory = (messages: Message[], useChunking: boolean): Message[] => {
    if (!useChunking) {
      return messages;
    }

    const MAX_MESSAGES = 10;
    if (messages.length <= MAX_MESSAGES) {
      return messages;
    }

    const systemMessages = messages.filter(m => m.role === "system");
    
    const recentMessages = messages
      .filter(m => m.role !== "system")
      .slice(-MAX_MESSAGES);
    
    return [...systemMessages, ...recentMessages];
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    const selectedConversation = conversations.find(c => c.id === id);
    setIsShowingInteractionCards(selectedConversation && selectedConversation.messages.length === 0);
  };

  const updateSystemInstructions = (instructions: string) => {
    const updatedConversation = {
      ...activeConversation,
      systemInstructions: instructions
    };
    updateConversation(updatedConversation);
  };

  // Placeholder handlers for interaction cards
  const handleMicClick = () => {
    toast({
      title: "Voice Interaction",
      description: "Microphone access is needed for voice features."
    });
    setIsShowingInteractionCards(false);
  };

  const handleVideoClick = () => {
    toast({
      title: "Video Interaction",
      description: "Camera access is needed for visual analysis."
    });
    setIsShowingInteractionCards(false);
  };

  const handleScreenShareClick = () => {
    toast({
      title: "Screen Sharing",
      description: "Screen sharing permissions needed."
    });
    setIsShowingInteractionCards(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "border-r transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        <Sidebar 
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {!isConnected && (
          <div className="bg-yellow-100 text-yellow-800 px-6 py-3 text-base font-medium">
            Not connected to backend server. Attempting to reconnect...
          </div>
        )}
        
        {/* Header */}
        <div className="border-b px-8 py-4">
          <h1 className="text-2xl font-bold">Dartopia AI Assistant</h1>
        </div>
        
        {/* Main conversation area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* System instructions */}
            <div className="mb-8">
              <SystemInstructions 
                instructions={activeConversation.systemInstructions || ""}
                onUpdate={updateSystemInstructions}
              />
            </div>
            
            {isShowingInteractionCards && activeConversation.messages.length === 0 ? (
              <>
                {/* Welcome screen */}
                <div className="text-center my-12">
                  <h2 className="text-4xl font-bold mb-4">Talk with Gemini live</h2>
                  <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                    Interact with Gemini using text, voice, video, or screen sharing.
                  </p>
                </div>
                <div className="max-w-4xl mx-auto">
                  <InteractionCards 
                    onMicClick={handleMicClick}
                    onVideoClick={handleVideoClick}
                    onScreenShareClick={handleScreenShareClick}
                  />
                </div>
              </>
            ) : (
              <div className="min-h-[20vh]">
                <ConversationPanel 
                  conversation={activeConversation}
                  isStreaming={isStreaming}
                  messageEndRef={messageEndRef}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom input area */}
        <div className="p-6 bg-card">
          <div className="max-w-5xl mx-auto flex flex-col space-y-4">
            <TokenUsage tokenUsage={activeConversation.tokenUsage} />
            <MessageInput 
              onSendMessage={handleSendMessage}
              isDisabled={isStreaming || !isConnected}
              onMicClick={handleMicClick}
              onVideoClick={handleVideoClick}
              onScreenShareClick={handleScreenShareClick}
            />
          </div>
        </div>
      </div>
      
      {/* Right sidebar with settings */}
      <div className="w-72 border-l">
        <div className="h-full flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-medium">Settings</h3>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="google">Google AI</TabsTrigger>
                <TabsTrigger value="screen">Screen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-6">
                <ModelSelector 
                  selectedModel={selectedModel}
                  onChange={(model) => setSelectedModel(model)}
                  useContextChunking={useContextChunking}
                  onToggleContextChunking={setUseContextChunking}
                />
                
                <div className="space-y-3">
                  <h3 className="text-base font-medium">Temperature</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm w-6 text-center">{temperature}</span>
                  </div>
                </div>
                
                <ToolsPanel />
              </TabsContent>
              
              <TabsContent value="google">
                <GoogleAIPanel isVisible={activeTab === "google"} />
              </TabsContent>
              
              <TabsContent value="screen">
                <ScreenSharePanel 
                  isVisible={activeTab === "screen"} 
                  onScreenShare={handleScreenShareClick}
                  isConnected={isConnected}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;