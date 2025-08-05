import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Position } from 'reactflow';
import ResizableNode from './ResizableNode';

interface ResizableGuardrailNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const ResizableGuardrailNode: React.FC<ResizableGuardrailNodeProps> = ({ data, selected, id }) => {
  const { openNodeEditor } = data;
  const [nodeSize, setNodeSize] = useState({ width: 300, height: 150 });

  const guardrailHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Top, id: 'target-top' },
    { type: 'source' as const, position: Position.Right, id: 'source-right', style: { top: '30%' } },
    { type: 'source' as const, position: Position.Right, id: 'source-right-bottom', style: { top: '70%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom' }
  ];

  return (
    <ResizableNode
      minWidth={200}
      minHeight={100}
      width={nodeSize.width}
      height={nodeSize.height}
      selected={selected}
      className="node guardrail-node"
      handles={guardrailHandles}
      onResize={(size) => setNodeSize(size)}
    >
      <div onClick={() => openNodeEditor(id, data)}>
        <div className="flex items-center space-x-2 mb-2">
          <Shield size={20} className="text-red-500" />
          <div className="font-medium">{data.label}</div>
        </div>
        <div className="text-sm text-muted-foreground">{data.content}</div>
      </div>
    </ResizableNode>
  );
};

export default ResizableGuardrailNode;