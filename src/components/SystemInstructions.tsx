import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Edit, Save } from "lucide-react";

interface SystemInstructionsProps {
  instructions: string;
  onUpdate: (instructions: string) => void;
}

const SystemInstructions: React.FC<SystemInstructionsProps> = ({
  instructions,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState(instructions);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = () => {
    setEditedInstructions(instructions);
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSave = () => {
    onUpdate(editedInstructions);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInstructions(instructions);
    setIsEditing(false);
  };

  return (
    <Card className="mb-6 border">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer border-b"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <h3 className="font-medium text-sm">System Instructions</h3>
        </div>
        
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }}>
            <Edit size={16} />
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <CardContent className="p-3">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedInstructions}
                onChange={(e) => setEditedInstructions(e.target.value)}
                rows={5}
                className="w-full"
                placeholder="Enter system instructions..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save size={16} className="mr-2" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap">{instructions}</div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default SystemInstructions;
