import { useState, useCallback, useEffect } from "react";
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
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  PanelPosition
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Trash2, Save, Map, Edit, Settings, LayoutGrid, 
  PanelRight, RotateCw, Minus, Copy, Scissors, FileEdit, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import NewFlowDialog from "../components/NewFlowDialog";
import EditableTitle from "../components/EditableTitle";

// Import our custom node component
import { Handle, Position } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, ShoppingCart, Bot, Repeat, HelpCircle, Brain, Star, Search, Check } from 'lucide-react';

// Node component (inlined to fix import issues)
function JourneyNode({ data }: any) {
  const { stepType, title, description } = data;
  const styles = getStepTypeStyles(stepType);
  
  return (
    <div className="journey-node">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-600"
      />
      
      <Card className={`w-64 shadow-md border-2 ${styles.borderColor} ${styles.bg}`}>
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className={`px-2 py-1 ${styles.text} font-medium flex items-center gap-1`}>
              {styles.icon}
              <span>{stepType}</span>
            </Badge>
          </div>
          <CardTitle className={`text-lg mt-2 ${styles.text}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-600"
      />
    </div>
  );
}

// Get appropriate icon and style for each step type
function getStepTypeStyles(stepType: string): { 
  bg: string, 
  text: string, 
  borderColor: string,
  icon: JSX.Element 
} {
  const normalizedType = stepType.toLowerCase();
  
  if (normalizedType.includes('entry') || normalizedType.includes('awareness')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: <MapPin className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('research')) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: <Search className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('evaluation') || normalizedType.includes('consideration')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      borderColor: 'border-amber-200',
      icon: <Brain className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('decision')) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      borderColor: 'border-orange-200',
      icon: <Star className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('purchase')) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <ShoppingCart className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('contact') || normalizedType.includes('support')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: <HelpCircle className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('identification')) {
    return {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      borderColor: 'border-cyan-200',
      icon: <Bot className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('resolution')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      icon: <Check className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('follow')) {
    return {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      borderColor: 'border-pink-200',
      icon: <Repeat className="h-4 w-4" />
    };
  }
  
  // Default
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: <Users className="h-4 w-4" />
  };
}

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

// Node Edit Dialog component
function NodeEditDialog({
  open,
  onOpenChange,
  node,
  formData,
  setFormData,
  onSave,
  onDelete,
  onDuplicate
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: Node | null;
  formData: { title: string; stepType: string; description: string };
  setFormData: (data: { title: string; stepType: string; description: string }) => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const stepTypes = [
    "Entry Point", "Awareness", "Research", "Consideration", 
    "Evaluation", "Decision", "Purchase", "Support", 
    "Contact", "Identification", "Resolution", "Follow-up"
  ];
  
  if (!node) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nodeType" className="text-right">
              Type
            </Label>
            <Select 
              value={formData.stepType} 
              onValueChange={(value) => setFormData({ ...formData, stepType: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a node type" />
              </SelectTrigger>
              <SelectContent>
                {stepTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nodeTitle" className="text-right">
              Title
            </Label>
            <Input
              id="nodeTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nodeDescription" className="text-right">
              Description
            </Label>
            <Textarea
              id="nodeDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <Separator />
        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
          <Button onClick={onSave} type="submit">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerJourney() {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [journeyTitle, setJourneyTitle] = useState<string>("New Customer Journey");
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [nodeFormData, setNodeFormData] = useState<{
    title: string;
    stepType: string;
    description: string;
  }>({ title: '', stepType: '', description: '' });
  
  // Auto-save functionality
  const autoSaveChanges = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set a new timeout to save after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      saveJourney();
    }, 5000);
    
    setSaveTimeout(timeout);
  }, [saveTimeout, nodes, edges]);
  
  // Save journey to localStorage for now
  const saveJourney = useCallback((isAutoSave = true) => {
    try {
      const journeyData = {
        title: journeyTitle,
        nodes,
        edges,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(`journey_${Date.now()}`, JSON.stringify(journeyData));
      
      // Only show toast for manual saves or first auto-save
      if (!isAutoSave) {
        toast({
          title: "Journey Saved",
          description: "Your journey has been saved successfully.",
          duration: 3000
        });
      } else {
        console.log("Auto-saved journey at", new Date().toISOString());
      }
    } catch (error) {
      console.error("Failed to save journey:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your journey.",
        variant: "destructive"
      });
    }
  }, [nodes, edges, journeyTitle, toast]);
  
  // Cleanup effect
  useEffect(() => {
    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);
  
  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    
    // Load node data into form
    if (node.data) {
      setNodeFormData({
        title: node.data.title || '',
        stepType: node.data.stepType || '',
        description: node.data.description || ''
      });
    }
    
    // Open the edit dialog
    setIsEditDialogOpen(true);
  }, []);
  
  // Update node data
  const updateNodeData = useCallback(() => {
    if (!selectedNode) return;
    
    const updatedNodes = nodes.map(node => {
      if (node.id === selectedNode.id) {
        // Create a new node object with the updated data
        return {
          ...node,
          data: {
            ...node.data,
            title: nodeFormData.title,
            stepType: nodeFormData.stepType,
            description: nodeFormData.description
          }
        };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    autoSaveChanges();
    
    toast({
      title: "Node Updated",
      description: "Node data has been updated.",
      duration: 2000
    });
  }, [selectedNode, nodes, nodeFormData, setNodes, autoSaveChanges, toast]);
  
  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    
    // Remove node
    setNodes(nodes.filter(node => node.id !== selectedNode.id));
    
    // Remove any connected edges
    setEdges(edges.filter(edge => 
      edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ));
    
    // Close the edit dialog
    setIsEditDialogOpen(false);
    setSelectedNode(null);
    
    toast({
      title: "Node Deleted",
      description: "Node has been removed from the journey.",
      duration: 2000
    });
    
    autoSaveChanges();
  }, [selectedNode, nodes, edges, setNodes, setEdges, autoSaveChanges, toast]);
  
  // Duplicate selected node
  const duplicateNode = useCallback(() => {
    if (!selectedNode) return;
    
    const newNodeId = `node_${Date.now()}`;
    const newNode: Node = {
      ...selectedNode,
      id: newNodeId,
      position: {
        x: selectedNode.position.x + 20,
        y: selectedNode.position.y + 20
      }
    };
    
    setNodes(nodes => [...nodes, newNode]);
    
    toast({
      title: "Node Duplicated",
      description: "A copy of the node has been created.",
      duration: 2000
    });
    
    autoSaveChanges();
  }, [selectedNode, setNodes, autoSaveChanges, toast]);
  
  // Add node from right toolbar
  const addNodeFromToolbar = useCallback((type: string) => {
    // Get viewport center - fallback to center if viewport info not available
    const centerX = window.innerWidth / 2 - 200; // Adjust for panel width
    const centerY = window.innerHeight / 2;
    
    const newNodeId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'journeyNode',
      data: { 
        stepType: type,
        title: `${type} Node`,
        description: `Description for ${type.toLowerCase()} node`
      },
      position: { x: centerX, y: centerY }
    };
    
    setNodes(nodes => [...nodes, newNode]);
    
    toast({
      title: "Node Added",
      description: `Added new ${type} node to the journey.`,
      duration: 2000
    });
    
    autoSaveChanges();
  }, [setNodes, autoSaveChanges, toast]);

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

  // Handler for updating the journey title
  const handleTitleUpdate = (newTitle: string) => {
    setJourneyTitle(newTitle);
    
    toast({
      title: "Title Updated",
      description: "Journey title has been updated.",
      duration: 2000
    });
    
    // Auto-save when title changes
    autoSaveChanges();
  };
  
  // Handler for creating a new flow
  const handleCreateFlow = (flowName: string, templateType: string | null) => {
    // Set the journey title
    setJourneyTitle(flowName);
    
    // Clear current flow
    setNodes(initialNodes);
    setEdges([]);
    
    // If a template was selected, load it
    if (templateType) {
      handleTemplateChange(templateType);
    }
    
    toast({
      title: "New Journey Created",
      description: `Created new journey: ${flowName}`,
      duration: 3000
    });
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

  // Create a flow component to use useReactFlow hook
  function Flow() {
    const reactFlowInstance = useReactFlow();
    
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          autoSaveChanges();
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          autoSaveChanges();
        }}
        onConnect={(params) => {
          onConnect(params);
          autoSaveChanges();
        }}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineStyle={{ stroke: '#2563eb' }}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Controls />
        <MiniMap nodeBorderRadius={2} />
        <Background size={1} gap={16} color="#f1f5f9" />
        
        {/* Journey Title Panel - Positioned at the top */}
        <Panel position="top-center" className="bg-background/80 backdrop-blur-sm p-2 rounded-b-lg shadow-md mt-2">
          <EditableTitle 
            title={journeyTitle} 
            onSave={handleTitleUpdate} 
            className="min-w-[200px]"
          />
        </Panel>
        
        {/* Right side toolbar */}
        <Panel position="top-right" className="bg-background/80 backdrop-blur-sm p-2 rounded-l-lg shadow-md mr-2 my-10">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold mb-2 text-center">Add Node</h3>
            
            <Button size="sm" variant="outline" onClick={() => addNodeFromToolbar('Awareness')} title="Add Awareness Node">
              <Plus className="mr-1 h-3 w-3" />
              Awareness
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => addNodeFromToolbar('Research')} title="Add Research Node">
              <Plus className="mr-1 h-3 w-3" />
              Research
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => addNodeFromToolbar('Consideration')} title="Add Consideration Node">
              <Plus className="mr-1 h-3 w-3" />
              Consideration
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => addNodeFromToolbar('Decision')} title="Add Decision Node">
              <Plus className="mr-1 h-3 w-3" />
              Decision
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => addNodeFromToolbar('Purchase')} title="Add Purchase Node">
              <Plus className="mr-1 h-3 w-3" />
              Purchase
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => addNodeFromToolbar('Support')} title="Add Support Node">
              <Plus className="mr-1 h-3 w-3" />
              Support
            </Button>
            
            {selectedNode && (
              <>
                <div className="border-t my-2 pt-2">
                  <h3 className="text-sm font-semibold mb-2 text-center">Edit Node</h3>
                </div>
                
                <Button size="sm" variant="outline" onClick={() => duplicateNode()} title="Duplicate Selected Node">
                  <Copy className="mr-1 h-3 w-3" />
                  Duplicate
                </Button>
                
                <Button size="sm" variant="destructive" onClick={() => deleteSelectedNode()} title="Delete Selected Node">
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </Panel>
        
        {/* Bottom toolbar */}
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
    );
  }

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
          <NewFlowDialog onCreateFlow={handleCreateFlow} />
          
          <Button
            variant="outline"
            onClick={() => {
              setNodes(initialNodes);
              setEdges([]);
              setSelectedNode(null);
              setIsEditDialogOpen(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
          
          <Button onClick={() => saveJourney(false)}>
            <Save className="mr-2 h-4 w-4" />
            Save Journey
          </Button>
        </div>
      </div>
    
      <div className="flex-1 w-full">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
      
      {/* Node Editor Dialog */}
      <NodeEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        node={selectedNode}
        formData={nodeFormData}
        setFormData={setNodeFormData}
        onSave={() => {
          updateNodeData();
          setIsEditDialogOpen(false);
        }}
        onDelete={() => {
          deleteSelectedNode();
          setIsEditDialogOpen(false);
        }}
        onDuplicate={() => {
          duplicateNode();
          setIsEditDialogOpen(false);
        }}
      />
    </div>
  );
}