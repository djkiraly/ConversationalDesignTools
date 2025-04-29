import { useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Split, Users } from 'lucide-react';

interface MultiPathNodeData {
  stepType: string;
  title: string;
  description: string;
  outputPaths?: number; // Number of output paths (default is 3)
  onNodeEdit?: (id: string, data: any) => void;
}

export default function MultiPathNode({ data, id }: NodeProps<MultiPathNodeData>) {
  const { stepType, title, description, outputPaths = 3, onNodeEdit } = data;
  
  // Use useRef to preserve values between renders without causing re-renders
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [clickCount, setClickCount] = useState(0);
  
  const handleClick = (e: React.MouseEvent) => {
    // Increment click count
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    if (newClickCount === 1) {
      // If this is the first click, set a timeout to reset the counter
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
        clickTimerRef.current = null;
      }, 300); // 300ms threshold for double-click
    } else if (newClickCount === 2) {
      // If this is the second click, it's a double-click
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      setClickCount(0);
      
      // Stop event propagation to prevent node drag
      e.stopPropagation();
      
      // Call the onNodeEdit function passed in the node data if available
      if (onNodeEdit && id) {
        onNodeEdit(id, { stepType, title, description, outputPaths });
      }
    }
  };
  
  // Generate the output handles based on the number of output paths
  const outputHandles = [];
  const numPaths = Math.min(Math.max(2, outputPaths), 5); // Limit between 2 and 5 paths
  
  // Calculate spacing for the handles
  const cardHeight = 160; // Approximate height of the card in pixels
  const spacing = cardHeight / (numPaths + 1);
  
  for (let i = 1; i <= numPaths; i++) {
    const topPosition = `${i * spacing}px`;
    outputHandles.push(
      <Handle
        key={`output-${i}`}
        type="source"
        position={Position.Right}
        id={`output-${i}`}
        className="w-3 h-3 bg-blue-600"
        style={{ top: topPosition, right: '-4px' }}
      />
    );
  }
  
  // Generate the input handles (3 by default)
  const inputHandles = [];
  const numInputs = 3; // Fixed number of input handles
  const inputSpacing = cardHeight / (numInputs + 1);
  
  for (let i = 1; i <= numInputs; i++) {
    const topPosition = `${i * inputSpacing}px`;
    inputHandles.push(
      <Handle
        key={`input-${i}`}
        type="target"
        position={Position.Left}
        id={`input-${i}`}
        className="w-3 h-3 bg-blue-600"
        style={{ top: topPosition, left: '-4px' }}
      />
    );
  }

  return (
    <div className="multi-path-node">
      {/* Render multiple input handles */}
      {inputHandles}
      
      {/* Additional target handles on top and bottom */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="w-3 h-3 bg-yellow-500"
        style={{ left: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="w-3 h-3 bg-yellow-500"
        style={{ left: '25%' }}
      />
      
      <Card 
        className="w-64 shadow-md border-2 border-yellow-200 bg-yellow-50 hover:shadow-lg transition-shadow cursor-pointer relative"
        onClick={handleClick}
      >
        {/* Edit indicator that shows on hover */}
        <div className="journey-edit-indicator" title="Click twice to edit this node">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </div>
        
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="px-2 py-1 text-yellow-700 font-medium flex items-center gap-1">
              <Split className="h-4 w-4" />
              <span>{stepType || "Decision Point"}</span>
            </Badge>
          </div>
          <CardTitle className="text-lg mt-2 text-yellow-700">{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <p className="text-sm text-gray-600">{description}</p>
          <div className="mt-2 text-xs text-yellow-700">
            {numPaths} possible paths
          </div>
        </CardContent>
      </Card>
      
      {/* Render multiple output handles */}
      {outputHandles}
      
      {/* Additional source handles on top and bottom */}
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className="w-3 h-3 bg-yellow-500"
        style={{ left: '75%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="w-3 h-3 bg-yellow-500"
        style={{ left: '75%' }}
      />
    </div>
  );
}