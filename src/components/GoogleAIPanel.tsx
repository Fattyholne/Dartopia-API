import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { Info, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleAIPanelProps {
  isVisible: boolean;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
}

const GoogleAIPanel: React.FC<GoogleAIPanelProps> = ({ isVisible }) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("google_ai_api_key") || "";
  });
  
  const [projectId, setProjectId] = useState(() => {
    return localStorage.getItem("vertex_ai_project_id") || "";
  });
  
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("vertex_ai_location") || "us-central1";
  });
  
  const [customLinks, setCustomLinks] = useLocalStorage<CustomLink[]>("vertex_ai_custom_links", []);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateApiKeyFormat = (key: string): { isValid: boolean; error?: string } => {
    if (!key) {
      return { isValid: false, error: "API key is required" };
    }

    if (!key.startsWith('AI')) {
      return { isValid: false, error: "API key must start with 'AI'" };
    }

    if (key.length !== 39) {
      return { isValid: false, error: "API key must be exactly 39 characters long" };
    }

    const validFormat = /^AI[a-zA-Z0-9_-]{37}$/.test(key);
    if (!validFormat) {
      return { isValid: false, error: "API key contains invalid characters" };
    }

    return { isValid: true };
  };

  const handleSaveApiKey = async () => {
    // First validate format
    const validation = validateApiKeyFormat(apiKey);
    if (!validation.isValid) {
      setApiKeyValid(false);
      setValidationError(validation.error);
      toast({
        title: "API Key Error",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      // Verify key with backend
      const response = await fetch('/api/models');
      const data = await response.json();
      
      if (data.status === 'error') {
        setApiKeyValid(false);
        const errorMessage = data.error.includes("API_KEY_INVALID") 
          ? "The API key is not authorized for Google AI services. Please check your credentials."
          : data.error;
        setValidationError(errorMessage);
        toast({
          title: "API Key Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      // Save valid key
      localStorage.setItem("google_ai_api_key", apiKey);
      localStorage.setItem("vertex_ai_project_id", projectId);
      localStorage.setItem("vertex_ai_location", location);
      
      setApiKeyValid(true);
      setValidationError(null);
      
      toast({
        title: "Settings Saved",
        description: "Your Google AI settings have been saved and validated.",
      });
    } catch (error) {
      setApiKeyValid(false);
      const errorMessage = "Failed to validate API key. Please check your connection.";
      setValidationError(errorMessage);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className={isVisible ? "space-y-4" : "hidden"}>
      <Tabs defaultValue="api-key">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api-key">API Settings</TabsTrigger>
          <TabsTrigger value="custom-links">Custom Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-key">
          <Card className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure your Google AI and Vertex AI settings.
              </p>
              
              {validationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              
              {apiKeyValid === true && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>API key is valid and working correctly.</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Google AI API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setApiKeyValid(null);
                      setValidationError(null);
                    }}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium">Vertex AI Project ID</label>
                  <Input
                    type="text"
                    placeholder="Enter your project ID"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium">Location</label>
                  <Input
                    type="text"
                    placeholder="us-central1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={handleSaveApiKey}
                >
                  Save & Validate Settings
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Your Google API key should start with 'AI' and be 39 characters long.
                    Make sure you have the Vertex AI API enabled in your Google Cloud project.
                  </p>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Need help? Visit the <Link href="https://cloud.google.com/vertex-ai/docs/start/cloud-console" target="_blank">Google Cloud Console</Link> to set up your project.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom-links">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Add Custom Link</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                  />
                  <Input
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      if (newLinkTitle && newLinkUrl) {
                        setCustomLinks([
                          ...customLinks,
                          {
                            id: Date.now().toString(),
                            title: newLinkTitle,
                            url: newLinkUrl
                          }
                        ]);
                        setNewLinkTitle('');
                        setNewLinkUrl('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {customLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between">
                    <Link href={link.url} target="_blank">{link.title}</Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCustomLinks(customLinks.filter(l => l.id !== link.id));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoogleAIPanel;
