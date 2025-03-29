import React from "react";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/pages/Index";
import { cn } from "@/lib/utils";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings as SettingsIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Settings from "./Settings";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onToggle
}) => {
  return (
    <div className={cn(
      "border-r bg-sidebar transition-all duration-300 flex flex-col",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className={cn(
          "font-semibold text-sidebar-foreground transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 absolute"
        )}>
          Dartopia
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle}
          className="text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </Button>
      </div>
      
      <div className="p-2">
        <Button 
          onClick={onNewConversation}
          className={cn(
            "w-full justify-start gap-2",
            isOpen ? "" : "justify-center p-2"
          )}
          variant="outline"
        >
          <Plus size={18} />
          {isOpen && <span>New Conversation</span>}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => onSelectConversation(conversation.id)}
              onDelete={() => onDeleteConversation(conversation.id)}
              isCollapsed={!isOpen}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-2 border-t mt-auto">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-2 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                isOpen ? "" : "justify-center p-2"
              )}
            >
              <SettingsIcon size={18} />
              {isOpen && <span>Settings</span>}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <Settings />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  isCollapsed: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  isCollapsed
}) => {
  return (
    <div
      className={cn(
        "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        isCollapsed && "justify-center"
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 flex-1 overflow-hidden",
          isCollapsed && "justify-center"
        )}
      >
        <MessageSquare size={18} />
        {!isCollapsed && (
          <span className="truncate">{conversation.title}</span>
        )}
      </button>
      
      {!isCollapsed && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete conversation</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default Sidebar;
