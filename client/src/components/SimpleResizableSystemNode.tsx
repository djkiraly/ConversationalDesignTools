import React from 'react';
import { Position } from 'reactflow';
import { Database } from 'lucide-react';
import SimpleResizableNode from './SimpleResizableNode';

interface SimpleResizableSystemNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const SimpleResizableSystemNode: React.FC<SimpleResizableSystemNodeProps> = ({ data, selected, id }) => {
  const systemHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Left, id: 'target-left-bottom', style: { top: '70%' } },
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
      icon={<Database size={20} className="text-blue-500" />}
      className="system-node"
      handles={systemHandles}
    />
  );
};

export default SimpleResizableSystemNode;