import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface BackendModel {
  name: string;
  display_name: string;
  supported_generation_methods: string[];
}

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
  useContextChunking?: boolean;
  onToggleContextChunking?: (enabled: boolean) => void;
  availableModels?: BackendModel[];
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
  { id: "gemini-2.0-pro-exp", name: "Gemini 2.0 Pro (Experimental)", provider: "Google" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B", provider: "Google" },
  { id: "gemini-pro-vision", name: "Gemini Pro Vision", provider: "Google" },
  { id: "text-embedding-004", name: "Text Embedding", provider: "Google" },
  
  // OpenAI Models (keeping these as they require API key)
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", requiresApiKey: true },
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI", requiresApiKey: true },
  
  // Anthropic Models (keeping these as they require API key)
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
  const hasGoogleApiKey = true; // Default to true since we're using the backend
  const hasOpenAIApiKey = !!localStorage.getItem("openai_api_key");
  const hasAnthropicApiKey = !!localStorage.getItem("anthropic_api_key");
  
  const getModelAvailability = (model: AIModel): boolean => {
    if (!model.requiresApiKey) return true;
    if (model.provider === "Google") return hasGoogleApiKey;
    if (model.provider === "OpenAI") return hasOpenAIApiKey;
    if (model.provider === "Anthropic") return hasAnthropicApiKey;
    return false;
  };

  // Convert backend models to our format if they exist
  const backendModels: AIModel[] = availableModels.length > 0 
    ? availableModels.map(model => ({
        id: model.name,
        name: model.display_name || model.name.split('/').pop() || model.name,
        provider: "Google",
        isAvailable: model.supported_generation_methods.includes('generateContent')
      }))
    : [];
  
  // Merge backend models with default models, prioritizing backend models
  const models = backendModels.length > 0 
    ? [...backendModels, ...defaultModels.filter(m => m.provider !== "Google")]
    : defaultModels;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Model</h3>
        {!hasOpenAIApiKey || !hasAnthropicApiKey ? (
          <span className="text-xs text-muted-foreground">
            Configure API keys in Settings to access more models
          </span>
        ) : null}
      </div>
      
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
                  disabled={model.isAvailable === false}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {model.isAvailable === false && (
                      <Badge variant="outline" className="ml-2 text-xs">Not Available</Badge>
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
                  disabled={!getModelAvailability(model)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {!getModelAvailability(model) && (
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
                  disabled={!getModelAvailability(model)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {!getModelAvailability(model) && (
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
