import React, { ReactNode, CSSProperties } from 'react';
import { Handle, Position } from 'reactflow';
import { ResizableBox, ResizableBoxProps } from 'react-resizable';

interface ResizableNodeProps {
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
  width?: number;
  height?: number;
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
  handles?: {
    type: 'source' | 'target';
    position: Position;
    id: string;
    style?: CSSProperties;
  }[];
  onResize?: (size: { width: number; height: number }) => void;
}

const ResizableNode: React.FC<ResizableNodeProps> = ({
  children,
  minWidth = 200,
  minHeight = 100,
  width = 300,
  height = 'auto',
  selected = false,
  className = '',
  style = {},
  handles = [],
  onResize,
}) => {
  const defaultHandleStyle: CSSProperties = {
    background: '#555',
    width: 8,
    height: 8,
  };

  const resizableProps: ResizableBoxProps = {
    width: typeof width === 'number' ? width : 300,
    height: typeof height === 'number' ? height : 150,
    minConstraints: [minWidth, minHeight],
    onResize: (e, { size }) => {
      if (onResize) {
        onResize(size);
      }
    },
    resizeHandles: ['se'],
    handle: (
      <div
        className={`resize-handle ${selected ? 'visible' : 'invisible'} w-3 h-3 bg-primary/70 rounded-sm absolute bottom-0 right-0 cursor-se-resize border border-background`}
      />
    ),
  };

  return (
    <div className="relative">
      <ResizableBox {...resizableProps}>
        <div
          className={`p-4 ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background rounded-md overflow-hidden ${className}`}
          style={style}
        >
          {children}
        </div>
      </ResizableBox>
      
      {/* Render all connection handles */}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          style={{ ...defaultHandleStyle, ...handle.style }}
        />
      ))}
    </div>
  );
};

export default ResizableNode;