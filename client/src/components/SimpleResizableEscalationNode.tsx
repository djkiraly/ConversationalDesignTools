import React from 'react';
import { Position } from 'reactflow';
import { AlertTriangle } from 'lucide-react';
import SimpleResizableNode from './SimpleResizableNode';

interface SimpleResizableEscalationNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const SimpleResizableEscalationNode: React.FC<SimpleResizableEscalationNodeProps> = ({ data, selected, id }) => {
  const escalationHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Left, id: 'target-left-bottom', style: { top: '70%' } },
    { type: 'target' as const, position: Position.Top, id: 'target-top' },
    { type: 'source' as const, position: Position.Right, id: 'source-right', style: { top: '30%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom' },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom-human', style: { left: '75%' } }
  ];

  return (
    <SimpleResizableNode
      id={id}
      data={data}
      selected={selected}
      icon={<AlertTriangle size={20} className="text-orange-500" />}
      className="escalation-node"
      handles={escalationHandles}
    />
  );
};

export default SimpleResizableEscalationNode;