import React, { useState, useCallback, useEffect, useRef } from "react";
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
  Handle,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow';
import 'reactflow/dist/style.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
import ExportJourneyButton from "../components/ExportJourneyButton";
import ExportFlowImageButton from "../components/ExportFlowImageButton";
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
  generateAIJourney
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
// Define nodeTypes outside the component to prevent unnecessary re-creation
const nodeTypes: NodeTypes = {
  journeyNode: JourneyNode,
  multiPathNode: MultiPathNode
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
      // onNodeEdit will be added via useEffect
    },
    position: { x: 100, y: 100 }
  }
];

// Interface for our display of saved journeys in the sidebar
interface SavedJourneyDisplay {
  id: number;
  title: string;
  customerName?: string; // Added customer name
  lastSaved: string;
  preview?: {
    nodeCount: number;
    edgeCount: number;
  };
}

export default function CustomerJourney() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [journeyTitle, setJourneyTitle] = useState<string>("New Customer Journey");
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentJourneyId, setCurrentJourneyId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAIJourney, setIsGeneratingAIJourney] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  
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
  
  // Journey metadata state
  const [journeyMetadata, setJourneyMetadata] = useState<{
    customerName: string;
    workflowIntent: string;
    notes: string;
    summary?: string;
  }>({
    customerName: "",
    workflowIntent: "",
    notes: "",
    summary: ""
  });
  
  // React Query for fetching all journeys
  const { 
    data: journeysData, 
    isLoading: isLoadingJourneys,
    isError: isJourneysError,
    error: journeysError
  } = useQuery({
    queryKey: ['/api/customer-journeys'],
    queryFn: () => fetchAllCustomerJourneys(),
  });
  
  // Format journeys for display
  const savedJourneys: SavedJourneyDisplay[] = journeysData?.map(journey => ({
    id: journey.id,
    title: journey.title,
    customerName: journey.customerName || "",
    lastSaved: journey.updatedAt,
    preview: {
      nodeCount: journey.nodes?.length || 0,
      edgeCount: journey.edges?.length || 0,
    }
  })) || [];
  
  // Mutations for creating, updating and deleting journeys
  const createJourneyMutation = useMutation({
    mutationFn: (journeyData: { 
      title: string, 
      customerName: string, 
      workflowIntent: string, 
      notes: string, 
      nodes: any[], 
      edges: any[] 
    }) => createCustomerJourney(journeyData),
    onSuccess: (data) => {
      setCurrentJourneyId(data.id);
      toast({
        title: "Journey Created",
        description: "Your journey has been created successfully.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Create Failed",
        description: error instanceof Error ? error.message : "There was an error creating your journey.",
        variant: "destructive"
      });
    }
  });
  
  const updateJourneyMutation = useMutation({
    mutationFn: (params: { id: number, journeyData: Partial<CustomerJourneyType> }) => {
      console.log("Updating journey with data:", params.journeyData);
      return updateCustomerJourney(params.id, params.journeyData);
    },
    onSuccess: (data) => {
      console.log("Journey updated successfully:", data);
      toast({
        title: "Journey Updated",
        description: "Your journey has been updated successfully.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "There was an error updating your journey.",
        variant: "destructive"
      });
    }
  });
  
  const deleteJourneyMutation = useMutation({
    mutationFn: (id: number) => deleteCustomerJourney(id),
    onSuccess: () => {
      toast({
        title: "Journey Deleted",
        description: "The journey has been deleted successfully.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "There was an error deleting the journey.",
        variant: "destructive"
      });
    }
  });
  
  const deleteAllJourneysMutation = useMutation({
    mutationFn: () => deleteAllCustomerJourneys(),
    onSuccess: () => {
      toast({
        title: "All Journeys Deleted",
        description: "All journeys have been deleted successfully.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Delete Failed",
        description: error instanceof Error ? error.message : "There was an error deleting all journeys.",
        variant: "destructive"
      });
    }
  });
  
  // Save journey to database - declare before usage
  const saveJourney = useCallback(async (isAutoSave = true) => {
    try {
      // Check if a journey with this title already exists (excluding current journey)
      const existingJourneys = await queryClient.fetchQuery({ 
        queryKey: ['/api/customer-journeys'],
        queryFn: () => getCustomerJourneys()
      });
      
      const journeyWithSameTitle = existingJourneys.find((journey: CustomerJourneyType) => 
        journey.title === journeyTitle && journey.id !== currentJourneyId
      );
      
      // If a journey with the same title exists, alert the user and don't save
      if (journeyWithSameTitle && !currentJourneyId) {
        toast({
          title: "Journey Name Already Exists",
          description: "Please choose a different name for your journey.",
          variant: "destructive",
          duration: 5000
        });
        return;
      }
      
      // Ensure metadata fields are included and properly set
      const journeyData = {
        title: journeyTitle,
        customerName: journeyMetadata.customerName || "",
        workflowIntent: journeyMetadata.workflowIntent || "",
        notes: journeyMetadata.notes || "",
        summary: journeyMetadata.summary || "",
        nodes,
        edges,
      };
      
      // If we have a currentJourneyId, update the existing journey
      if (currentJourneyId) {
        await updateJourneyMutation.mutateAsync({
          id: currentJourneyId,
          journeyData
        });
      } else {
        // Otherwise create a new journey
        const newJourney = await createJourneyMutation.mutateAsync(journeyData);
        setCurrentJourneyId(newJourney.id);
      }
      
      // Only show toast for manual saves
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
      // Check if it's a unique constraint violation
      if (error instanceof Error && error.message.includes("unique constraint")) {
        toast({
          title: "Journey Name Already Exists",
          description: "Please choose a different name for your journey.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        toast({
          title: "Save Failed",
          description: error instanceof Error ? error.message : "There was an error saving your journey.",
          variant: "destructive"
        });
      }
    }
  }, [
    nodes, 
    edges, 
    journeyTitle, 
    journeyMetadata,
    currentJourneyId, 
    toast, 
    createJourneyMutation, 
    updateJourneyMutation,
    queryClient
  ]);
  

  
  // Optimized auto-save functionality with debouncing
  const autoSaveChanges = useCallback(() => {
    // Avoid auto-saves during loading
    if (isLoading) {
      return;
    }
    
    // Clear any existing timeout to implement debouncing
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set a new timeout to save after 30 seconds of inactivity
    const timeout = setTimeout(() => {
      // Only save if we have a journey ID and not in loading state
      if (currentJourneyId && !isLoading) {
        // Use a lightweight log during development
        if (process.env.NODE_ENV === 'development') {
          console.log("Auto-saving journey at", new Date().toISOString());
        }
        
        // Use mutateAsync instead of mutate to better handle errors
        updateJourneyMutation.mutate({
          id: currentJourneyId,
          journeyData: {
            title: journeyTitle,
            customerName: journeyMetadata.customerName || "", 
            workflowIntent: journeyMetadata.workflowIntent || "",
            notes: journeyMetadata.notes || "",
            summary: journeyMetadata.summary || "",
            nodes,
            edges
          }
        });
      } else if (!currentJourneyId && nodes.length > 1) {
        // Only auto-create a journey if we've added nodes beyond the initial state
        saveJourney(true); // true = isAutoSave
      }
    }, 30000); // Set to 30 seconds as requested
    
    setSaveTimeout(timeout);
  }, [saveTimeout, currentJourneyId, journeyMetadata, journeyTitle, nodes, edges, updateJourneyMutation, saveJourney, isLoading]);
  
  // Load a specific journey with optimized performance
  const loadJourney = useCallback(async (journeyId: number) => {
    try {
      // Prevent repeated loading of the same journey
      if (journeyId === currentJourneyId && !isLoading) {
        return;
      }
      
      setIsLoading(true);
      
      // Use the cached journey data if available
      let journey: CustomerJourneyType | undefined;
      try {
        // Try to get from query cache first to avoid network request
        journey = queryClient.getQueryData<CustomerJourneyType>(['/api/customer-journeys', journeyId]);
        
        // If not in cache, fetch it
        if (!journey) {
          journey = await fetchCustomerJourney(journeyId);
        }
      } catch (e) {
        // Handle cache lookup error
        journey = await fetchCustomerJourney(journeyId);
      }
      
      if (journey) {
        // Batch state updates to reduce re-renders
        const batchedUpdates = () => {
          // Explicitly type cast to ensure TypeScript understands properties are safe to access
          const journeyData = journey as CustomerJourneyType;
          
          setJourneyTitle(journeyData.title || 'Untitled Journey');
          setCurrentJourneyId(journeyData.id);
          
          // Load metadata 
          setJourneyMetadata({
            customerName: journeyData.customerName || '',
            workflowIntent: journeyData.workflowIntent || '',
            notes: journeyData.notes || '',
            summary: journeyData.summary || ''
          });
          
          // Set nodes and edges last to trigger only one layout recalculation
          setNodes(journeyData.nodes || initialNodes);
          setEdges(journeyData.edges || []);
        };
        
        // Execute batched updates
        batchedUpdates();
        
        toast({
          title: "Journey Loaded",
          description: `Loaded "${(journey as CustomerJourneyType).title || 'Untitled Journey'}"`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error("Failed to load journey:", error);
      toast({
        title: "Load Failed",
        description: error instanceof Error ? error.message : "There was an error loading the journey.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentJourneyId, isLoading, queryClient, setNodes, setEdges, toast]);
  
  // Delete a saved journey
  const deleteJourney = useCallback(async (journeyId: number, journeyTitle: string) => {
    try {
      await deleteJourneyMutation.mutateAsync(journeyId);
      
      // If the current journey was deleted, reset to a new journey
      if (journeyId === currentJourneyId) {
        setNodes(initialNodes);
        setEdges([]);
        setJourneyTitle("New Customer Journey");
        setCurrentJourneyId(null);
        
        // Reset metadata but preserve customer name
        setJourneyMetadata({
          customerName: journeyMetadata.customerName || "", // Preserve customer name
          workflowIntent: "",
          notes: ""
        });
      }
    } catch (error) {
      console.error("Failed to delete journey:", error);
    }
  }, [currentJourneyId, setNodes, setEdges, deleteJourneyMutation]);
  
  // Delete all journeys
  const handlePurgeAllJourneys = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete ALL saved Customer Journey Maps? This cannot be undone.")) {
      try {
        await deleteAllJourneysMutation.mutateAsync();
        setNodes(initialNodes);
        setEdges([]);
        setJourneyTitle("New Customer Journey");
        setCurrentJourneyId(null);
        
        // Reset metadata but preserve customer name
        setJourneyMetadata({
          customerName: journeyMetadata.customerName || "", // Preserve customer name
          workflowIntent: "",
          notes: ""
        });
      } catch (error) {
        console.error("Failed to delete all journeys:", error);
      }
    }
  }, [deleteAllJourneysMutation, setNodes, setEdges]);
  
  // Handler for generating a summary using AI
  const handleGenerateSummary = useCallback(async (): Promise<string> => {
    if (!currentJourneyId) {
      toast({
        title: "Save Required",
        description: "Please save your journey first before generating a summary.",
        variant: "destructive",
        duration: 3000
      });
      return "";
    }
    
    try {
      setIsLoading(true);
      const response = await generateJourneySummary(currentJourneyId);
      if (response && response.summary) {
        // Update local state with the new summary
        setJourneyMetadata(prev => ({
          ...prev,
          summary: response.summary || ""
        }));
        
        toast({
          title: "Summary Generated",
          description: "Journey summary has been generated successfully.",
          duration: 3000
        });
        
        return response.summary;
      } else {
        throw new Error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      toast({
        title: "Summary Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating the summary.",
        variant: "destructive",
        duration: 3000
      });
      return "";
    } finally {
      setIsLoading(false);
    }
  }, [currentJourneyId, toast, generateJourneySummary]);
  
  // Handler for saving the summary
  const handleSaveSummary = useCallback((summary: string) => {
    // Update the local state
    setJourneyMetadata(prev => ({
      ...prev,
      summary
    }));
    
    // Save the journey with the updated summary
    if (currentJourneyId) {
      // Need to include all required fields when updating
      updateJourneyMutation.mutate({
        id: currentJourneyId,
        journeyData: {
          title: journeyTitle,
          customerName: journeyMetadata.customerName,
          workflowIntent: journeyMetadata.workflowIntent,
          notes: journeyMetadata.notes,
          summary,
          nodes,
          edges
        }
      });
    }
    
    toast({
      title: "Summary Saved",
      description: "Your journey summary has been saved.",
      duration: 3000
    });
  }, [currentJourneyId, updateJourneyMutation, toast, journeyTitle, journeyMetadata, nodes, edges]);
  
  // Handler for updating journey metadata
  const handleUpdateMetadata = useCallback((metadata: {
    customerName: string;
    workflowIntent: string;
    notes: string;
    summary?: string;
  }) => {
    console.log("Update metadata called with:", metadata);
    setJourneyMetadata(metadata);
    
    toast({
      title: "Metadata Updated",
      description: "Journey metadata has been updated.",
      duration: 2000
    });
    
    // Auto-save when metadata changes
    // Do not auto-save here as it might be causing the issues
    // Instead manually save to preserve metadata
    if (currentJourneyId) {
      updateJourneyMutation.mutate({
        id: currentJourneyId,
        journeyData: {
          title: journeyTitle,
          customerName: metadata.customerName,
          workflowIntent: metadata.workflowIntent,
          notes: metadata.notes,
          summary: metadata.summary,
          nodes,
          edges
        }
      });
    }
  }, [currentJourneyId, updateJourneyMutation, journeyTitle, nodes, edges, toast]);
  
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
      // Create a unique ID for the edge
      const edgeId = `e${params.source}-${params.target}-${Date.now()}`;
      
      // Create edge with animated line
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: edgeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#2563eb' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2563eb',
            }
          },
          eds
        )
      );
      
      toast({
        title: "Connection Created",
        description: "Connected nodes in the journey flow.",
        duration: 2000
      });
      
      // Auto-save when a connection is created
      // Use same 30-second timeout for consistency
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(() => autoSaveChanges(), 30000);
      setSaveTimeout(timeout);
    },
    [setEdges, toast, autoSaveChanges, saveTimeout, setSaveTimeout]
  );
  
  // This section intentionally left empty after cleanup

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
            }
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
  }, [handleNodeEdit, setNodes]);
  
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
  
  // Add a multi-path decision node to the journey
  const addMultiPathNode = () => {
    const newNodeId = `decision-split-${Date.now()}`;
    const position = getNewNodePosition();
    
    const newNode: Node = {
      id: newNodeId,
      type: 'multiPathNode',
      data: { 
        stepType: 'Decision Split',
        title: 'Decision Point',
        description: 'Customer journey splits based on decision',
        outputPaths: 3, // Default to 3 output paths
        onNodeEdit: handleNodeEdit // Pass the edit handler to the node
      },
      position
    };
    
    setNodes((nds) => [...nds, newNode]);
    connectToLastNode(newNodeId);
    
    toast({
      title: "Decision Split Added",
      description: "Added a decision split node with multiple output paths.",
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
    setCurrentJourneyId(null);
    
    // Reset metadata but preserve customer name
    setJourneyMetadata({
      customerName: journeyMetadata.customerName || "", // Preserve customer name
      workflowIntent: "",
      notes: "",
      summary: ""
    });
    
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
  
  // Create a new journey using AI generation
  const handleCreateAIFlow = async (flowName: string, description: string) => {
    try {
      setIsGeneratingAIJourney(true);
      setJourneyTitle(flowName);
      
      // Reset metadata with journey description as notes, but preserve customer name
      setJourneyMetadata({
        customerName: journeyMetadata.customerName || "", // Preserve customer name
        workflowIntent: description,
        notes: description,
        summary: ""
      });
      
      toast({
        title: "Generating AI Journey",
        description: "Please wait while we generate your customer journey...",
        duration: 5000
      });
      
      // Call the AI journey generation API
      const generatedJourney = await generateAIJourney(description);
      
      if (generatedJourney && generatedJourney.nodes && generatedJourney.edges) {
        // Set the nodes and edges from the AI-generated journey
        setNodes(generatedJourney.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onNodeEdit: handleNodeEdit
          }
        })));
        setEdges(generatedJourney.edges);
        setCurrentJourneyId(null);
        
        toast({
          title: "AI Journey Created",
          description: `Created new AI journey: ${flowName}`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Failed to generate AI journey:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI journey",
        variant: "destructive",
        duration: 5000
      });
      
      // Reset to default initial nodes
      setNodes(initialNodes);
      setEdges([]);
    } finally {
      setIsGeneratingAIJourney(false);
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
          id: 'e-entry-research',
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
          id: 'e-research-evaluation',
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
          id: 'e-evaluation-decision',
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
          id: 'e-decision-purchase',
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
            description: 'Customer experiences an issue',
            onNodeEdit: handleNodeEdit
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'contact',
          type: 'journeyNode',
          data: { 
            stepType: 'Contact',
            title: 'Contact Support',
            description: 'Customer reaches out for help'
          },
          position: { x: 350, y: 100 }
        },
        {
          id: 'identification',
          type: 'journeyNode',
          data: { 
            stepType: 'Identification',
            title: 'Issue Identification',
            description: 'Support identifies the issue'
          },
          position: { x: 600, y: 100 }
        },
        {
          id: 'resolution',
          type: 'journeyNode',
          data: { 
            stepType: 'Resolution',
            title: 'Resolution',
            description: 'Issue is resolved'
          },
          position: { x: 850, y: 100 }
        },
        {
          id: 'followup',
          type: 'journeyNode',
          data: { 
            stepType: 'Follow-up',
            title: 'Follow-up',
            description: 'Follow-up with customer'
          },
          position: { x: 1100, y: 100 }
        }
      ];
      
      const supportEdges: Edge[] = [
        {
          id: 'e-entry-contact',
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
          id: 'e-contact-identification',
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
  };

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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6" />
            Customer Journey Design
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">Design AI-powered customer interaction flows</p>
            
            {/* Journey metadata editor */}
            <JourneyMetadataDialog
              metadata={journeyMetadata}
              onUpdateMetadata={handleUpdateMetadata}
            />
            
            {/* Display metadata when available */}
            {journeyMetadata.customerName && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{journeyMetadata.customerName}</span>
              </Badge>
            )}
            
            {journeyMetadata.workflowIntent && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>{journeyMetadata.workflowIntent}</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <NewFlowDialog 
            onCreateFlow={handleCreateFlow} 
            onCreateAIFlow={handleCreateAIFlow}
          />
          
          {/* AI Summary Button */}
          <Button
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            onClick={() => setSummaryDialogOpen(true)}
            disabled={!currentJourneyId}
          >
            <Brain className="mr-2 h-4 w-4" />
            AI Summary
          </Button>
          
          {/* AI Summary Dialog */}
          <AISummaryDialog
            open={summaryDialogOpen}
            onOpenChange={setSummaryDialogOpen}
            currentSummary={journeyMetadata.summary || null}
            onSaveSummary={handleSaveSummary}
            onGenerateSummary={handleGenerateSummary}
          />
          
          <Button
            variant="outline"
            onClick={() => {
              setNodes(initialNodes);
              setEdges([]);
              setCurrentJourneyId(null);
              setJourneyTitle("New Customer Journey");
              // Reset metadata but preserve customer name
              setJourneyMetadata({
                customerName: journeyMetadata.customerName || "", // Preserve customer name
                workflowIntent: "",
                notes: "",
                summary: ""
              });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
          
          <Button 
            variant="destructive"
            onClick={handlePurgeAllJourneys}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Purge All Journeys
          </Button>
          
          <ExportJourneyButton
            title={journeyTitle}
            metadata={journeyMetadata}
            nodes={nodes}
            edges={edges}
            flowRef={reactFlowWrapper}
            disabled={isLoading || nodes.length <= 1}
          />
          
          <ExportFlowImageButton
            title={journeyTitle}
            flowRef={reactFlowWrapper}
            disabled={isLoading || nodes.length <= 1}
          />
          
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
            
            {isLoadingJourneys ? (
              <div className="text-center text-muted-foreground p-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Loading journeys...</p>
              </div>
            ) : savedJourneys.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <p>No saved journeys yet.</p>
                <p className="text-sm mt-2">Create and save a journey to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJourneys.map(journey => (
                  <div 
                    key={journey.id} 
                    className={`border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors ${currentJourneyId === journey.id ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => loadJourney(journey.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 
                        className="font-medium truncate w-44"
                      >
                        {journey.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
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
                        <span className="text-xs font-medium text-muted-foreground">
                          {journey.customerName}
                        </span>
                      </div>
                    )}
                    
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
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              // Auto-save after 30 seconds
              if (saveTimeout) clearTimeout(saveTimeout);
              const timeout = setTimeout(() => autoSaveChanges(), 30000);
              setSaveTimeout(timeout);
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              // Auto-save after 30 seconds
              if (saveTimeout) clearTimeout(saveTimeout);
              const timeout = setTimeout(() => autoSaveChanges(), 30000);
              setSaveTimeout(timeout);
            }}
            onConnect={onConnect}
            onEdgesDelete={(edges) => {
              toast({
                title: "Connection Deleted",
                description: "Deleted connection in the journey flow.",
                duration: 2000
              });
              // Auto-save after 30 seconds
              if (saveTimeout) clearTimeout(saveTimeout);
              const timeout = setTimeout(() => autoSaveChanges(), 30000);
              setSaveTimeout(timeout);
            }}
            nodeTypes={nodeTypes}
            connectionLineStyle={{ stroke: '#2563eb' }}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            elementsSelectable={true}
            deleteKeyCode={['Backspace', 'Delete']}
            snapToGrid={true}
            snapGrid={[15, 15]}
            onlyRenderVisibleElements={true}
          >
            <Controls />
            <MiniMap 
              nodeBorderRadius={2} 
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                const type = node.data?.stepType?.toLowerCase() || '';
                if (type.includes('entry')) return '#10B981';
                if (type.includes('decision')) return '#F59E0B';
                return '#3B82F6';
              }}
            />
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
                    onClick={addMultiPathNode}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Decision Split
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