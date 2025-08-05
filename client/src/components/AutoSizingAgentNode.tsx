import React from 'react';
import { Position } from 'reactflow';
import { Bot } from 'lucide-react';
import AutoSizingNode from './AutoSizingNode';

interface AutoSizingAgentNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const AutoSizingAgentNode: React.FC<AutoSizingAgentNodeProps> = ({ data, selected, id }) => {
  const agentHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Top, id: 'target-top' },
    { type: 'target' as const, position: Position.Bottom, id: 'target-bottom' },
    { type: 'source' as const, position: Position.Right, id: 'source-right', style: { top: '30%' } },
    { type: 'source' as const, position: Position.Right, id: 'source-right-bottom', style: { top: '70%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom' }
  ];

  return (
    <AutoSizingNode
      id={id}
      data={data}
      selected={selected}
      icon={<Bot size={20} className="text-primary" />}
      className="agent-node"
      handles={agentHandles}
    />
  );
};

export default AutoSizingAgentNode;