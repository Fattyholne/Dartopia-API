import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { Info, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";

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

  const handleSaveApiKey = () => {
    localStorage.setItem("google_ai_api_key", apiKey);
    localStorage.setItem("vertex_ai_project_id", projectId);
    localStorage.setItem("vertex_ai_location", location);
    
    toast({
      title: "Settings Saved",
      description: "Your Google AI and Vertex AI settings have been saved locally.",
    });
  };
  
  const handleAddCustomLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both a title and URL for your custom link.",
        variant: "destructive"
      });
      return;
    }
    
    const newLink: CustomLink = {
      id: Date.now().toString(),
      title: newLinkTitle,
      url: newLinkUrl
    };
    
    setCustomLinks([...customLinks, newLink]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    
    toast({
      title: "Link Added",
      description: `Added "${newLinkTitle}" to your custom links.`
    });
  };
  
  const handleDeleteCustomLink = (id: string) => {
    setCustomLinks(customLinks.filter(link => link.id !== id));
    
    toast({
      title: "Link Removed",
      description: "The custom link has been removed."
    });
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Google AI Integration</h3>
      
      <Tabs defaultValue="api-key" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-key">API Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="custom-links">Custom Links</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-key">
          <Card className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure your Google AI and Vertex AI settings.
              </p>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Google AI API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
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
                  Save Settings
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    These settings are used to connect to Vertex AI's Gemini endpoint.
                    Your project must have the Vertex AI API enabled.
                  </p>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This information will be stored in your browser's local storage. For better security,
                  consider connecting to Supabase and storing your key there.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quick links to Google's AI development resources and tools.
              </p>
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">Google Cloud & Vertex AI</h4>
                <div className="grid gap-2">
                  <Link href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Google Cloud Console
                  </Link>
                  <Link href="https://console.cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Console
                  </Link>
                  <Link href="https://console.cloud.google.com/vertex-ai/model-garden" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Model Garden
                  </Link>
                  <Link href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Google AI Studio
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">Notebooks & Colab</h4>
                <div className="grid gap-2">
                  <Link href="https://colab.research.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Google Colab
                  </Link>
                  <Link href="https://console.cloud.google.com/vertex-ai/colab/notebooks" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Notebooks
                  </Link>
                  <Link href="https://colab.research.google.com/github/googlecolab/colabtools/blob/main/notebooks/colab-github-demo.ipynb" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Colab GitHub Integration
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">Development Resources</h4>
                <div className="grid gap-2">
                  <Link href="https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/api-quickstart" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI API Quickstart
                  </Link>
                  <Link href="https://ai.google.dev/tutorials/quickstart" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Gemini API Guide
                  </Link>
                  <Link href="https://github.com/GoogleCloudPlatform/vertex-ai-samples" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Code Samples
                  </Link>
                  <Link href="https://code.visualstudio.com/" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Visual Studio Code
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom-links">
          <Card className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add your own custom links for quick access to frequently used tools and resources.
              </p>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Link Title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="URL (https://...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    size="icon"
                    onClick={handleAddCustomLink}
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator className="my-2" />
                
                {customLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No custom links added yet. Add some links above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customLinks.map(link => (
                      <div key={link.id} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                        <Link href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm truncate max-w-[80%]">
                          {link.title}
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteCustomLink(link.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoogleAIPanel;
