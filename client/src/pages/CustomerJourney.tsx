import { useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
  Edge,
  Node,
  Connection,
  addEdge,
  MarkerType,
  ConnectionLineType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JourneyNode from "@/components/JourneyNode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define custom node types
const nodeTypes: NodeTypes = {
  journeyNode: JourneyNode
};

// Initial nodes - when we start with an empty journey
const initialNodes: Node[] = [
  {
    id: 'entry',
    type: 'journeyNode',
    data: { 
      stepType: 'Entry Point',
      title: 'Journey Start',
      description: 'Customer begins their journey'
    },
    position: { x: 100, y: 100 }
  }
];

export default function CustomerJourney() {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Handle new connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Create edge with animated line
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#2563eb' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2563eb',
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Add a new node to the journey
  const addNode = (type: string) => {
    const newNodeId = `node_${nodes.length + 1}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'journeyNode',
      data: { 
        stepType: type,
        title: `${type} Node`,
        description: `Description for ${type.toLowerCase()} node`
      },
      position: { 
        x: nodes.length > 0 ? nodes[nodes.length - 1].position.x + 250 : 100,
        y: nodes.length > 0 ? nodes[nodes.length - 1].position.y : 100
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
    
    // If there's at least one other node, connect to the last one
    if (nodes.length > 0) {
      const lastNodeId = nodes[nodes.length - 1].id;
      setEdges((eds) => 
        addEdge(
          {
            id: `e${lastNodeId}-${newNodeId}`,
            source: lastNodeId,
            target: newNodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#2563eb' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2563eb',
            },
          },
          eds
        )
      );
    }
  };

  // Template selection handler
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    
    if (value === 'sales') {
      // Create a sales journey template
      const salesNodes: Node[] = [
        {
          id: 'entry',
          type: 'journeyNode',
          data: { 
            stepType: 'Entry Point',
            title: 'Awareness',
            description: 'Customer discovers product/service'
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'research',
          type: 'journeyNode',
          data: { 
            stepType: 'Research',
            title: 'Research',
            description: 'Customer researches options'
          },
          position: { x: 350, y: 100 }
        },
        {
          id: 'evaluation',
          type: 'journeyNode',
          data: { 
            stepType: 'Evaluation',
            title: 'Evaluation',
            description: 'Customer evaluates different options'
          },
          position: { x: 600, y: 100 }
        },
        {
          id: 'decision',
          type: 'journeyNode',
          data: { 
            stepType: 'Decision',
            title: 'Decision',
            description: 'Customer makes purchase decision'
          },
          position: { x: 850, y: 100 }
        },
        {
          id: 'purchase',
          type: 'journeyNode',
          data: { 
            stepType: 'Purchase',
            title: 'Purchase',
            description: 'Customer completes purchase'
          },
          position: { x: 1100, y: 100 }
        }
      ];
      
      const salesEdges: Edge[] = [
        {
          id: 'e1',
          source: 'entry',
          target: 'research',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        },
        {
          id: 'e2',
          source: 'research',
          target: 'evaluation',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        },
        {
          id: 'e3',
          source: 'evaluation',
          target: 'decision',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        },
        {
          id: 'e4',
          source: 'decision',
          target: 'purchase',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        }
      ];
      
      setNodes(salesNodes);
      setEdges(salesEdges);
      
      toast({
        title: "Sales Journey Template Loaded",
        description: "A basic sales journey template has been loaded."
      });
    } 
    else if (value === 'support') {
      // Create a support journey template
      const supportNodes: Node[] = [
        {
          id: 'entry',
          type: 'journeyNode',
          data: { 
            stepType: 'Entry Point',
            title: 'Issue Occurs',
            description: 'Customer experiences a problem'
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'contact',
          type: 'journeyNode',
          data: { 
            stepType: 'Contact',
            title: 'Support Contact',
            description: 'Customer reaches out for support'
          },
          position: { x: 350, y: 100 }
        },
        {
          id: 'identification',
          type: 'journeyNode',
          data: { 
            stepType: 'Identification',
            title: 'Issue Identification',
            description: 'Customer issue is identified'
          },
          position: { x: 600, y: 100 }
        },
        {
          id: 'resolution',
          type: 'journeyNode',
          data: { 
            stepType: 'Resolution',
            title: 'Issue Resolution',
            description: 'Customer issue is resolved'
          },
          position: { x: 850, y: 100 }
        },
        {
          id: 'followup',
          type: 'journeyNode',
          data: { 
            stepType: 'Follow-up',
            title: 'Follow-up',
            description: 'Agent follows up on resolution'
          },
          position: { x: 1100, y: 100 }
        }
      ];
      
      const supportEdges: Edge[] = [
        {
          id: 'e1',
          source: 'entry',
          target: 'contact',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        },
        {
          id: 'e2',
          source: 'contact',
          target: 'identification',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        },
        {
          id: 'e3',
          source: 'identification',
          target: 'resolution',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        },
        {
          id: 'e4',
          source: 'resolution',
          target: 'followup',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2563eb' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2563eb',
          }
        }
      ];
      
      setNodes(supportNodes);
      setEdges(supportEdges);
      
      toast({
        title: "Support Journey Template Loaded",
        description: "A basic support journey template has been loaded."
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-background p-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6" />
            Customer Journey Design
          </h1>
          <p className="text-muted-foreground">Design AI-powered customer interaction flows</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-[200px]">
            <Select onValueChange={handleTemplateChange} value={selectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Journey</SelectItem>
                <SelectItem value="support">Support Journey</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              setNodes(initialNodes);
              setEdges([]);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
          
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Journey
          </Button>
        </div>
      </div>
    
      <div className="flex-1 w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionLineStyle={{ stroke: '#2563eb' }}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
        >
          <Controls />
          <MiniMap nodeBorderRadius={2} />
          <Background size={1} gap={16} color="#f1f5f9" />
          
          <Panel position="bottom-center" className="bg-background/80 backdrop-blur-sm p-2 rounded-t-lg shadow-md">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addNode('Awareness')}>
                <Plus className="mr-1 h-3 w-3" />
                Awareness
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('Research')}>
                <Plus className="mr-1 h-3 w-3" />
                Research
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('Consideration')}>
                <Plus className="mr-1 h-3 w-3" />
                Consideration
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('Decision')}>
                <Plus className="mr-1 h-3 w-3" />
                Decision
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('Purchase')}>
                <Plus className="mr-1 h-3 w-3" />
                Purchase
              </Button>
              <Button size="sm" variant="outline" onClick={() => addNode('Support')}>
                <Plus className="mr-1 h-3 w-3" />
                Support
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}