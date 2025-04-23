import { useState, useCallback, useEffect, useRef } from "react";
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
  Position,
  Handle
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
  Users, 
  Loader2,
  Info,
  MapPin,
  ShoppingCart,
  Bot,
  Repeat,
  HelpCircle,
  Brain,
  Star,
  Search,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NewFlowDialog from "../components/NewFlowDialog";
import EditableTitle from "../components/EditableTitle";
import NewNodeDialog, { NodeCreationData } from "../components/NewNodeDialog";
import EditNodeDialog from "../components/EditNodeDialog";
import JourneyMetadataDialog from "../components/JourneyMetadataDialog";
import AISummaryDialog from "../components/AISummaryDialog";
import JourneyNode from "../components/JourneyNode";
import MultiPathNode from "../components/MultiPathNode";
import { 
  fetchAllCustomerJourneys, 
  fetchCustomerJourney, 
  createCustomerJourney, 
  updateCustomerJourney, 
  deleteCustomerJourney, 
  deleteAllCustomerJourneys,
  CustomerJourney as CustomerJourneyType,
  getCustomerJourneys,
  generateJourneySummary,
  generateAIJourney,
  getAllCustomers,
  Customer
} from "../lib/api";

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
      icon: <Star className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('purchase') || normalizedType.includes('conversion')) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <ShoppingCart className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('decision')) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      borderColor: 'border-orange-200',
      icon: <Brain className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('support') || normalizedType.includes('service')) {
    return {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      borderColor: 'border-teal-200',
      icon: <HelpCircle className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('retention') || normalizedType.includes('loyalty')) {
    return {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      borderColor: 'border-pink-200',
      icon: <Repeat className="h-4 w-4" />
    };
  }
  
  // Default style
  return {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: <MapPin className="h-4 w-4" />
  };
}

// Define custom node types
const nodeTypes: NodeTypes = {
  journeyNode: JourneyNode,
  multiPathNode: MultiPathNode,
};

// Initial nodes for a new journey
const initialNodes: Node[] = [];

