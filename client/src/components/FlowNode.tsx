import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ConversationPair } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FlowNodeProps {
  data: {
    pair: ConversationPair;
    stepNumber: number;
    stepType: string;
  };
}

function getStepTypeStyles(stepType: string): { bg: string, text: string } {
  switch (stepType.toLowerCase()) {
    case 'customer inquiry':
      return { bg: 'bg-status-info/10', text: 'text-status-info' };
    case 'requirement gathering':
      return { bg: 'bg-status-info/10', text: 'text-status-info' };
    case 'price inquiry':
      return { bg: 'bg-status-info/10', text: 'text-status-info' };
    case 'purchase decision':
      return { bg: 'bg-status-success/10', text: 'text-status-success' };
    case 'completion':
      return { bg: 'bg-status-success/10', text: 'text-status-success' };
    default:
      return { bg: 'bg-neutral-light', text: 'text-neutral-dark/70' };
  }
}

function FlowNode({ data }: FlowNodeProps) {
  const { pair, stepNumber, stepType } = data;
  const stepTypeStyles = getStepTypeStyles(stepType);
  
  return (
    <div className="flow-node bg-white p-4 shadow-md border border-neutral-medium max-w-md">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      <div className="flex items-center mb-2">
        <Badge variant="outline" className="mr-2">
          Step {stepNumber}
        </Badge>
        <Badge className={`${stepTypeStyles.bg} border-0 ${stepTypeStyles.text}`}>
          {stepType}
        </Badge>
      </div>
      
      <div className="mb-2 pb-2 border-b border-neutral-medium">
        <div className="text-sm font-medium text-neutral-dark/75">Customer:</div>
        <div className="pl-2 border-l-2 border-[#ff9800] ml-2">{pair.customer}</div>
      </div>
      
      <div>
        <div className="text-sm font-medium text-neutral-dark/75">Agent:</div>
        <div className="pl-2 border-l-2 border-[#3f51b5] ml-2">{pair.agent}</div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
}

export default memo(FlowNode);
