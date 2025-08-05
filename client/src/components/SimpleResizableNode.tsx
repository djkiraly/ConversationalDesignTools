import React, { useState, useEffect, useRef } from 'react';
import { Handle } from 'reactflow';

interface SimpleResizableNodeProps {
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

const SimpleResizableNode: React.FC<SimpleResizableNodeProps> = ({
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
  const contentRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  
  // Auto-resize based on content
  useEffect(() => {
    if (contentRef.current && labelRef.current && data) {
      // Create a temporary div to measure text size
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.width = '300px'; // Initial width to calculate height
      tempDiv.style.padding = '16px'; // Same as p-4
      tempDiv.style.fontFamily = getComputedStyle(document.body).fontFamily;
      
      // Add content styles
      const contentDiv = document.createElement('div');
      contentDiv.style.fontSize = '0.875rem'; // text-sm
      contentDiv.style.marginTop = '8px'; // mb-2
      contentDiv.innerText = data.content || '';
      tempDiv.appendChild(contentDiv);
      
      // Add label styles
      const labelDiv = document.createElement('div');
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.fontSize = '1rem';
      labelDiv.innerText = data.label || '';
      tempDiv.insertBefore(labelDiv, contentDiv);
      
      document.body.appendChild(tempDiv);
      
      // Calculate height based on content (plus padding and some extra space for handles)
      // Add more padding to ensure all text is visible without scrolling
      const contentHeight = tempDiv.scrollHeight + 40; // Add extra padding for better visibility
      
      // Get approximate content width
      const contentWidth = Math.max(
        300, // Minimum width
        Math.min(800, tempDiv.scrollWidth + 32) // Add padding, limit max width
      );
      
      document.body.removeChild(tempDiv);
      
      // Set size based on content - prioritize showing all content vertically
      setSize({ 
        width: contentWidth, 
        height: Math.max(150, contentHeight) // Ensure minimum height and show all content
      });
    }
  }, [data.label, data.content, data._update]);
  
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
    const nodeElement = (e.target as HTMLElement).closest('.resizable-node-wrapper');
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
      className={`resizable-node-wrapper relative ${selected ? 'border-primary border-2' : 'border border-border'} ${className}`}
      style={{ width: `${size.width}px`, height: `${size.height}px` }}
      onClick={(e) => {
        if (!isDraggingCorner) {
          openNodeEditor(id, data);
        }
      }}
    >
      <div className="p-4 bg-card h-full overflow-visible">
        <div className="flex items-center space-x-2 mb-2" ref={labelRef}>
          {icon}
          <div className="font-medium">{data.label}</div>
        </div>
        <div className="text-sm text-muted-foreground" ref={contentRef}>{data.content}</div>
      </div>
      
      {/* Resize handle */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize opacity-60 hover:opacity-100 z-50"
        style={{ 
          backgroundImage: 'linear-gradient(135deg, transparent 50%, #3b82f6 50%)',
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

export default SimpleResizableNode;