export default function CustomerJourney() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const { 
    data: allJourneys,
    isLoading: isLoadingJourneys,
    isError: isJourneysError,
    error: journeysError
  } = useQuery({
    queryKey: ['/api/customer-journeys'],
    queryFn: getCustomerJourneys
  });
  
  const { 
    data: customersData,
    isLoading: isLoadingCustomers
  } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: getAllCustomers
  });
  
  // Mutations
  const createJourneyMutation = useMutation({
    mutationFn: createCustomerJourney,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
      setCurrentJourneyId(data.id);
      toast({
        title: "Journey Created",
        description: "Your new customer journey has been created.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create journey",
        variant: "destructive"
      });
    }
  });
  
  const updateJourneyMutation = useMutation({
    mutationFn: updateCustomerJourney,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
      toast({
        title: "Journey Saved",
        description: "Your customer journey has been saved.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update journey",
        variant: "destructive"
      });
    }
  });
  
  const deleteJourneyMutation = useMutation({
    mutationFn: deleteCustomerJourney,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete journey",
        variant: "destructive"
      });
    }
  });
  
  const deleteAllJourneysMutation = useMutation({
    mutationFn: deleteAllCustomerJourneys,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
      toast({
        title: "All Journeys Deleted",
        description: "All customer journeys have been deleted.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete all journeys",
        variant: "destructive"
      });
    }
  });
  
  // State for the flow editor
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // General state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [journeyTitle, setJourneyTitle] = useState("New Customer Journey");
  const [currentJourneyId, setCurrentJourneyId] = useState<number | null>(null);
  const [journeyMetadata, setJourneyMetadata] = useState({
    customerName: "",
    workflowIntent: "",
    notes: "",
    summary: ""
  });
  
  // Dialog states
  const [newFlowDialogOpen, setNewFlowDialogOpen] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [newNodeDialogOpen, setNewNodeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  
  // State for node editing
  const [editingNode, setEditingNode] = useState<{
    id: string;
    stepType: string;
    title: string;
    description: string;
    outputPaths?: number;
  } | null>(null);
  
  // State for AI generation
  const [isGeneratingAIJourney, setIsGeneratingAIJourney] = useState(false);
  
  // Computed values
  const isLoading = createJourneyMutation.isPending || updateJourneyMutation.isPending;
  const savedJourneys = allJourneys || [];
  
  // Create stable function references with useRef to prevent circular dependencies
  const handleNodeEditStable = useRef<(id: string, data: any) => void>((id, data) => {
    setEditingNode({
      id,
      stepType: data.stepType,
      title: data.title,
      description: data.description,
      outputPaths: data.outputPaths
    });
    setEditDialogOpen(true);
  }).current;
  
  // Auto-save changes with debounce
  const autoSaveChanges = useCallback(() => {
    if (currentJourneyId && nodes.length > 0) {
      // Prepare a preview of the journey with node and edge counts
      const preview = {
        nodeCount: nodes.length,
        edgeCount: edges.length
      };
      
      // Update the journey in the database
      updateJourneyMutation.mutate({
        id: currentJourneyId,
        title: journeyTitle,
        customerName: journeyMetadata.customerName || undefined,
        workflowIntent: journeyMetadata.workflowIntent || undefined,
        notes: journeyMetadata.notes || undefined,
        summary: journeyMetadata.summary || undefined,
        nodes,
        edges,
        preview
      });
    }
  }, [
    currentJourneyId, 
    nodes, 
    edges, 
    journeyTitle, 
    journeyMetadata, 
    updateJourneyMutation
  ]);
  
  // Function to save the current journey
  const saveJourney = (showToast = true) => {
    if (currentJourneyId) {
      // Update existing journey
      const preview = {
        nodeCount: nodes.length,
        edgeCount: edges.length
      };
      
      updateJourneyMutation.mutate({
        id: currentJourneyId,
        title: journeyTitle,
        customerName: journeyMetadata.customerName || undefined,
        workflowIntent: journeyMetadata.workflowIntent || undefined,
        notes: journeyMetadata.notes || undefined,
        summary: journeyMetadata.summary || undefined,
        nodes,
        edges,
        preview
      });
    } else {
      // Create new journey
      const preview = {
        nodeCount: nodes.length,
        edgeCount: edges.length
      };
      
      createJourneyMutation.mutate({
        title: journeyTitle,
        customerName: journeyMetadata.customerName || undefined,
        workflowIntent: journeyMetadata.workflowIntent || undefined,
        notes: journeyMetadata.notes || undefined,
        summary: journeyMetadata.summary || undefined,
        nodes,
        edges,
        preview
      });
    }
    
    if (showToast) {
      toast({
        title: "Journey Saved",
        description: "Your customer journey has been saved.",
        duration: 3000
      });
    }
  };
  
  // Function to load a journey
  const loadJourney = async (id: number) => {
    try {
      const journey = await fetchCustomerJourney(id);
      
      // Set the journey data
      setCurrentJourneyId(id);
      setJourneyTitle(journey.title);
      setNodes(journey.nodes);
      setEdges(journey.edges);
      
      // Set metadata
      setJourneyMetadata({
        customerName: journey.customerName || "",
        workflowIntent: journey.workflowIntent || "",
        notes: journey.notes || "",
        summary: journey.summary || ""
      });
      
      toast({
        title: "Journey Loaded",
        description: `Loaded "${journey.title}" journey.`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load journey",
        variant: "destructive"
      });
    }
  };
  
  // Function to delete a journey
  const deleteJourney = (id: number, title: string) => {
    deleteJourneyMutation.mutate(id, {
      onSuccess: () => {
        // If we're currently viewing this journey, reset the editor
        if (currentJourneyId === id) {
          setCurrentJourneyId(null);
          setJourneyTitle("New Customer Journey");
          setNodes(initialNodes);
          setEdges([]);
          
          // Don't reset customer when deleting a journey
          setJourneyMetadata({
            customerName: journeyMetadata.customerName, // Preserve customer name
            workflowIntent: "",
            notes: "",
            summary: ""
          });
        }
        
        toast({
          title: "Journey Deleted",
          description: `"${title}" has been deleted.`,
          duration: 3000
        });
      }
    });
  };
  
  // Function to update the journey title
  const handleTitleUpdate = (newTitle: string) => {
    setJourneyTitle(newTitle);
    
    // Auto-save when the title is updated
    if (currentJourneyId) {
      autoSaveChanges();
    }
  };
  
  // Create a new journey
  const handleCreateFlow = (name: string, customerName: string = "") => {
    setCurrentJourneyId(null);
    setJourneyTitle(name);
    setNodes(initialNodes);
    setEdges([]);
    
    // Update metadata with customer name
    setJourneyMetadata({
      customerName,
      workflowIntent: "",
      notes: "",
      summary: ""
    });
    
    saveJourney();
    setNewFlowDialogOpen(false);
  };
  
  // Create a journey with AI assistance
  const handleCreateAIFlow = async (
    name: string, 
    customerName: string, 
    intent: string
  ) => {
    setIsGeneratingAIJourney(true);
    try {
      const result = await generateAIJourney({
        title: name,
        customerName,
        intent
      });
      
      if (result.success && result.journey) {
        setCurrentJourneyId(null);
        setJourneyTitle(name);
        
        // Transform the generated nodes and edges
        const generatedNodes = result.journey.nodes.map((node: any) => ({
          id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'journeyNode',
          data: {
            stepType: node.stepType,
            title: node.title,
            description: node.description,
            onNodeEdit: handleNodeEditStable
          },
          position: node.position,
        }));
        
        // Create edges between sequential nodes
        const generatedEdges: Edge[] = [];
        for (let i = 0; i < generatedNodes.length - 1; i++) {
          generatedEdges.push({
            id: `e-${generatedNodes[i].id}-${generatedNodes[i+1].id}`,
            source: generatedNodes[i].id,
            target: generatedNodes[i+1].id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#2563eb' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2563eb',
            }
          });
        }
        
        setNodes(generatedNodes);
        setEdges(generatedEdges);
        
        // Update metadata
        setJourneyMetadata({
          customerName,
          workflowIntent: intent,
          notes: "",
          summary: result.journey.summary || ""
        });
        
        // Save the AI-generated journey
        saveJourney();
        
        toast({
          title: "AI Journey Created",
          description: "Your AI-assisted customer journey has been created.",
          duration: 3000
        });
      } else {
        throw new Error(result.error || "Failed to generate journey");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate journey with AI",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAIJourney(false);
      setNewFlowDialogOpen(false);
    }
  };
  
  // Update a node's data
  const updateNode = (id: string, data: any) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === id) {
          // For MultiPathNode, handle the outputPaths property
          if (node.type === 'multiPathNode' && typeof data.outputPaths === 'number') {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
                outputPaths: data.outputPaths
              }
            };
          }
          
          // For regular nodes
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          };
        }
        return node;
      })
    );
    
    // Auto-save when a node is updated
    autoSaveChanges();
    
    // Close the edit dialog
    setEditDialogOpen(false);
    
    toast({
      title: "Node Updated",
      description: `Updated "${data.title}" node.`,
      duration: 2000
    });
  };
  
  // Delete a node
  const deleteNode = (id: string) => {
    // Find the node to get its title for the toast message
    const nodeToDelete = nodes.find(node => node.id === id);
    const nodeTitle = nodeToDelete?.data.title || "Unknown";
    
    // Remove the node
    setNodes(nds => nds.filter(node => node.id !== id));
    
    // Remove any edges connected to this node
    setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
    
    // Auto-save when a node is deleted
    autoSaveChanges();
    
    // Close the edit dialog
    setEditDialogOpen(false);
    
    toast({
      title: "Node Deleted",
      description: `Deleted "${nodeTitle}" node from the journey.`,
      duration: 2000
    });
  };
  
  // Add a specialized multi-path node
  const addMultiPathNode = () => {
    const newNodeId = `node_${Date.now()}`;
    const position = getNewNodePosition();
    
    const newNode: Node = {
      id: newNodeId,
      type: 'multiPathNode',
      data: { 
        stepType: 'decision',
        title: "Decision Point",
        description: "Customer makes a decision that leads to different paths",
        outputPaths: 2, // Default to 2 output paths
        onNodeEdit: handleNodeEditStable
      },
      position
    };
    
    setNodes((nds) => [...nds, newNode]);
    connectToLastNode(newNodeId);
    
    toast({
      title: "Decision Node Added",
      description: "Added a multi-path decision node to the journey.",
      duration: 2000
    });
    
    // Auto-save when a node is added
    autoSaveChanges();
  };
  
  // Create a sample customer journey from a template
  const createSampleJourney = (template: string) => {
    if (template === 'support') {
      // Customer Support Journey
      const supportNodes: Node[] = [
        {
          id: 'entry',
          type: 'journeyNode',
          data: { 
            stepType: 'entry',
            title: "Customer Inquiry",
            description: "Customer contacts support with an issue or question",
            onNodeEdit: handleNodeEditStable
          },
          position: { x: 100, y: 150 }
        },
        {
          id: 'identification',
          type: 'journeyNode',
          data: { 
            stepType: 'evaluation',
            title: "Issue Identification",
            description: "Agent works with customer to identify the specific issue",
            onNodeEdit: handleNodeEditStable
          },
          position: { x: 350, y: 150 }
        },
        {
          id: 'resolution',
          type: 'journeyNode',
          data: { 
            stepType: 'support',
            title: "Resolution Process",
            description: "Agent provides solution or escalates if needed",
            onNodeEdit: handleNodeEditStable
          },
          position: { x: 600, y: 150 }
        },
        {
          id: 'followup',
          type: 'journeyNode',
          data: { 
            stepType: 'retention',
            title: "Follow-up",
            description: "Agent confirms resolution and checks for additional needs",
            onNodeEdit: handleNodeEditStable
          },
          position: { x: 850, y: 150 }
        }
      ];
      
      const supportEdges: Edge[] = [
        {
          id: 'e-entry-identification',
          source: 'entry',
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
          id: 'e-identification-resolution',
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
          id: 'e-resolution-followup',
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
    }
    
    // Auto-save when a template is selected
    autoSaveChanges();
  };
  
  // Add a custom node from the dialog
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
        onNodeEdit: handleNodeEditStable // Use the stable reference
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
  
  // Function to get a new node position
  const getNewNodePosition = (): XYPosition => {
    // If we have nodes, position new node to the right of the rightmost node
    if (nodes.length > 0) {
      // Find the rightmost node
      const rightmostNode = nodes.reduce(
        (rightmost, node) => {
          return node.position.x > rightmost.x 
            ? { x: node.position.x, y: node.position.y } 
            : rightmost;
        },
        { x: 0, y: 100 }
      );
      
      // Position the new node to the right of the rightmost node
      return { 
        x: rightmostNode.x + 250, 
        y: rightmostNode.y 
      };
    }
    
    // If no nodes, position at the start
    return { x: 100, y: 100 };
  };
  
  // Function to connect a node to the previous "last" node
  const connectToLastNode = (targetNodeId: string) => {
    // Find the rightmost node (excluding the target node) to make it the source
    const excludeTarget = nodes.filter(node => node.id !== targetNodeId);
    if (excludeTarget.length === 0) return;
    
    const rightmostNode = excludeTarget.reduce(
      (rightmost, node) => {
        const x = node.position.x;
        return x > rightmost.x ? { x, id: node.id } : rightmost;
      },
      { x: 0, id: '' }
    );
    
    if (rightmostNode.id) {
      // Create a new edge from the rightmost node to the target node
      const newEdge: Edge = {
        id: `e-${rightmostNode.id}-${targetNodeId}`,
        source: rightmostNode.id,
        target: targetNodeId,
        type: 'smoothstep',
        animated: true,
        deletable: true, // Make the edge deletable
        style: { stroke: '#2563eb' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2563eb',
        }
      };
      
      setEdges(eds => [...eds, newEdge]);
    }
  };
  
  // Connection handler for when nodes are connected
  const onConnect = useCallback((params: Connection) => {
    // Create a new edge with the connection parameters
    setEdges((eds) => 
      addEdge({
        ...params,
        type: 'smoothstep',
        animated: true,
        deletable: true, // Make the edge deletable
        style: { stroke: '#2563eb' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2563eb',
        }
      }, eds)
    );
    
    // Auto-save when nodes are connected
    autoSaveChanges();
  }, [autoSaveChanges]);
  
  // Handler for clearing the flow
  const clearFlow = () => {
    if (window.confirm("Are you sure you want to clear all nodes and connections?")) {
      // Reset to the default nodes and edges
      setNodes(initialNodes);
      setEdges([]);
      
      toast({
        title: "Flow Cleared",
        description: "All nodes and connections have been removed.",
        duration: 3000
      });
      
      // Don't reset the customer name when clearing the flow
      setJourneyMetadata({
        customerName: journeyMetadata.customerName || "", // Preserve customer name
        workflowIntent: "",
        notes: "",
        summary: ""
      });
      
      // Auto-save when the flow is cleared
      autoSaveChanges();
    }
  };
  
  // Handle key press events (for deleting edges)
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      // Check if Delete or Backspace key is pressed
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedEdges = edges.filter(edge => edge.selected);
        
        // If there are selected edges, remove them
        if (selectedEdges.length > 0) {
          setEdges(edges => edges.filter(edge => !edge.selected));
          
          toast({
            title: "Connection Removed",
            description: `${selectedEdges.length} connection(s) removed from the journey.`,
            duration: 2000
          });
          
          // Auto-save after deleting edges
          autoSaveChanges();
        }
      }
    },
    [edges, autoSaveChanges, toast]
  );
  
  // Generate a journey summary using AI
  const handleGenerateSummary = async () => {
    // Get all the node titles and descriptions
    try {
      setSummaryDialogOpen(true);
      return await generateJourneySummary(
        journeyTitle,
        journeyMetadata.customerName || "Unknown Customer",
        journeyMetadata.workflowIntent || "",
        nodes.map(node => ({
          stepType: node.data.stepType,
          title: node.data.title,
          description: node.data.description
        }))
      );
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast({
        title: "Summary Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating the summary.",
        variant: "destructive"
      });
      return "Failed to generate summary.";
    }
  };
  
  // Handler for saving the generated summary
  const handleSaveSummary = (summary: string) => {
    setJourneyMetadata(prev => ({
      ...prev,
      summary
    }));
    
    // Auto-save after updating the summary
    autoSaveChanges();
    
    toast({
      title: "Summary Saved",
      description: "The journey summary has been saved.",
      duration: 3000
    });
  };
  
  // Update the metadata
  const handleUpdateMetadata = (metadata: {
    customerName: string;
    workflowIntent: string;
    notes: string;
    summary?: string;
  }) => {
    setJourneyMetadata(metadata);
    
    // Auto-save after updating metadata
    autoSaveChanges();
    
    toast({
      title: "Metadata Updated",
      description: "Journey metadata has been updated.",
      duration: 3000
    });
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div 
        className={`border-r bg-card transition-all duration-300 p-4 flex flex-col h-screen ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Saved Journeys</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-1 mb-6">
          <Button 
            variant="default" 
            className="w-full flex items-center gap-2"
            onClick={() => setNewFlowDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Journey
          </Button>
          
          {/* Only show if you have saved journeys */}
          {savedJourneys.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2 mt-2"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete ALL saved journeys? This cannot be undone.")) {
                  deleteAllJourneysMutation.mutate();
                  // Reset the current journey
                  setCurrentJourneyId(null);
                  setJourneyTitle("New Customer Journey");
                  setNodes(initialNodes);
                  setEdges([]);
                  
                  // Don't reset customer when deleting all journeys
                  setJourneyMetadata({
                    customerName: journeyMetadata.customerName, // Preserve customer name
                    workflowIntent: "",
                    notes: "",
                    summary: ""
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete All
            </Button>
          )}
        </div>
        
        {isLoadingJourneys ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isJourneysError ? (
          <div className="text-center py-8 text-destructive">
            <p>Failed to load journeys.</p>
            <p className="text-xs">{journeysError instanceof Error ? journeysError.message : "Unknown error"}</p>
          </div>
        ) : savedJourneys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No saved journeys yet.</p>
            <p className="text-xs">Create a new journey to get started.</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-grow">
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
                
                {/* Customer Name */}
                {journey.customerName && (
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{journey.customerName}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      {new Date(journey.lastSaved).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {journey.preview && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {journey.preview.nodeCount} nodes
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top Bar */}
        <div className="border-b bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex flex-col">
              <EditableTitle 
                title={journeyTitle} 
                onSave={handleTitleUpdate}
                className="text-xl font-semibold" 
              />
              
              {/* Show customer name in the header if it exists */}
              {journeyMetadata.customerName && (
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Users className="h-3 w-3" />
                  {journeyMetadata.customerName}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMetadataDialogOpen(true)}
            >
              <Info className="h-4 w-4 mr-1" />
              Metadata
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSummaryDialogOpen(true)}
            >
              <Bot className="h-4 w-4 mr-1" />
              Summary
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => saveJourney(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
        
        {/* Flow Editor */}
        <div className="flex-1 relative" onKeyDown={handleKeyPress}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            snapToGrid={true}
            snapGrid={[10, 10]}
            fitView
            attributionPosition="bottom-right"
            connectionLineStyle={{ stroke: '#2563eb' }}
            connectionLineType={ConnectionLineType.SmoothStep}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} color="#f3f4f6" />
            <Controls showInteractive={false} position="bottom-right" />
            <MiniMap 
              nodeStrokeColor="#aaa" 
              nodeColor="#ffffff"
              nodeBorderRadius={2}
              position="bottom-left"
            />
            
            <Panel position="top-center">
              <div className="bg-white border px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                <Select defaultValue="interaction" disabled>
                  <SelectTrigger className="w-32 bg-muted/30">
                    <SelectValue placeholder="Node type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interaction">Interaction</SelectItem>
                    <SelectItem value="touchpoint">Touchpoint</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="h-8 w-px bg-border"></div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewNodeDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Node
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addMultiPathNode()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Decision Split
                </Button>
                
                <div className="h-8 w-px bg-border"></div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFlow}
                >
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                  Clear
                </Button>
              </div>
            </Panel>
            
            <Panel position="top-right">
              <div className="bg-white/50 backdrop-blur border rounded p-2 text-xs text-muted-foreground">
                <div>Press <kbd className="px-1 bg-muted rounded">Delete</kbd> to remove selected connections</div>
                <div>Drag between handles to create connections</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
      
      {/* Dialogs */}
      <NewFlowDialog 
        open={newFlowDialogOpen} 
        onOpenChange={setNewFlowDialogOpen} 
        onCreateFlow={handleCreateFlow}
        onCreateAIFlow={handleCreateAIFlow} 
        customers={customersData || []}
        currentCustomerName={journeyMetadata.customerName || ""}
        isGeneratingAI={isGeneratingAIJourney}
      />
      
      <JourneyMetadataDialog 
        open={metadataDialogOpen}
        onOpenChange={setMetadataDialogOpen}
        metadata={journeyMetadata}
        onUpdateMetadata={handleUpdateMetadata}
        customers={customersData || []}
      />
      
      <NewNodeDialog 
        open={newNodeDialogOpen}
        onOpenChange={setNewNodeDialogOpen}
        onAddNode={addCustomNode}
      />
      
      <EditNodeDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nodeData={editingNode}
        onUpdate={updateNode}
        onDelete={deleteNode}
      />
      
      <AISummaryDialog 
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        currentSummary={journeyMetadata.summary || null}
        onSaveSummary={handleSaveSummary}
        onGenerateSummary={handleGenerateSummary}
      />
    </div>
  );
}