import React, { useState, useEffect } from 'react';
import { Handle } from 'reactflow';

interface AutoSizingNodeProps {
  id: string;
  data: any;
  selected: boolean;
  icon: React.ReactNode;
  className?: string;
  handles: Array<{
    id: string;
    type: 'source' | 'target';
    position: any; // Position from ReactFlow
    style?: React.CSSProperties;
  }>;
}

const AutoSizingNode: React.FC<AutoSizingNodeProps> = ({
  id,
  data,
  selected,
  icon,
  className = '',
  handles
}) => {
  const { openNodeEditor } = data;
  const [size, setSize] = useState({ width: 300, height: 150 });
  const [isDraggingCorner, setIsDraggingCorner] = useState(false);
  
  // Auto-size based on content
  useEffect(() => {
    if (!data) return;
    
    // Get text content
    const label = data.label || '';
    const content = data.content || '';
    
    // Calculate size based on text length
    const textLength = content.length;
    const lineEstimate = content.split(/\r\n|\r|\n/).length;
    
    // Base width on label length, with min/max constraints
    const baseWidth = Math.max(
      300, // Minimum width
      Math.min(800, Math.max(label.length * 10, 300)) // Cap at 800px
    );
    
    // Calculate height based on content length and line count
    const lineHeight = 20; // Average line height in pixels
    let contentHeight = 150; // Minimum height
    
    if (textLength > 0) {
      // Estimate lines based on text length and width
      const estimatedLines = Math.max(
        lineEstimate,
        Math.ceil(textLength / (baseWidth / 10)) // Rough estimate of chars per line
      );
      
      // Calculate height with room for label and padding
      contentHeight = Math.max(150, (estimatedLines * lineHeight) + 70);
    }
    
    // Set size
    setSize({
      width: baseWidth,
      height: contentHeight
    });
    
  }, [data?.label, data?.content, data?._update]);
  
  // Handle mouse down on resize corner
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingCorner(true);
    
    // Add listeners to window
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse move (resize)
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingCorner) return;
    
    // Get parent node element to calculate relative position
    const nodeElement = (e.target as HTMLElement).closest('.auto-sizing-node');
    if (!nodeElement) return;
    
    const rect = nodeElement.getBoundingClientRect();
    const newWidth = Math.max(200, e.clientX - rect.left);
    const newHeight = Math.max(100, e.clientY - rect.top);
    
    setSize({ width: newWidth, height: newHeight });
    e.preventDefault();
  };
  
  // Handle mouse up (stop resizing)
  const handleMouseUp = () => {
    setIsDraggingCorner(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div 
      className={`auto-sizing-node relative ${selected ? 'border-primary border-2' : 'border border-border'} ${className}`}
      style={{ 
        width: `${size.width}px`, 
        height: `${size.height}px`,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}
      onClick={() => {
        if (!isDraggingCorner) {
          openNodeEditor(id, data);
        }
      }}
    >
      <div className="p-4 bg-card h-full overflow-visible">
        <div className="flex items-center space-x-2 mb-2">
          {icon}
          <div className="font-medium">{data.label}</div>
        </div>
        <div className="text-sm text-muted-foreground">{data.content}</div>
      </div>
      
      {/* Resize handle */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
        style={{ 
          backgroundImage: 'linear-gradient(135deg, transparent 50%, #3b82f6 50%)',
          opacity: 0.8
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Connection handles */}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          style={handle.style}
        />
      ))}
    </div>
  );
};

export default AutoSizingNode;