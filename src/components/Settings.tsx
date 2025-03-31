import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [tokenLimit, setTokenLimit] = useState("32000");
  const [model, setModel] = useState("gemini-pro");
  const [useVision, setUseVision] = useState(true);
  const [autoTitle, setAutoTitle] = useState(true);
  const [openAIKey, setOpenAIKey] = useState(localStorage.getItem("openai_api_key") || "");
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem("anthropic_api_key") || "");

  const handleOpenAIKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOpenAIKey(value);
    localStorage.setItem("openai_api_key", value);
  };

  const handleAnthropicKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAnthropicKey(value);
    localStorage.setItem("anthropic_api_key", value);
  };

  const handleSaveApiSettings = () => {
    // This would save to localStorage or another persistent storage
    toast({
      title: "Settings saved",
      description: "Your API settings have been updated."
    });
  };
  
  const handleSavePreferences = () => {
    // This would save to localStorage or another persistent storage
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated."
    });
  };
  
  return (
    <Tabs defaultValue="api">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="api">API Settings</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>
      
      <TabsContent value="api" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
              <SelectItem value="vertex-text">Vertex AI Text</SelectItem>
              <SelectItem value="vertex-code">Vertex AI Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="token-limit">Token Limit</Label>
          <Select value={tokenLimit} onValueChange={setTokenLimit}>
            <SelectTrigger id="token-limit">
              <SelectValue placeholder="Select token limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8000">8K tokens</SelectItem>
              <SelectItem value="16000">16K tokens</SelectItem>
              <SelectItem value="32000">32K tokens</SelectItem>
              <SelectItem value="64000">64K tokens</SelectItem>
              <SelectItem value="128000">128K tokens</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="use-vision"
            checked={useVision}
            onCheckedChange={setUseVision}
          />
          <Label htmlFor="use-vision">Enable Vision capabilities</Label>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">API Configuration</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={openAIKey}
                  onChange={handleOpenAIKeyChange}
                  placeholder="sk-..."
                />
              </div>
              <div>
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  value={anthropicKey}
                  onChange={handleAnthropicKeyChange}
                  placeholder="sk-ant-..."
                />
              </div>
            </div>
          </div>
        </div>
        
        <Button onClick={handleSaveApiSettings} className="w-full">
          Save API Settings
        </Button>
      </TabsContent>
      
      <TabsContent value="preferences" className="space-y-4 mt-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-title"
            checked={autoTitle}
            onCheckedChange={setAutoTitle}
          />
          <Label htmlFor="auto-title">Auto-generate conversation titles</Label>
        </div>
        
        <Button onClick={handleSavePreferences} className="w-full">
          Save Preferences
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default Settings;
