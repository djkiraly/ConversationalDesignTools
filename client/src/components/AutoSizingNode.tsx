import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';

interface HandleConfig {
  type: 'source' | 'target';
  position: Position;
  id: string;
  style?: React.CSSProperties;
}

interface AutoSizingNodeProps {
  id: string;
  data: any;
  selected: boolean;
  icon?: React.ReactNode;
  className?: string;
  handles: HandleConfig[];
}

/**
 * AutoSizingNode component that adjusts its height based on content.
 * This component addresses the issue of scrolling in nodes by measuring
 * content and growing the node's height as needed.
 */
const AutoSizingNode: React.FC<AutoSizingNodeProps> = ({ 
  id, 
  data, 
  selected, 
  icon, 
  className = "",
  handles
}) => {
  const { openNodeEditor } = data;
  const contentRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>(100); // Default minimum height
  
  // Effect to measure and adjust the node height based on content
  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        // Add padding (8px top + 8px bottom) plus some buffer
        setMinHeight(Math.max(100, contentHeight + 32));
      }
    };
    
    // Update on mount and when content or window size changes
    updateHeight();
    
    // Re-measure when the content text changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
    };
  }, [data.content, data.label]);
  
  return (
    <div 
      className={`node ${className} rounded-md p-4 min-w-[200px] max-w-[400px] ${
        selected ? 'border-2 border-primary' : 'border border-border'
      } bg-background`}
      style={{ height: 'auto', minHeight: `${minHeight}px` }}
      onClick={() => openNodeEditor(id, data)}
    >
      {/* Node header with icon and label */}
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <div className="font-medium truncate">{data.label}</div>
      </div>
      
      {/* Node content that determines height */}
      <div 
        ref={contentRef} 
        className="text-sm text-muted-foreground overflow-hidden"
      >
        {data.content}
      </div>
      
      {/* Render all connection handles */}
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