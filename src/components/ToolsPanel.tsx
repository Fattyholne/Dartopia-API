import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, ChevronUp, Code, Search, TerminalSquare } from "lucide-react";

const ToolsPanel: React.FC = () => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [structuredOutput, setStructuredOutput] = useState(false);
  const [codeExecution, setCodeExecution] = useState(false);
  const [googleSearch, setGoogleSearch] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tools</h3>
        <button 
          onClick={() => setIsToolsExpanded(!isToolsExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isToolsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {isToolsExpanded && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalSquare size={16} />
              <span className="text-sm">Structured output</span>
            </div>
            <Switch
              checked={structuredOutput}
              onCheckedChange={setStructuredOutput}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={16} />
              <span className="text-sm">Code execution</span>
            </div>
            <Switch 
              checked={codeExecution}
              onCheckedChange={setCodeExecution}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search size={16} />
              <span className="text-sm">Google Search</span>
            </div>
            <Switch 
              checked={googleSearch}
              onCheckedChange={setGoogleSearch}
            />
          </div>
        </div>
      )}
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="function-calling" className="border-none">
          <AccordionTrigger className="py-2 text-sm">Function calling</AccordionTrigger>
          <AccordionContent>
            <div className="text-xs text-muted-foreground">
              Enable advanced function calling capabilities to integrate with your custom APIs.
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ToolsPanel;
