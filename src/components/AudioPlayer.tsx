import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface AudioPlayerProps {
  audioData?: string;
  autoPlay?: boolean;
  onComplete?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioData, 
  autoPlay = true,
  onComplete
}) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle new audio data
  useEffect(() => {
    if (audioData && audioRef.current) {
      try {
        const audioSrc = `data:audio/wav;base64,${audioData}`;
        audioRef.current.src = audioSrc;
        setIsLoading(true);
        setHasError(false);
        
        if (autoPlay) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch(e => {
              console.error("Audio playback failed:", e);
              setIsLoading(false);
              setHasError(true);
              toast({
                title: "Playback Error",
                description: "Failed to play audio response. Try toggling voice mode.",
                variant: "destructive"
              });
            });
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error setting up audio:", error);
        setIsLoading(false);
        setHasError(true);
      }
    }
  }, [audioData, autoPlay, toast]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause toggling
  const togglePlay = () => {
    if (!audioRef.current || hasError) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e);
        setHasError(true);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle muting
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle audio events
  const handleEnded = () => {
    setIsPlaying(false);
    if (onComplete) onComplete();
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleRetry = () => {
    if (!audioRef.current || !audioData) return;
    
    setHasError(false);
    const audioSrc = `data:audio/wav;base64,${audioData}`;
    audioRef.current.src = audioSrc;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(e => {
        console.error("Retry playback failed:", e);
        setHasError(true);
      });
  };

  // Format time in MM:SS
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioData) return null;

  return (
    <div className="flex items-center justify-center space-x-2 p-2 rounded-md bg-muted/50 w-fit mx-auto">
      <audio 
        ref={audioRef} 
        onEnded={handleEnded}
        onDurationChange={handleDurationChange}
        onTimeUpdate={handleTimeUpdate}
      />
      
      <Button
        variant="ghost" 
        size="sm"
        onClick={hasError ? handleRetry : togglePlay}
        disabled={isLoading}
        className="w-8 h-8 p-0"
      >
        {isLoading ? (
          <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : hasError ? (
          <RotateCw className="h-4 w-4" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          onMouseEnter={() => setShowVolumeControl(true)}
          className="w-8 h-8 p-0"
          disabled={hasError}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        
        {showVolumeControl && (
          <div 
            className="absolute bottom-full mb-2 p-2 bg-background border rounded-md shadow-md"
            onMouseEnter={() => setShowVolumeControl(true)}
            onMouseLeave={() => setShowVolumeControl(false)}
          >
            <Slider
              value={[volume * 100]}
              min={0}
              max={100}
              step={1}
              orientation="vertical"
              className="h-24"
              onValueChange={(values) => setVolume(values[0] / 100)}
            />
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default AudioPlayer;