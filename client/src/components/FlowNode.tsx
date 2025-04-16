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
      
      <div className="flex items-center mb-3">
        <Badge variant="outline" className="mr-2">
          Step {stepNumber}
        </Badge>
        <Badge className={`${stepTypeStyles.bg} border-0 ${stepTypeStyles.text}`}>
          {stepType}
        </Badge>
      </div>
      
      <Card className="mb-3 overflow-hidden">
        <div className="bg-amber-50 p-2 border-b border-amber-200 flex items-center">
          <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="font-medium text-amber-800">Customer</div>
        </div>
        <div className="p-3 bg-white text-neutral-dark">
          {pair.customer}
        </div>
      </Card>
      
      <Card className="overflow-hidden">
        <div className="bg-indigo-50 p-2 border-b border-indigo-200 flex items-center">
          <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21.6 12.5c.4.2.4.8 0 1l-9 5c-.3.2-.6.2-.9 0l-9-5c-.4-.2-.4-.8 0-1l9-5c.3-.2.6-.2.9 0l9 5z"></path>
              <path d="M21.6 16.5c.4.2.4.8 0 1l-9 5c-.3.2-.6.2-.9 0l-9-5c-.4-.2-.4-.8 0-1l9-5c.3-.2.6-.2.9 0l9 5z"></path>
              <path d="M21.6 8.5c.4.2.4.8 0 1l-9 5c-.3.2-.6.2-.9 0l-9-5c-.4-.2-.4-.8 0-1l9-5c.3-.2.6-.2.9 0l9 5z"></path>
            </svg>
          </div>
          <div className="font-medium text-indigo-800">Agent</div>
        </div>
        <div className="p-3 bg-white text-neutral-dark">
          {pair.agent}
        </div>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
}

export default memo(FlowNode);
