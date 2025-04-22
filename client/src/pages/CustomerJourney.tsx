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
  XYPosition,
  Handle, 
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Save, 
  Map, 
  ChevronLeft, 
  ChevronRight,
  MapPin, 
  Users, 
  ShoppingCart, 
  Bot, 
  Repeat, 
  HelpCircle, 
  Brain, 
  Star, 
  Search, 
  Check, 
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import NewFlowDialog from "../components/NewFlowDialog";
import EditableTitle from "../components/EditableTitle";
import NewNodeDialog, { NodeCreationData } from "../components/NewNodeDialog";
import EditNodeDialog from "../components/EditNodeDialog";
import { 
  fetchAllCustomerJourneys, 
  fetchCustomerJourney, 
  createCustomerJourney, 
  updateCustomerJourney, 
  deleteCustomerJourney, 
  deleteAllCustomerJourneys,
  CustomerJourney as CustomerJourneyType
} from "../lib/api";

// Node component with edit functionality
function JourneyNode({ data, id }: any) {
  const { stepType, title, description, onNodeEdit } = data;
  const styles = getStepTypeStyles(stepType);
  
  const handleDoubleClick = () => {
    // Call the onNodeEdit function passed in the node data
    if (onNodeEdit) {
      onNodeEdit(id, { stepType, title, description });
    }
  };
  
  return (
    <div className="journey-node">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-600"
      />
      
      <Card 
        className={`w-64 shadow-md border-2 ${styles.borderColor} ${styles.bg} hover:shadow-lg transition-shadow cursor-pointer`}
        onDoubleClick={handleDoubleClick}
      >
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

// Interface for saved journey data
interface SavedJourney {
  id: string; // The localStorage key
  title: string;
  lastSaved: string;
  preview?: {
    nodeCount: number;
    edgeCount: number;
  };
}

export default function CustomerJourney() {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [journeyTitle, setJourneyTitle] = useState<string>("New Customer Journey");
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [currentJourneyId, setCurrentJourneyId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // State for node editing
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<{
    id: string;
    stepType: string;
    title: string;
    description: string;
  }>({
    id: "",
    stepType: "",
    title: "",
    description: ""
  });
  
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
  
  // Load saved journeys from localStorage
  const loadSavedJourneys = useCallback(() => {
    try {
      const journeys: SavedJourney[] = [];
      
      // Get all keys from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Only include journey keys
        if (key && key.startsWith('journey_')) {
          try {
            const journeyData = JSON.parse(localStorage.getItem(key) || '');
            
            journeys.push({
              id: key,
              title: journeyData.title || 'Untitled Journey',
              lastSaved: journeyData.lastSaved || new Date().toISOString(),
              preview: {
                nodeCount: journeyData.nodes?.length || 0,
                edgeCount: journeyData.edges?.length || 0,
              }
            });
          } catch (e) {
            console.error(`Failed to parse journey data for key ${key}`, e);
          }
        }
      }
      
      // Sort by last saved time, newest first
      journeys.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
      
      setSavedJourneys(journeys);
    } catch (error) {
      console.error("Failed to load saved journeys:", error);
    }
  }, []);
  
  // Load a specific journey
  const loadJourney = useCallback((journeyId: string) => {
    try {
      const journeyData = JSON.parse(localStorage.getItem(journeyId) || '');
      
      if (journeyData) {
        setJourneyTitle(journeyData.title || 'Untitled Journey');
        setNodes(journeyData.nodes || initialNodes);
        setEdges(journeyData.edges || []);
        setCurrentJourneyId(journeyId);
        
        toast({
          title: "Journey Loaded",
          description: `Loaded "${journeyData.title || 'Untitled Journey'}"`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error("Failed to load journey:", error);
      toast({
        title: "Load Failed",
        description: "There was an error loading the journey.",
        variant: "destructive"
      });
    }
  }, [setNodes, setEdges, toast]);
  
  // Delete a saved journey
  const deleteJourney = useCallback((journeyId: string, journeyTitle: string) => {
    try {
      localStorage.removeItem(journeyId);
      loadSavedJourneys(); // Refresh the list
      
      toast({
        title: "Journey Deleted",
        description: `Deleted "${journeyTitle}"`,
        duration: 2000
      });
      
      // If the current journey was deleted, reset to a new journey
      if (journeyId === currentJourneyId) {
        setNodes(initialNodes);
        setEdges([]);
        setJourneyTitle("New Customer Journey");
        setCurrentJourneyId(null);
      }
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the journey.",
        variant: "destructive"
      });
    }
  }, [currentJourneyId, loadSavedJourneys, toast, setNodes, setEdges]);
  
  // Save journey to localStorage
  const saveJourney = useCallback((isAutoSave = true) => {
    try {
      const journeyData = {
        title: journeyTitle,
        nodes,
        edges,
        lastSaved: new Date().toISOString()
      };
      
      // Generate a new ID or use the existing one
      const journeyId = currentJourneyId || `journey_${Date.now()}`;
      
      localStorage.setItem(journeyId, JSON.stringify(journeyData));
      
      // Set the current journey ID
      if (!currentJourneyId) {
        setCurrentJourneyId(journeyId);
      }
      
      // Refresh the journeys list
      loadSavedJourneys();
      
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
  }, [nodes, edges, journeyTitle, currentJourneyId, loadSavedJourneys, toast]);
  
  // Cleanup effect
  useEffect(() => {
    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

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

  // Get a position for a new node
  const getNewNodePosition = (): XYPosition => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 };
    }
    
    // Calculate a position based on the existing nodes
    // Option 1: Continue the flow horizontally from the last node
    const lastNode = nodes[nodes.length - 1];
    return { 
      x: lastNode.position.x + 250, 
      y: lastNode.position.y 
    };
  };
  
  // Create a connection between a new node and the last node in the flow
  const connectToLastNode = (newNodeId: string) => {
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
  
  // Handler to open the edit dialog for a node
  const handleNodeEdit = (nodeId: string, nodeData: any) => {
    setEditingNode({
      id: nodeId,
      stepType: nodeData.stepType,
      title: nodeData.title,
      description: nodeData.description
    });
    setEditDialogOpen(true);
  };
  
  // Update a node's data
  const updateNode = (id: string, data: { stepType: string; title: string; description: string }) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          // Update the node data
          return {
            ...node,
            data: {
              ...node.data,
              stepType: data.stepType,
              title: data.title,
              description: data.description,
              onNodeEdit: handleNodeEdit
            }
          };
        }
        return node;
      })
    );
    
    toast({
      title: "Node Updated",
      description: `Updated "${data.title}" node.`,
      duration: 2000
    });
    
    // Auto-save when a node is updated
    autoSaveChanges();
  };
  
  // Delete a node from the flow
  const deleteNode = (id: string) => {
    // Find the node to get its title for the toast message
    const nodeToDelete = nodes.find(node => node.id === id);
    const nodeTitle = nodeToDelete?.data?.title || "Node";
    
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== id));
    
    // Remove any edges connected to the node
    setEdges((eds) => 
      eds.filter((edge) => edge.source !== id && edge.target !== id)
    );
    
    toast({
      title: "Node Deleted",
      description: `Deleted "${nodeTitle}" node from the flow.`,
      duration: 2000
    });
    
    // Auto-save after deleting a node
    autoSaveChanges();
  };
  
  // Add a custom node with specified characteristics
  const addCustomNode = (nodeData: NodeCreationData) => {
    const newNodeId = `node_${Date.now()}`;
    const position = getNewNodePosition();
    
    const newNode: Node = {
      id: newNodeId,
      type: 'journeyNode',
      data: { 
        stepType: nodeData.stepType,
        title: nodeData.title,
        description: nodeData.description,
        onNodeEdit: handleNodeEdit // Pass the edit handler to the node
      },
      position
    };
    
    setNodes((nds) => [...nds, newNode]);
    connectToLastNode(newNodeId);
    
    toast({
      title: "Node Added",
      description: `Added "${nodeData.title}" node to the journey.`,
      duration: 2000
    });
    
    // Auto-save when a node is added
    autoSaveChanges();
  };
  
  // Add a quick node to the journey (for quick-add buttons)
  const addNode = (type: string) => {
    const newNodeId = `node_${Date.now()}`;
    const position = getNewNodePosition();
    
    const newNode: Node = {
      id: newNodeId,
      type: 'journeyNode',
      data: { 
        stepType: type,
        title: `${type} Node`,
        description: `Description for ${type.toLowerCase()} node`,
        onNodeEdit: handleNodeEdit // Pass the edit handler to the node
      },
      position
    };
    
    setNodes((nds) => [...nds, newNode]);
    connectToLastNode(newNodeId);
    
    toast({
      title: "Node Added",
      description: `Added quick "${type}" node to the journey.`,
      duration: 2000
    });
    
    // Auto-save when a node is added
    autoSaveChanges();
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
            description: 'Customer discovers product/service',
            onNodeEdit: handleNodeEdit
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

  // Load saved journeys on component mount
  useEffect(() => {
    loadSavedJourneys();
  }, [loadSavedJourneys]);

  // Update all nodes to include the onNodeEdit callback
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onNodeEdit: handleNodeEdit
        }
      }))
    );
  }, []);

  // Format date/time for display
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Node Edit Dialog */}
      <EditNodeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nodeData={editingNode}
        onUpdate={updateNode}
        onDelete={deleteNode}
      />

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
              setCurrentJourneyId(null);
              setJourneyTitle("New Customer Journey");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
          
          <Button 
            variant="destructive"
            onClick={() => {
              // Find all journey keys in localStorage
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('journey_')) {
                  keysToRemove.push(key);
                }
              }
              
              // Remove all journey entries
              keysToRemove.forEach(key => {
                localStorage.removeItem(key);
              });
              
              // Reset current journey
              setNodes(initialNodes);
              setEdges([]);
              setCurrentJourneyId(null);
              setJourneyTitle("New Customer Journey");
              
              // Refresh the journeys list
              loadSavedJourneys();
              
              toast({
                title: "All Journeys Purged",
                description: `Removed ${keysToRemove.length} saved journeys from storage.`,
                duration: 2000
              });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Purge All Journeys
          </Button>
          
          <Button onClick={() => saveJourney(false)}>
            <Save className="mr-2 h-4 w-4" />
            Save Journey
          </Button>
        </div>
      </div>
    
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar for saved journeys */}
        <div className={`border-r bg-background transition-all duration-300 overflow-y-auto ${sidebarOpen ? 'w-80' : 'w-0'}`}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Saved Journeys</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
            
            {savedJourneys.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <p>No saved journeys yet.</p>
                <p className="text-sm mt-2">Create and save a journey to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJourneys.map((journey) => (
                  <div 
                    key={journey.id} 
                    className={`border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors ${currentJourneyId === journey.id ? 'bg-primary/10 border-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 
                        className="font-medium truncate w-44"
                        onClick={() => loadJourney(journey.id)}
                      >
                        {journey.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${journey.title}"?`)) {
                            deleteJourney(journey.id, journey.title);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last modified: {formatDateTime(journey.lastSaved)}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {journey.preview?.nodeCount || 0} nodes
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {journey.preview?.edgeCount || 0} connections
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Toggle sidebar button - appears when sidebar is closed */}
        {!sidebarOpen && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-20 left-0 z-10 h-8 rounded-r-full rounded-l-none bg-background border border-l-0"
          >
            <ChevronRight size={16} />
          </Button>
        )}
        
        {/* Main flow area */}
        <div className="flex-1">
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
            
            <Panel position="bottom-center" className="bg-background/80 backdrop-blur-sm p-2 rounded-t-lg shadow-md">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium mb-1">Quick Add</div>
                  <NewNodeDialog onCreateNode={addCustomNode} />
                </div>
                <div className="flex flex-wrap gap-2">
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
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}