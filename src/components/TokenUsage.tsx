import React from "react";
import { Progress } from "@/components/ui/progress";

interface TokenUsageProps {
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

const TokenUsage: React.FC<TokenUsageProps> = ({ tokenUsage }) => {
  // Token limits (these would be configurable)
  const MODEL_TOKEN_LIMIT = 32000;
  const percentUsed = Math.min((tokenUsage.total / MODEL_TOKEN_LIMIT) * 100, 100);
  
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
        <span>Token Usage: {tokenUsage.total.toLocaleString()} / {MODEL_TOKEN_LIMIT.toLocaleString()}</span>
        <span>{percentUsed.toFixed(1)}%</span>
      </div>
      <Progress value={percentUsed} className="h-1" />
    </div>
  );
};

export default TokenUsage;
