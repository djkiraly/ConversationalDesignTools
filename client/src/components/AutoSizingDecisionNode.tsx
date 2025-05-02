import React from 'react';
import { Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import AutoSizingNode from './AutoSizingNode';

interface AutoSizingDecisionNodeProps {
  data: any;
  selected: boolean;
  id: string;
}

const AutoSizingDecisionNode: React.FC<AutoSizingDecisionNodeProps> = ({ data, selected, id }) => {
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
    <AutoSizingNode
      id={id}
      data={data}
      selected={selected}
      icon={<GitBranch size={20} className="text-purple-500" />}
      className="decision-node"
      handles={decisionHandles}
    />
  );
};

export default AutoSizingDecisionNode;