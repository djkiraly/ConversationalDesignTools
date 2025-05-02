import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Position } from 'reactflow';
import ResizableNode from './ResizableNode';

interface ResizableEscalationNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const ResizableEscalationNode: React.FC<ResizableEscalationNodeProps> = ({ data, selected, id }) => {
  const { openNodeEditor } = data;
  const [nodeSize, setNodeSize] = useState({ width: 300, height: 150 });

  const escalationHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Left, id: 'target-left-bottom', style: { top: '70%' } },
    { type: 'target' as const, position: Position.Top, id: 'target-top' },
    { type: 'source' as const, position: Position.Right, id: 'source-right', style: { top: '30%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom' },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom-human', style: { left: '75%' } }
  ];

  return (
    <ResizableNode
      minWidth={200}
      minHeight={100}
      width={nodeSize.width}
      height={nodeSize.height}
      selected={selected}
      className="node escalation-node"
      handles={escalationHandles}
      onResize={(size) => setNodeSize(size)}
    >
      <div onClick={() => openNodeEditor(id, data)}>
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle size={20} className="text-orange-500" />
          <div className="font-medium">{data.label}</div>
        </div>
        <div className="text-sm text-muted-foreground">{data.content}</div>
      </div>
    </ResizableNode>
  );
};

export default ResizableEscalationNode;