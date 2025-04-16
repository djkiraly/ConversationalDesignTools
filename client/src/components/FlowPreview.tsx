import { useState, useMemo, useRef, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { UseCase, ParsedFlow } from "@shared/schema";
import { Expand, Download, WandSparkles, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FlowNode from "./FlowNode";
import { toPng } from 'html-to-image';

interface FlowPreviewProps {
  useCase: UseCase;
  parsedFlow: ParsedFlow;
}

const nodeTypes = {
  flowNode: FlowNode,
};

export default function FlowPreview({ useCase, parsedFlow }: FlowPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Create nodes from parsed flow data with a zigzag pattern for visual interest
  const nodes = useMemo(() => {
    const horizontalOffset = 80; // Offset for zigzag pattern
    return parsedFlow.steps.map((step, index) => ({
      id: `node-${index}`,
      type: 'flowNode',
      // Alternate nodes left and right for a zigzag path
      position: { 
        x: index % 2 === 0 ? 50 : 50 + horizontalOffset,
        y: index * 350 // Increased vertical spacing for better readability
      },
      data: { 
        step, 
        stepNumber: index + 1,
        // Use step type from the data or default
        stepType: step.stepType
      },
    }));
  }, [parsedFlow.steps]);

  // Create edges to connect the nodes
  const edges = useMemo(() => {
    return parsedFlow.steps.slice(0, -1).map((_, index) => ({
      id: `edge-${index}`,
      source: `node-${index}`,
      target: `node-${index + 1}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3f51b5', strokeWidth: 2 },
    }));
  }, [parsedFlow.steps]);

  // Auto-arrange nodes in a better layout
  const autoArrangeNodes = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Simply use a toast to indicate action was taken
    toast({
      title: "Arranging Flow",
      description: "Flow preview has been refreshed with the current layout",
    });
    
    // This will force a re-render and apply our zigzag pattern
    // In a future enhancement, we could use the ReactFlow API
    // to programmatically arrange the nodes more dynamically
  }, [nodes, toast]);

  // Export flow as PNG
  const handleExportImage = useCallback(() => {
    if (flowRef.current === null) return;

    toPng(flowRef.current, { 
      cacheBust: true,
      quality: 1,
      width: flowRef.current.offsetWidth * 2,
      height: flowRef.current.offsetHeight * 2,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${useCase.title.replace(/\s+/g, '_')}_flow.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error exporting image:', err);
      });
  }, [useCase.title]);

  const previewClasses = `
    ${isFullscreen ? 'fixed inset-0 z-50' : 'md:w-1/2'} 
    bg-white h-full flex flex-col overflow-hidden
  `;

  return (
    <div className={previewClasses}>
      <div className="p-4 border-b border-neutral-medium flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-neutral-dark">Flow Preview</h2>
          <p className="text-sm text-neutral-dark/60">Visualize conversation paths</p>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportImage}
            className="text-neutral-dark/70 hover:text-neutral-dark hover:bg-neutral-light mr-1"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-neutral-dark/70 hover:text-neutral-dark hover:bg-neutral-light"
          >
            <Expand className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-neutral-light/50" ref={flowRef}>
        {parsedFlow.steps.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-dark/60">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-neutral-dark/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <p className="mb-2">No conversation flow defined yet</p>
              <p className="text-sm">Add a conversation in the editor to visualize the flow</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.1}
            maxZoom={1.5}
            nodesDraggable={true}
            attributionPosition="bottom-right"
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e0e0e0" gap={16} />
            <Controls />
            <MiniMap nodeColor="#3f51b5" maskColor="rgba(0, 0, 0, 0.05)" />
            <Panel position="top-right" className="bg-white/70 p-2 rounded-md shadow-sm">
              <p className="text-xs text-neutral-dark/70">
                <span className="font-medium">{parsedFlow.steps.length}</span> steps in flow
              </p>
            </Panel>
          </ReactFlow>
        )}
      </div>
      
      <div className="p-4 border-t border-neutral-medium flex justify-between items-center">
        <div className="flex">
          <Button
            variant="secondary"
            size="sm"
            className="mr-2"
            onClick={autoArrangeNodes}
            disabled={parsedFlow.steps.length === 0}
          >
            <WandSparkles className="mr-2 h-4 w-4" /> Auto-Arrange
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={parsedFlow.steps.length === 0}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Nodes
          </Button>
        </div>
        <div className="text-sm text-neutral-dark/60">
          <span className="font-medium">{parsedFlow.steps.length}</span> steps in flow
        </div>
      </div>
    </div>
  );
}

// Helper function to detect step type based on message content
function detectStepType(
  messages: Message[], 
  index: number, 
  totalSteps: number
): string {
  // First step is usually an inquiry
  if (index === 0) return "Customer Inquiry";
  
  // Last step is usually completion or checkout
  if (index === totalSteps - 1) return "Completion";
  
  // Combine all message text for analysis
  const allText = messages.map(msg => msg.text).join(' ').toLowerCase();
  
  // Check for pricing questions
  if (
    allText.includes("price") || 
    allText.includes("cost") ||
    allText.includes("$")
  ) {
    return "Price Inquiry";
  }
  
  // Check for purchase intent
  if (
    allText.includes("buy") || 
    allText.includes("purchase") ||
    allText.includes("get it")
  ) {
    return "Purchase Decision";
  }
  
  // Check for specification gathering
  if (
    allText.includes("need") || 
    allText.includes("want") ||
    allText.includes("requirement") ||
    allText.includes("prefer")
  ) {
    return "Requirement Gathering";
  }
  
  // Default to conversation step
  return "Conversation Step";
}
