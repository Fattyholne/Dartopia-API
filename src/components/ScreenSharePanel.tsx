import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScreenShare, StopCircle } from "lucide-react";
import { getSocket } from "@/lib/socketClient";

interface ScreenSharePanelProps {
  isVisible: boolean;
  onScreenShare?: () => void;
  isConnected?: boolean;
}

const ScreenSharePanel: React.FC<ScreenSharePanelProps> = ({ 
  isVisible, 
  onScreenShare, 
  isConnected = false 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const startScreenShare = async () => {
    if (onScreenShare) {
      onScreenShare();
      return;
    }
    
    try {
      if (!isConnected) {
        toast({
          title: "Not Connected",
          description: "Cannot share screen while disconnected from the backend",
          variant: "destructive"
        });
        return;
      }
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      setIsSharing(true);
      
      // Create a canvas to capture the screen
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        
        // After a short delay to ensure the video is playing, capture a frame
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 and send to backend
          const screenData = canvas.toDataURL('image/jpeg');
          
          // Send to backend via socket
          const socket = getSocket();
          socket.emit('start_screen_sharing', {
            screen_data: screenData
          });
          
          toast({
            title: "Screen Shared",
            description: "Your screen has been shared with the AI for analysis."
          });
        }, 500);
      };
      
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        title: "Screen Sharing Failed",
        description: "Could not access your screen. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsSharing(false);
    
    toast({
      title: "Screen Sharing Stopped",
      description: "Your screen is no longer being shared."
    });
  };
  
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Screen Sharing</h3>
      
      <Card className="p-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your screen to get AI analysis and help with your content.
          </p>
          
          {isSharing ? (
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={stopScreenShare}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Sharing
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="w-full"
              onClick={startScreenShare}
              disabled={!isConnected}
            >
              <ScreenShare className="mr-2 h-4 w-4" />
              Start Screen Share
            </Button>
          )}
          
          {isSharing && (
            <div className="space-y-2">
              <div className="relative rounded-md overflow-hidden border aspect-video bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                This is a local preview of your shared screen. The image has been sent to the AI for analysis.
              </p>
            </div>
          )}
          
          {!isSharing && !isConnected && (
            <p className="text-xs text-text-muted-foreground text-red-500">
              Not connected to backend. Please wait for the connection to be established.
            </p>
          )}
          
          {!isSharing && isConnected && (
            <p className="text-xs text-muted-foreground">
              Share your terminal, browser, or any application to get AI analysis and insights.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ScreenSharePanel;
