import React from 'react';
import { Position } from 'reactflow';
import { Shield } from 'lucide-react';
import SimpleResizableNode from './SimpleResizableNode';

interface SimpleResizableGuardrailNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const SimpleResizableGuardrailNode: React.FC<SimpleResizableGuardrailNodeProps> = ({ data, selected, id }) => {
  const guardrailHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Top, id: 'target-top' },
    { type: 'source' as const, position: Position.Right, id: 'source-right', style: { top: '30%' } },
    { type: 'source' as const, position: Position.Right, id: 'source-right-bottom', style: { top: '70%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom' }
  ];

  return (
    <SimpleResizableNode
      id={id}
      data={data}
      selected={selected}
      icon={<Shield size={20} className="text-red-500" />}
      className="guardrail-node"
      handles={guardrailHandles}
    />
  );
};

export default SimpleResizableGuardrailNode;