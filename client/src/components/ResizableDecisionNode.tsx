import React, { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Position } from 'reactflow';
import ResizableNode from './ResizableNode';

interface ResizableDecisionNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const ResizableDecisionNode: React.FC<ResizableDecisionNodeProps> = ({ data, selected, id }) => {
  const { openNodeEditor } = data;
  const [nodeSize, setNodeSize] = useState({ width: 300, height: 150 });

  const decisionHandles = [
    { type: 'target' as const, position: Position.Left, id: 'target-left', style: { top: '30%' } },
    { type: 'target' as const, position: Position.Top, id: 'target-top' },
    
    // Multiple output points for decision branches
    { type: 'source' as const, position: Position.Right, id: 'source-right-1', style: { top: '20%' } },
    { type: 'source' as const, position: Position.Right, id: 'source-right-2', style: { top: '40%' } },
    { type: 'source' as const, position: Position.Right, id: 'source-right-3', style: { top: '60%' } },
    { type: 'source' as const, position: Position.Right, id: 'source-right-4', style: { top: '80%' } },
    
    // Bottom outputs
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom-1', style: { left: '25%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom-2', style: { left: '50%' } },
    { type: 'source' as const, position: Position.Bottom, id: 'source-bottom-3', style: { left: '75%' } }
  ];

  return (
    <ResizableNode
      minWidth={200}
      minHeight={100}
      width={nodeSize.width}
      height={nodeSize.height}
      selected={selected}
      className="node decision-node"
      handles={decisionHandles}
      onResize={(size) => setNodeSize(size)}
    >
      <div onClick={() => openNodeEditor(id, data)}>
        <div className="flex items-center space-x-2 mb-2">
          <GitBranch size={20} className="text-purple-500" />
          <div className="font-medium">{data.label}</div>
        </div>
        <div className="text-sm text-muted-foreground">{data.content}</div>
      </div>
    </ResizableNode>
  );
};

export default ResizableDecisionNode;