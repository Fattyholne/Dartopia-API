import React, { useState, useEffect, useRef } from "react";
import ConversationPanel from "@/components/ConversationPanel";
import MessageInput from "@/components/MessageInput";
import Sidebar from "@/components/Sidebar";
import TokenUsage from "@/components/TokenUsage";
import Settings from "@/components/Settings";
import SystemInstructions from "@/components/SystemInstructions";
import ModelSelector from "@/components/ModelSelector";
import ToolsPanel from "@/components/ToolsPanel";
import GoogleAIPanel from "@/components/GoogleAIPanel";
import ScreenSharePanel from "@/components/ScreenSharePanel";
import InteractionCards from "@/components/InteractionCards";
import AudioPlayer from "@/components/AudioPlayer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socketClient";

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
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const pendingMessageIdRef = useRef<string | null>(null);
  const [enableVoice, setEnableVoice] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = createNewConversation();
      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    } else if (!activeConversationId || !conversations.find(c => c.id === activeConversationId)) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const createNewConversation = (): Conversation => {
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
  };

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

  const handleSendMessage = async (message: string) => {
    setIsShowingInteractionCards(false);
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      status: "complete",
      tokenCount: estimateTokenCount(message)
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
      
      // Include enable_voice flag in the socket emit
      socketRef.current.emit('send_message', {
        message: message,
        model: selectedModel,
        history: formattedHistory,
        systemInstructions: activeConversation.systemInstructions,
        temperature: temperature,
        enable_voice: enableVoice // Pass the voice flag to the backend
      });
      
      console.log('Message sent to server, waiting for response...');
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        ...aiMessage,
        content: "Sorry, there was an error sending your request. Please try again.",
        status: "error"
      };
      
      const conversationWithError = {
        ...conversationWithAiResponse,
        messages: conversationWithAiResponse.messages.map(m => 
          m.id === aiMessage.id ? errorMessage : m
        )
      };
      
      updateConversation(conversationWithError);
      pendingMessageIdRef.current = null;
      setIsStreaming(false);
      
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

  const processStreamingResponse = async (fullResponse: string, messageId: string) => {
    console.log('Processing response: ', fullResponse);
    
    if (!fullResponse || typeof fullResponse !== 'string') {
      console.error('Invalid response received:', fullResponse);
      throw new Error('Invalid response from server');
    }

    // Find the current conversation and message
    const currentConversation = conversations.find(c => c.id === activeConversationId);
    if (!currentConversation) {
      console.error('Active conversation not found');
      return;
    }

    const messageToUpdate = currentConversation.messages.find(m => m.id === messageId);
    if (!messageToUpdate) {
      console.error('Message to update not found:', messageId);
      return;
    }

    const tokenCount = estimateTokenCount(fullResponse);
    
    // Immediately update with the full response for a better user experience
    const updatedMessage: Message = {
      ...messageToUpdate,
      content: fullResponse,
      status: "complete",
      tokenCount: tokenCount
    };
    
    const updatedConversation = {
      ...currentConversation,
      messages: currentConversation.messages.map(m => 
        m.id === messageId ? updatedMessage : m
      ),
      tokenUsage: {
        ...currentConversation.tokenUsage,
        output: currentConversation.tokenUsage.output + tokenCount,
        total: currentConversation.tokenUsage.total + tokenCount
      }
    };
    
    // Update the conversation with the full response
    updateConversation(updatedConversation);
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // If you still want the typing effect, you can uncomment and use this code:
    /*
    // Split by words and do the typing effect
    const words = fullResponse.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      const updatedMessageWithTyping: Message = {
        ...messageToUpdate,
        content: currentContent,
        status: i === words.length - 1 ? "complete" : "sending",
        tokenCount: i === words.length - 1 ? tokenCount : undefined
      };
      
      const updatedConversationWithTyping = {
        ...currentConversation,
        messages: currentConversation.messages.map(m => 
          m.id === messageId ? updatedMessageWithTyping : m
        ),
        tokenUsage: i === words.length - 1 ? {
          ...currentConversation.tokenUsage,
          output: currentConversation.tokenUsage.output + tokenCount,
          total: currentConversation.tokenUsage.total + tokenCount
        } : currentConversation.tokenUsage
      };
      
      updateConversation(updatedConversationWithTyping);
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    */
  };

  const updateConversation = (updatedConversation: Conversation) => {
    console.log('About to update conversation with ID:', updatedConversation.id);
    
    setConversations(prevConversations => {
      // Find the conversation to update
      const existingConversationIndex = prevConversations.findIndex(
        c => c.id === updatedConversation.id
      );
      
      if (existingConversationIndex === -1) {
        console.warn('Conversation not found in state, adding it:', updatedConversation.id);
        return [...prevConversations, updatedConversation];
      }
      
      // Create a new array with the updated conversation
      const updatedConversations = [...prevConversations];
      updatedConversations[existingConversationIndex] = updatedConversation;
      
      console.log('Successfully updated conversation in state');
      return updatedConversations;
    });
    
    // Force a re-render by updating a timestamp
    if (updatedConversation.id === activeConversationId) {
      console.log('Forcing re-render for active conversation');
      updatedConversation.updatedAt = new Date().toISOString();
    }
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

  const handleMicClick = () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        }).then(stream => {
          // Successfully got microphone access
          toast({
            title: "Microphone Access Granted",
            description: "You can now speak to Gemini. Recording started."
          });
          
          // Create an audio element to play the mic input
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          
          // Create audio meter to visualize audio levels
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          
          // Create user message about voice interaction
          const userMessage: Message = {
            id: generateId(),
            role: "user",
            content: "[Voice interaction started - recording in progress...]",
            timestamp: new Date().toISOString(),
            status: "complete"
          };
          
          const updatedConversation = {
            ...activeConversation,
            messages: [...activeConversation.messages, userMessage],
            updatedAt: new Date().toISOString()
          };
          
          updateConversation(updatedConversation);
          
          // Create audio visualization feedback element
          const visualElement = document.createElement('div');
          visualElement.id = 'audio-visualizer';
          visualElement.style.position = 'fixed';
          visualElement.style.bottom = '80px';
          visualElement.style.left = '50%';
          visualElement.style.transform = 'translateX(-50%)';
          visualElement.style.padding = '10px';
          visualElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
          visualElement.style.color = 'white';
          visualElement.style.borderRadius = '4px';
          visualElement.style.zIndex = '1000';
          visualElement.innerHTML = '🎤 Recording... Click to stop';
          document.body.appendChild(visualElement);
          
          // Setup audio processing interval
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let recording = true;
          
          // Function to update the visualizer
          const updateVisualizer = () => {
            if (!recording) return;
            
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            
            // Update visualizer based on audio level
            const intensity = Math.min(average / 50, 1);
            visualElement.style.boxShadow = `0 0 ${10 + intensity * 20}px ${intensity * 10}px rgba(255, 0, 0, ${intensity})`;
            
            requestAnimationFrame(updateVisualizer);
          };
          
          updateVisualizer();
          
          // Click the visualizer to stop recording
          visualElement.onclick = () => {
            recording = false;
            
            // Stop all audio tracks
            stream.getAudioTracks().forEach(track => track.stop());
            
            // Clean up
            document.body.removeChild(visualElement);
            source.disconnect();
            
            // Add AI response for voice interaction
            const aiMessage: Message = {
              id: generateId(),
              role: "assistant",
              content: "I've received your audio input. In a production version, this would be transcribed and processed. For now, this is a simulated response to your voice input.",
              timestamp: new Date().toISOString(),
              status: "complete"
            };
            
            const conversationWithResponse = {
              ...updatedConversation,
              messages: [...updatedConversation.messages, aiMessage]
            };
            
            updateConversation(conversationWithResponse);
            
            toast({
              title: "Recording Stopped",
              description: "Voice recording has been stopped."
            });
          };
          
          // Set automatic timeout for the recording (30 seconds)
          setTimeout(() => {
            if (recording) {
              recording = false;
              stream.getAudioTracks().forEach(track => track.stop());
              if (document.body.contains(visualElement)) {
                document.body.removeChild(visualElement);
              }
              source.disconnect();
              
              toast({
                title: "Recording Stopped",
                description: "Voice recording automatically stopped after 30 seconds."
              });
            }
          }, 30000);
          
        }).catch(err => {
          console.error("Error accessing microphone:", err);
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use this feature.",
            variant: "destructive"
          });
        });
      } else {
        toast({
          title: "Not Supported",
          description: "Voice interaction is not supported in your browser",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in voice interaction:", error);
      toast({
        title: "Error",
        description: "An error occurred during voice interaction",
        variant: "destructive"
      });
    }
    
    setIsShowingInteractionCards(false);
  };

  const handleVideoClick = () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true
        }).then(stream => {
          // Successfully got camera access
          toast({
            title: "Camera Access Granted",
            description: "Camera is now active. You can show items to Gemini."
          });
          
          // Create a video element to show the camera feed
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.style.position = 'fixed';
          video.style.bottom = '80px';
          video.style.right = '20px';
          video.style.width = '320px';
          video.style.height = '240px';
          video.style.borderRadius = '8px';
          video.style.border = '2px solid #333';
          video.style.zIndex = '1000';
          video.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          document.body.appendChild(video);
          
          // Add a close button overlay
          const closeButton = document.createElement('div');
          closeButton.innerHTML = '✕';
          closeButton.style.position = 'fixed';
          closeButton.style.right = '25px';
          closeButton.style.bottom = '315px';
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          closeButton.style.color = 'white';
          closeButton.style.width = '24px';
          closeButton.style.height = '24px';
          closeButton.style.borderRadius = '50%';
          closeButton.style.display = 'flex';
          closeButton.style.alignItems = 'center';
          closeButton.style.justifyContent = 'center';
          closeButton.style.cursor = 'pointer';
          closeButton.style.zIndex = '1001';
          document.body.appendChild(closeButton);
          
          // Create a capture button
          const captureButton = document.createElement('div');
          captureButton.innerHTML = '📸';
          captureButton.style.position = 'fixed';
          captureButton.style.right = '168px'; // Center of video
          captureButton.style.bottom = '90px';
          captureButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          captureButton.style.color = 'white';
          captureButton.style.width = '40px';
          captureButton.style.height = '40px';
          captureButton.style.borderRadius = '50%';
          captureButton.style.display = 'flex';
          captureButton.style.alignItems = 'center';
          captureButton.style.justifyContent = 'center';
          captureButton.style.cursor = 'pointer';
          captureButton.style.zIndex = '1001';
          document.body.appendChild(captureButton);
          
          // Create user message about video interaction
          const userMessage: Message = {
            id: generateId(),
            role: "user",
            content: "[Video interaction started - Camera is active]",
            timestamp: new Date().toISOString(),
            status: "complete"
          };
          
          const updatedConversation = {
            ...activeConversation,
            messages: [...activeConversation.messages, userMessage],
            updatedAt: new Date().toISOString()
          };
          
          updateConversation(updatedConversation);
          
          // Add initial AI response
          const aiMessage: Message = {
            id: generateId(),
            role: "assistant",
            content: "I can see your camera feed now. You can show me something and click the camera button to capture a frame for analysis.",
            timestamp: new Date().toISOString(),
            status: "complete"
          };
          
          const conversationWithResponse = {
            ...updatedConversation,
            messages: [...updatedConversation.messages, aiMessage]
          };
          
          updateConversation(conversationWithResponse);
          
          // Close button handler
          closeButton.onclick = () => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);
            document.body.removeChild(closeButton);
            document.body.removeChild(captureButton);
            
            toast({
              title: "Camera Deactivated",
              description: "Camera has been turned off."
            });
          };
          
          // Capture button handler
          captureButton.onclick = () => {
            // Create a canvas to capture the current frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 data URL
            const imageData = canvas.toDataURL('image/jpeg');
            
            // Create user message about frame capture
            const captureMessage: Message = {
              id: generateId(),
              role: "user",
              content: "[Camera frame captured for analysis]",
              timestamp: new Date().toISOString(),
              status: "complete"
            };
            
            const updatedConversationWithCapture = {
              ...conversationWithResponse,
              messages: [...conversationWithResponse.messages, captureMessage],
              updatedAt: new Date().toISOString()
            };
            
            updateConversation(updatedConversationWithCapture);
            
            // Flash effect for capture
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'white';
            flash.style.opacity = '0.8';
            flash.style.zIndex = '999';
            flash.style.pointerEvents = 'none';
            document.body.appendChild(flash);
            
            setTimeout(() => {
              document.body.removeChild(flash);
            }, 150);
            
            // In a real implementation, we would send the image to the backend
            // For now, just add a simulated response
            const captureResponse: Message = {
              id: generateId(),
              role: "assistant",
              content: "I've analyzed the captured frame. In a production version, this image would be sent to Gemini for analysis. Here's a simulated response about what might be in the image.",
              timestamp: new Date().toISOString(),
              status: "complete"
            };
            
            const conversationWithCaptureResponse = {
              ...updatedConversationWithCapture,
              messages: [...updatedConversationWithCapture.messages, captureResponse],
              updatedAt: new Date().toISOString()
            };
            
            updateConversation(conversationWithCaptureResponse);
            
            toast({
              title: "Frame Captured",
              description: "Camera frame has been captured and analyzed."
            });
          };
          
          // Automatic cleanup after 5 minutes
          setTimeout(() => {
            if (document.body.contains(video)) {
              stream.getTracks().forEach(track => track.stop());
              document.body.removeChild(video);
              if (document.body.contains(closeButton)) document.body.removeChild(closeButton);
              if (document.body.contains(captureButton)) document.body.removeChild(captureButton);
              
              toast({
                title: "Camera Deactivated",
                description: "Camera has been automatically turned off after 5 minutes."
              });
            }
          }, 300000); // 5 minutes
          
        }).catch(err => {
          console.error("Error accessing camera:", err);
          toast({
            title: "Camera Access Denied",
            description: "Please allow camera access to use this feature.",
            variant: "destructive"
          });
        });
      } else {
        toast({
          title: "Not Supported",
          description: "Video interaction is not supported in your browser",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in video interaction:", error);
      toast({
        title: "Error",
        description: "An error occurred during video interaction",
        variant: "destructive"
      });
    }
    
    setIsShowingInteractionCards(false);
  };

  const handleScreenShareClick = () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false
        }).then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            
            setTimeout(() => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const screenData = canvas.toDataURL('image/jpeg');
              
              const userMessage: Message = {
                id: generateId(),
                role: "user",
                content: "[Shared screen capture for analysis]",
                timestamp: new Date().toISOString(),
                status: "complete"
              };
              
              const updatedConversation = {
                ...activeConversation,
                messages: [...activeConversation.messages, userMessage],
                updatedAt: new Date().toISOString()
              };
              
              updateConversation(updatedConversation);
              
              socketRef.current.emit('start_screen_sharing', {
                screen_data: screenData,
                model: selectedModel
              });
              
              stream.getTracks().forEach(track => track.stop());
              
              toast({
                title: "Screen Shared",
                description: "Your screen has been shared with the AI for analysis."
              });
            }, 500);
          };
        }).catch(err => {
          console.error("Error accessing screen:", err);
          toast({
            title: "Screen Share Error",
            description: "Could not access your screen",
            variant: "destructive"
          });
        });
      } else {
        toast({
          title: "Not Supported",
          description: "Screen sharing is not supported in your browser",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in screen sharing:", error);
      toast({
        title: "Error",
        description: "An error occurred during screen sharing",
        variant: "destructive"
      });
    }
    
    setIsShowingInteractionCards(false);
  };

  const estimateTokenCount = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const generateTitleFromMessage = (message: string): string => {
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (words.length < message.split(' ').length ? '...' : '');
  };

  const handleModelChange = async (model: string) => {
    try {
      setSelectedModel(model);
      
      const response = await fetch('http://localhost:5000/api/switch_model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Model Updated",
          description: `Successfully switched to ${model}`
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to switch model",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error switching model:", error);
      toast({
        title: "Error",
        description: "Failed to switch model",
        variant: "destructive"
      });
    }
  };

  // Add this useEffect to monitor conversation changes
  useEffect(() => {
    console.log('Active conversation updated:', {
      id: activeConversation?.id,
      messageCount: activeConversation?.messages.length,
      lastMessage: activeConversation?.messages[activeConversation?.messages?.length - 1]
    });
  }, [activeConversation]);

  // Initialize socket connection with dependency tracking and enhanced logging
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
      
      fetchAvailableModels();
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server in React component, reason:', socket.disconnected);
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Lost connection to Dartopia backend",
        variant: "destructive"
      });
    });
    
    // Direct handling of responses from the server with enhanced debugging
    socket.on('receive_message', (data) => {
      console.log('Socket receive_message event:', {
        data,
        pendingMessageId: pendingMessageIdRef.current,
        activeConversationId,
        hasActiveConversation: !!conversations.find(c => c.id === activeConversationId)
      });
      
      // Handle audio data if present
      if (data.audio) {
        console.log('Audio data received, setting up audio player');
        setCurrentAudio(data.audio);
      } else if (data.voice_error) {
        console.error('Voice generation error:', data.voice_error);
        toast({
          title: "Voice Error",
          description: "Failed to generate voice response. Using text only.",
          variant: "destructive"
        });
      }
      
      // Get the active conversation
      const activeConversation = conversations.find(c => c.id === activeConversationId);
      if (!activeConversation) {
        console.error('Active conversation not found');
        return;
      }
      
      if (pendingMessageIdRef.current) {
        const messageId = pendingMessageIdRef.current;
        
        // Add debug logging
        console.log('Updating message with ID:', messageId);
        console.log('Response content:', data.response);
        
        // Find the message that was pending a response
        const messageToUpdate = activeConversation.messages.find(m => m.id === messageId);
        if (!messageToUpdate) {
          console.error('Pending message not found, messageId:', messageId);
          console.log('Available messages:', activeConversation.messages);
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
        
        console.log('Created updated message:', updatedMessage);
        
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
        
        console.log('About to update conversation with:', updatedConversation);
        
        // Update the conversation in state
        setConversations(prevConversations => {
          console.log('Updating conversations state');
          return prevConversations.map(c => c.id === activeConversationId ? updatedConversation : c);
        });
        
        // Clear the pending message ID
        pendingMessageIdRef.current = null;
        
        // Stop streaming indicator
        setIsStreaming(false);
        
        // Scroll to bottom
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Completed message update flow');
      } else {
        console.warn('Received message but no pending message ID was set');
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
        // Handle error for the pending message
        const activeConversation = conversations.find(c => c.id === activeConversationId);
        if (!activeConversation) return;
        
        const messageId = pendingMessageIdRef.current;
        
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
      }
    });
    
    socket.on('screen_sharing_response', (data) => {
      console.log('Received screen sharing response:', data);
      toast({
        title: "Screen Analysis",
        description: "Received analysis from screen sharing"
      });
      
      const aiMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        status: "complete",
        tokenCount: estimateTokenCount(data.response)
      };
      
      const updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, aiMessage],
        updatedAt: new Date().toISOString(),
        tokenUsage: {
          ...activeConversation.tokenUsage,
          output: activeConversation.tokenUsage.output + (aiMessage.tokenCount || 0),
          total: activeConversation.tokenUsage.total + (aiMessage.tokenCount || 0)
        }
      };
      
      updateConversation(updatedConversation);
    });
    
    // Clean up event listeners when component unmounts
    return () => {
      console.log('Cleaning up socket listeners');
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('receive_message');
        socket.off('error');
        socket.off('screen_sharing_response');
      }
    };
  }, [activeConversationId, conversations]);  // Add dependencies to rerun when these change

  const fetchAvailableModels = async () => {
    try {
      console.log('Fetching available models from backend...');
      const response = await fetch('http://localhost:5000/api/models');
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.models)) {
        console.log(`Successfully fetched ${data.models.length} models`);
        setAvailableModels(data.models);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left sidebar - keeping original width but enhancing styles */}
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
      
      {/* Main content area - significantly increased width */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {!isConnected && (
          <div className="bg-yellow-100 text-yellow-800 px-6 py-3 text-base font-medium">
            Not connected to backend server. Attempting to reconnect...
          </div>
        )}
        
        {/* Enhanced header with prominent title and theme toggle */}
        <div className="border-b px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dartopia AI Assistant</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle variant="outline" />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto py-6 px-8">
            {/* System instructions with improved styling */}
            <div className="mb-8">
              <SystemInstructions 
                instructions={activeConversation.systemInstructions || ""}
                onUpdate={updateSystemInstructions}
              />
            </div>
            
            {isShowingInteractionCards && activeConversation.messages.length === 0 ? (
              <>
                {/* Enhanced welcome screen with larger elements */}
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
              <div className="min-h-[60vh]"> {/* Ensure minimum height for content area */}
                <ConversationPanel 
                  conversation={activeConversation}
                  isStreaming={isStreaming}
                  messageEndRef={messageEndRef}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced input area with more space and prominence */}
        <div className="p-6 bg-card border-t">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col space-y-4">
              <TokenUsage tokenUsage={activeConversation.tokenUsage} />
              
              {/* Audio player for voice responses */}
              {currentAudio && (
                <div className="my-3">
                  <AudioPlayer 
                    audioData={currentAudio}
                    autoPlay={true}
                    onComplete={() => setCurrentAudio(undefined)}
                  />
                </div>
              )}
              
              <MessageInput 
                onSendMessage={handleSendMessage}
                isDisabled={isStreaming || !isConnected}
                onMicClick={handleMicClick}
                onVideoClick={handleVideoClick}
                onScreenShareClick={handleScreenShareClick}
                enableVoice={enableVoice}
                onVoiceToggle={() => setEnableVoice(!enableVoice)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right sidebar - reduced width and made collapsible */}
      <div className={cn(
        "border-l transition-all duration-300 ease-in-out",
        activeTab === "hidden" ? "w-12" : "w-72" // Narrower sidebar
      )}>
        <div className="h-full flex flex-col">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className={cn("font-medium truncate", activeTab === "hidden" ? "hidden" : "")}>Settings</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(activeTab === "hidden" ? "settings" : "hidden")}
              className="h-8 w-8 p-0"
            >
              {activeTab === "hidden" ? "←" : "→"}
            </Button>
          </div>
          
          {activeTab !== "hidden" && (
            <div className="flex-1 overflow-auto p-4">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="google">Google AI</TabsTrigger>
                  <TabsTrigger value="screen">Screen</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="space-y-6">
                  {/* Theme/Appearance settings */}
                  <ThemeToggle variant="prominent" />
                  
                  <Separator className="my-4" />
                  
                  <ModelSelector 
                    selectedModel={selectedModel}
                    onChange={handleModelChange}
                    useContextChunking={useContextChunking}
                    onToggleContextChunking={setUseContextChunking}
                    availableModels={availableModels}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
