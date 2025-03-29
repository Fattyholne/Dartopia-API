import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
  useContextChunking?: boolean;
  onToggleContextChunking?: (enabled: boolean) => void;
  availableModels?: any[];
}

interface AIModel {
  id: string;
  name: string;
  provider: "Google" | "OpenAI" | "Anthropic" | "Other";
  requiresApiKey?: boolean;
  isAvailable?: boolean;
}

// Default models to show when backend models aren't available
const defaultModels: AIModel[] = [
  // Google/Vertex AI Models
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
  { id: "gemini-pro-vision", name: "Gemini Pro Vision", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
  { id: "vertex-text-bison", name: "Vertex Text Bison", provider: "Google" },
  { id: "vertex-code-bison", name: "Vertex Code Bison", provider: "Google" },
  
  // OpenAI Models
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", requiresApiKey: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", requiresApiKey: true },
  
  // Anthropic Models
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", requiresApiKey: true },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic", requiresApiKey: true },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", requiresApiKey: true }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onChange,
  useContextChunking = false,
  onToggleContextChunking,
  availableModels = []
}) => {
  // Check if API keys are set for the various providers
  const hasGoogleApiKey = true; // Default to true since we're using the backend
  const hasOpenAIApiKey = !!localStorage.getItem("openai_api_key");
  const hasAnthropicApiKey = !!localStorage.getItem("anthropic_api_key");
  
  const getModelAvailability = (model: AIModel): boolean => {
    if (model.provider === "Google") return hasGoogleApiKey;
    if (model.provider === "OpenAI") return hasOpenAIApiKey;
    if (model.provider === "Anthropic") return hasAnthropicApiKey;
    return true;
  };

  // Convert backend models to our format if they exist
  const backendModels: AIModel[] = availableModels.length > 0 
    ? availableModels.map(model => ({
        id: model.name,
        name: model.display_name || model.name.split('/').pop(),
        provider: "Google", // All models from the backend are Google models
        isAvailable: true
      }))
    : [];
  
  // Use backend models if available, otherwise fall back to default models
  const models = backendModels.length > 0 
    ? [...backendModels, ...defaultModels.filter(m => m.provider !== "Google")]
    : defaultModels;
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Model</h3>
      <Select value={selectedModel} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <div className="max-h-[300px] overflow-auto">
            {/* Google/Vertex AI Models */}
            <div className="px-2 py-1.5 text-xs font-semibold">Google AI / Vertex AI</div>
            {models
              .filter(model => model.provider === "Google")
              .map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id} 
                  disabled={model.requiresApiKey && !getModelAvailability(model)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {model.requiresApiKey && !getModelAvailability(model) && (
                      <Badge variant="outline" className="ml-2 text-xs">Requires API Key</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              
            {/* OpenAI Models */}
            <div className="px-2 py-1.5 text-xs font-semibold mt-1">OpenAI</div>
            {models
              .filter(model => model.provider === "OpenAI")
              .map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id} 
                  disabled={model.requiresApiKey && !getModelAvailability(model)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {model.requiresApiKey && !getModelAvailability(model) && (
                      <Badge variant="outline" className="ml-2 text-xs">Requires API Key</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              
            {/* Anthropic Models */}
            <div className="px-2 py-1.5 text-xs font-semibold mt-1">Anthropic</div>
            {models
              .filter(model => model.provider === "Anthropic")
              .map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id} 
                  disabled={model.requiresApiKey && !getModelAvailability(model)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {model.requiresApiKey && !getModelAvailability(model) && (
                      <Badge variant="outline" className="ml-2 text-xs">Requires API Key</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
          </div>
        </SelectContent>
      </Select>
      
      {onToggleContextChunking && (
        <div className="flex items-center justify-between mt-4">
          <div className="space-y-0.5">
            <Label htmlFor="context-chunking">Context Chunking</Label>
            <p className="text-xs text-muted-foreground">Only send relevant conversation parts to the API</p>
          </div>
          <Switch
            id="context-chunking"
            checked={useContextChunking}
            onCheckedChange={onToggleContextChunking}
          />
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
