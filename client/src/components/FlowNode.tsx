import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ConversationStep, Message } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FlowNodeProps {
  data: {
    step: ConversationStep;
    stepNumber: number;
    stepType: string;
  };
}

function getStepTypeStyles(stepType: string): { bg: string, text: string, icon: JSX.Element } {
  switch (stepType.toLowerCase()) {
    case 'customer inquiry':
      return { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )
      };
    case 'requirement gathering':
      return { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        )
      };
    case 'price inquiry':
      return { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-800',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        )
      };
    case 'purchase decision':
      return { 
        bg: 'bg-amber-100', 
        text: 'text-amber-800',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        )
      };
    case 'completion':
      return { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )
      };
    default:
      return { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        )
      };
  }
}

function FlowNode({ data }: FlowNodeProps) {
  const { step, stepNumber, stepType } = data;
  const stepTypeStyles = getStepTypeStyles(stepType || step.stepType || 'Conversation Step');
  
  return (
    <div className="flow-node bg-white p-4 shadow-md border border-neutral-medium max-w-md">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      <div className="flex items-center mb-3">
        <Badge variant="outline" className="mr-2">
          Step {stepNumber}
        </Badge>
        <Badge className={`${stepTypeStyles.bg} border-0 ${stepTypeStyles.text} flex items-center gap-1`}>
          <span className="flex items-center">{stepTypeStyles.icon}</span>
          <span>{stepType || step.stepType || 'Conversation Step'}</span>
        </Badge>
      </div>
      
      {/* Display messages in their original order */}
      {step.messages.map((message, idx) => (
        <Card key={idx} className={`${idx < step.messages.length - 1 ? "mb-3" : ""} overflow-hidden`}>
          {message.role === 'customer' ? (
            <>
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
                {message.text}
              </div>
            </>
          ) : (
            <>
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
                {message.text}
              </div>
            </>
          )}
        </Card>
      ))}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
}

export default memo(FlowNode);
