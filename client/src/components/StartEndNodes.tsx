import { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Play, Square, RotateCcw } from 'lucide-react';

interface StartEndNodeData {
  label: string;
  content: string;
  openNodeEditor: (id: string, data: any) => void;
}

export const StartNode = ({ data, id, selected }: NodeProps<StartEndNodeData>) => {
  const { label, content, openNodeEditor } = data;

  return (
    <div 
      className={`node start-node rounded-md p-4 w-[200px] ${selected ? 'border-2 border-primary' : 'border border-border'}`}
      onClick={() => openNodeEditor(id, data)}
      style={{ 
        background: 'rgba(236, 253, 245, 0.95)', 
        border: '1px solid #10b981',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Play size={20} className="text-green-500" />
        <div className="font-medium">{label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{content}</div>
      
      {/* Only output connections for start node */}
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ left: '50%' }} />
    </div>
  );
};

export const EndNode = ({ data, id, selected }: NodeProps<StartEndNodeData>) => {
  const { label, content, openNodeEditor } = data;

  return (
    <div 
      className={`node end-node rounded-md p-4 w-[200px] ${selected ? 'border-2 border-primary' : 'border border-border'}`}
      onClick={() => openNodeEditor(id, data)}
      style={{ 
        background: 'rgba(254, 226, 226, 0.95)', 
        border: '1px solid #ef4444',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Square size={20} className="text-red-500" />
        <div className="font-medium">{label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{content}</div>
      
      {/* Only input connections for end node */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '50%' }} />
      <Handle type="target" position={Position.Top} id="target-top" style={{ left: '50%' }} />
    </div>
  );
};

export const ReturnNode = ({ data, id, selected }: NodeProps<StartEndNodeData>) => {
  const { label, content, openNodeEditor } = data;

  return (
    <div 
      className={`node return-node rounded-md p-4 w-[200px] ${selected ? 'border-2 border-primary' : 'border border-border'}`}
      onClick={() => openNodeEditor(id, data)}
      style={{ 
        background: 'rgba(224, 231, 255, 0.95)', 
        border: '1px solid #6366f1',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <RotateCcw size={20} className="text-indigo-500" />
        <div className="font-medium">{label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{content}</div>
      
      {/* Both input and output connections for return node */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Top} id="target-top" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ left: '50%' }} />
    </div>
  );
};