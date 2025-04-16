import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  NodeChange,
  applyNodeChanges,
  XYPosition,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { UseCase, ParsedFlow, Message } from "@shared/schema";
import { Expand, Download, WandSparkles, Edit, Save, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FlowNode from "./FlowNode";
import { toPng } from 'html-to-image';
import { Pagination } from "@/components/ui/pagination";
import { PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface FlowPreviewProps {
  useCase: UseCase;
  parsedFlow: ParsedFlow;
}

// Define node types
const nodeTypes = {
  flowNode: FlowNode,
};

// Constants for pagination and page layout
// These dimensions approximate a standard US Letter page in portrait mode (8.5" x 11")
// Scaled to fit the flow preview area
const PAGE_HEIGHT = 1100; // Height in pixels
const PAGE_WIDTH = 850;   // Width in pixels
const NODES_PER_PAGE = 3; // Default nodes per page (can be adjusted based on node sizes)

export default function FlowPreview({ useCase, parsedFlow }: FlowPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // State to keep track of saved node positions
  const [savedPositions, setSavedPositions] = useState<Record<string, XYPosition>>({});
  // State to store and manage the actual nodes
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Create edges to connect all nodes
  const allEdges = useMemo(() => {
    return parsedFlow.steps.slice(0, -1).map((_, index) => ({
      id: `edge-${index}`,
      source: `node-${index}`,
      target: `node-${index + 1}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3f51b5', strokeWidth: 2 },
    }));
  }, [parsedFlow.steps]);
  
  // Track visible edges
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>([]);
  
  // Calculate total pages based on node count
  useEffect(() => {
    if (parsedFlow.steps.length === 0) {
      setTotalPages(1);
      return;
    }
    
    const pages = Math.ceil(parsedFlow.steps.length / NODES_PER_PAGE);
    setTotalPages(pages);
    
    // Reset to page 1 if current page is beyond the new total
    if (currentPage > pages) {
      setCurrentPage(1);
    }
  }, [parsedFlow.steps.length, currentPage]);
  
  // Initialize or update nodes from the parsed flow data with pagination
  useEffect(() => {
    if (parsedFlow.steps.length === 0) {
      setFlowNodes([]);
      setVisibleEdges([]);
      return;
    }
    
    // Create all nodes, but will only display those on the current page
    const horizontalOffset = 80; // Offset for zigzag pattern
    const allNodes = parsedFlow.steps.map((step, globalIndex) => {
      const nodeId = `node-${globalIndex}`;
      const pageNumber = Math.floor(globalIndex / NODES_PER_PAGE) + 1;
      const indexOnPage = globalIndex % NODES_PER_PAGE;
      
      // Use saved position if available, otherwise position by page and index
      let position: XYPosition;
      
      if (savedPositions[nodeId]) {
        // Use saved position but adjust y-coordinate for current page
        position = { 
          ...savedPositions[nodeId],
          // Adjust y-coordinate if node is on a different page
          y: pageNumber === currentPage 
            ? savedPositions[nodeId].y 
            : savedPositions[nodeId].y + ((pageNumber - currentPage) * PAGE_HEIGHT)
        };
      } else {
        // Use default position based on index on page
        position = {
          x: indexOnPage % 2 === 0 ? 150 : 150 + horizontalOffset,
          y: 100 + (indexOnPage * 320) // Vertical spacing within a page
          // Add vertical offset based on page difference
          + ((pageNumber - currentPage) * PAGE_HEIGHT)
        };
      }
      
      // Only nodes on the current page or connecting pages (for edge connections)
      const isOnCurrentPage = pageNumber === currentPage;
      const isOnAdjacentPage = pageNumber === currentPage + 1 && indexOnPage === 0; // First node on next page
      
      // For connecting nodes between pages, add a visual indicator
      let nodeStyle = {};
      let nodeClassName = '';
      
      if (isOnAdjacentPage) {
        // This is a continuation node that connects to the previous page
        nodeClassName = 'connecting-node';
        nodeStyle = { opacity: 0.7 };
      }
      
      return {
        id: nodeId,
        type: 'flowNode',
        position,
        data: { 
          step, 
          stepNumber: globalIndex + 1,
          stepType: step.stepType,
          isConnector: isOnAdjacentPage
        },
        // Show nodes on current page, plus first node of next page (if any)
        hidden: !(isOnCurrentPage || isOnAdjacentPage),
        className: nodeClassName,
        style: nodeStyle,
      };
    });
    
    setFlowNodes(allNodes);
    
    // Filter edges to show only those between visible nodes
    const startIdx = (currentPage - 1) * NODES_PER_PAGE;
    const endIdx = startIdx + NODES_PER_PAGE;
    
    // Include edges for current page plus connector edge to next page
    const filteredEdges = allEdges.filter((edge) => {
      const sourceIndex = parseInt(edge.source.split('-')[1]);
      return sourceIndex >= startIdx && sourceIndex < endIdx;
    });
    
    setVisibleEdges(filteredEdges);
  }, [parsedFlow.steps, savedPositions, currentPage, allEdges]);
  
  // Handler for node changes (dragging)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Apply changes to the nodes
    setFlowNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
    
    // Update saved positions for any moved nodes
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        setSavedPositions(prev => ({
          ...prev,
          [change.id]: change.position as XYPosition
        }));
      }
    });
  }, []);

  // Auto-arrange nodes in a better layout
  const autoArrangeNodes = useCallback(() => {
    if (flowNodes.length === 0) return;
    
    // Reset saved positions
    setSavedPositions({});
    
    // Toast to indicate action was taken
    toast({
      title: "Arranging Flow",
      description: "Flow nodes have been reset to their default positions",
    });
  }, [flowNodes, toast]);

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
          <>
            {/* Page indicator overlay */}
            <div className="absolute top-2 left-2 z-10 bg-white/90 py-1 px-3 rounded-md shadow-sm flex items-center text-sm">
              <FileText className="h-4 w-4 mr-2 text-neutral-dark/70" />
              <span className="font-medium">Page {currentPage} of {totalPages}</span>
            </div>
            
            <ReactFlow
              nodes={flowNodes}
              edges={visibleEdges} // Use filtered edges for current page
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.1}
              maxZoom={1.5}
              nodesDraggable={true}
              attributionPosition="bottom-right"
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              proOptions={{ hideAttribution: true }}
            >
              {/* Page boundary indicator */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                <rect 
                  x="20" 
                  y="20" 
                  width={PAGE_WIDTH - 40} 
                  height={PAGE_HEIGHT - 40}
                  fill="none" 
                  stroke="#e0e0e0" 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                  rx="5"
                  ry="5"
                />
              </svg>
              <Background color="#e0e0e0" gap={16} />
              <Controls />
              <MiniMap nodeColor="#3f51b5" maskColor="rgba(0, 0, 0, 0.05)" />
              <Panel position="top-right" className="bg-white/70 p-2 rounded-md shadow-sm">
                <p className="text-xs text-neutral-dark/70">
                  <span className="font-medium">{parsedFlow.steps.length}</span> steps in flow
                </p>
              </Panel>
            </ReactFlow>
          </>
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
            className="mr-2"
            disabled={parsedFlow.steps.length === 0}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Nodes
          </Button>
        </div>
        
        {totalPages > 1 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous 
                </Button>
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : (
          <div className="text-sm text-neutral-dark/60">
            <span className="font-medium">{parsedFlow.steps.length}</span> steps in flow
          </div>
        )}
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