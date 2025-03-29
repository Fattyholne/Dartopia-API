import React from "react";
import { Card } from "@/components/ui/card";
import { Mic, Video, ScreenShare } from "lucide-react";

interface InteractionCardsProps {
  onMicClick: () => void;
  onVideoClick: () => void;
  onScreenShareClick: () => void;
}

const InteractionCards: React.FC<InteractionCardsProps> = ({
  onMicClick,
  onVideoClick,
  onScreenShareClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
      <Card 
        className="p-6 flex flex-col items-center justify-center gap-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        onClick={onMicClick}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mic className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="font-medium mb-1">Talk to Gemini</h3>
          <p className="text-sm text-muted-foreground">
            Start a real-time conversation using your microphone.
          </p>
        </div>
      </Card>

      <Card 
        className="p-6 flex flex-col items-center justify-center gap-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        onClick={onVideoClick}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Video className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="font-medium mb-1">Show Gemini</h3>
          <p className="text-sm text-muted-foreground">
            Use your webcam to share what you're looking at and get real-time feedback.
          </p>
        </div>
      </Card>

      <Card 
        className="p-6 flex flex-col items-center justify-center gap-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        onClick={onScreenShareClick}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ScreenShare className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="font-medium mb-1">Share your screen</h3>
          <p className="text-sm text-muted-foreground">
            Share your screen to show Gemini what you're working on.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default InteractionCards;
