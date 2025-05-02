import React, { useEffect, useRef } from 'react';
import { Handle, HandleProps, Position } from 'reactflow';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface HandleWithStyle extends Omit<HandleProps, 'style'> {
  style?: React.CSSProperties;
}

interface ResizableNodeProps {
  children: React.ReactNode;
  className?: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  handles: HandleWithStyle[];
  selected: boolean;
  onResize: (size: { width: number; height: number }) => void;
}

const ResizableNode: React.FC<ResizableNodeProps> = ({
  children,
  className = '',
  width,
  height,
  minWidth,
  minHeight,
  handles,
  selected,
  onResize
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const handleResize = (
    _e: React.SyntheticEvent,
    { size }: ResizeCallbackData
  ) => {
    onResize(size);
  };
  
  // After mount, add special classes to the resize handle to ensure it doesn't interfere with ReactFlow
  useEffect(() => {
    if (nodeRef.current) {
      const resizeHandle = nodeRef.current.querySelector('.react-resizable-handle');
      if (resizeHandle) {
        // Add nodrag class to prevent ReactFlow from handling drag on this element
        resizeHandle.classList.add('nodrag');
        
        // Prevent node selection when resizing
        resizeHandle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
      }
    }
  }, []);

  return (
    <div 
      ref={nodeRef}
      className={`${selected ? 'border-primary border-2' : ''}`}
    >
      <ResizableBox
        width={width}
        height={height}
        minConstraints={[minWidth, minHeight]}
        onResize={handleResize}
        resizeHandles={['se']}
        className="react-resizable"
        draggableOpts={{ 
          enableUserSelectHack: false,
        }}
      >
        <div
          className={`${className} w-full h-full p-4 overflow-hidden bg-card border shadow-sm`}
          style={{ width: width, height: height }}
        >
          <div className="resizable-node-content">
            {children}
          </div>
        </div>
      </ResizableBox>

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

export default ResizableNode;