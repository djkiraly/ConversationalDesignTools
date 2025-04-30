import { NodeProps } from 'reactflow';
import { StickyNote } from 'lucide-react';

interface NoteNodeData {
  label: string;
  content: string;
  openNodeEditor: (id: string, data: any) => void;
}

const NoteNode = ({ data, id, selected }: NodeProps<NoteNodeData>) => {
  const { label, content, openNodeEditor } = data;

  const handleClick = (event: React.MouseEvent) => {
    // Prevent event propagation
    event.stopPropagation();
    // Call the openNodeEditor function with the node id and data
    if (openNodeEditor && typeof openNodeEditor === 'function') {
      openNodeEditor(id, { label, content });
    }
  };

  return (
    <div 
      className={`node note-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'}`}
      onClick={handleClick}
      style={{ 
        background: 'rgba(255, 251, 235, 0.95)', 
        border: '1px solid #fde68a',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <StickyNote size={20} className="text-yellow-500" />
        <div className="font-medium">{label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{content}</div>
      
      {/* No connection handles for notes */}
    </div>
  );
};

export default NoteNode;