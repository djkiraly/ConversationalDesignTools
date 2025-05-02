import React from 'react';
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
  const handleResize = (
    _e: React.SyntheticEvent,
    { size }: ResizeCallbackData
  ) => {
    onResize(size);
  };

  return (
    <div className={`${selected ? 'border-primary border-2' : ''}`}>
      {/* Use React Flow's draggability only for the node content */}
      <div className="nodrag">
        <ResizableBox
          width={width}
          height={height}
          minConstraints={[minWidth, minHeight]}
          onResize={handleResize}
          resizeHandles={['se']}
          className="react-resizable"
        >
          <div
            className={`${className} w-full h-full p-4 overflow-hidden bg-card border shadow-sm`}
            style={{ width: width, height: height }}
          >
            {/* Re-enable dragging for the node content */}
            <div className="drag resizable-node-content">
              {children}
            </div>
          </div>
        </ResizableBox>
      </div>

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