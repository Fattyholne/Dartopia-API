import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";

interface VoiceSelectorProps {
  onVoiceChange: (config: VoiceConfig) => void;
  disabled?: boolean;
}

interface VoiceConfig {
  voice: string;
  rate?: number;
  volume?: number;
  pitch?: number;
}

const AVAILABLE_VOICES = [
  { id: "Aoede", name: "Aoede" },
  { id: "Charon", name: "Charon" },
  { id: "Fenrir", name: "Fenrir" },
  { id: "Kore", name: "Kore" },
  { id: "Puck", name: "Puck" },
];

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  onVoiceChange,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [selectedVoice, setSelectedVoice] = useLocalStorage("selected_voice", AVAILABLE_VOICES[0].id);
  const [rate, setRate] = useLocalStorage("voice_rate", [1.0]);
  const [pitch, setPitch] = useLocalStorage("voice_pitch", [1.0]);
  const [volume, setVolume] = useLocalStorage("voice_volume", [1.0]);

  // Update voice config when any parameter changes
  React.useEffect(() => {
    const updateConfig = () => {
      try {
        const config: VoiceConfig = {
          voice: selectedVoice,
          rate: rate[0],
          pitch: pitch[0],
          volume: volume[0],
        };
        onVoiceChange(config);
      } catch (error) {
        toast({
          title: "Voice Configuration Error",
          description: "Failed to update voice settings. Using defaults.",
          variant: "destructive"
        });
        // Reset to defaults
        const defaultVoice = AVAILABLE_VOICES[0].id;
        setSelectedVoice(defaultVoice);
        setRate([1.0]);
        setPitch([1.0]);
        setVolume([1.0]);
      }
    };

    updateConfig();
  }, [
    selectedVoice,
    rate,
    pitch,
    volume,
    onVoiceChange,
    toast,
    setSelectedVoice,
    setRate,
    setPitch,
    setVolume
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Voice</Label>
        <Select 
          value={selectedVoice} 
          onValueChange={setSelectedVoice}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_VOICES.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Rate</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={rate}
            onValueChange={setRate}
            min={0.25}
            max={4.0}
            step={0.25}
            disabled={disabled}
          />
          <span className="text-sm w-12 text-right">{rate[0]}x</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pitch</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={pitch}
            onValueChange={setPitch}
            min={0.5}
            max={2.0}
            step={0.1}
            disabled={disabled}
          />
          <span className="text-sm w-12 text-right">{pitch[0]}x</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Volume</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={volume}
            onValueChange={setVolume}
            min={0.0}
            max={1.0}
            step={0.1}
            disabled={disabled}
          />
          <span className="text-sm w-12 text-right">{Math.round(volume[0] * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;