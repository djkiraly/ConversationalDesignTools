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
    outputPaths?: number; // For MultiPathNode
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
  
  // We want to create a stable callback reference that won't recreate with each render
  // Creating it with useRef to keep a stable reference
  const handleNodeEditStable = useRef((nodeId: string, nodeData: any) => {
    setEditingNode({
      id: nodeId,
      stepType: nodeData.stepType || '',
      title: nodeData.title || '',
      description: nodeData.description || '',
      outputPaths: nodeData.outputPaths
    });
    setEditDialogOpen(true);
  }).current;
  
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
  
  // Fetch all customers for the dropdown
  const { 
    data: customersData, 
    isLoading: isLoadingCustomers
  } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => getAllCustomers(),
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
        const data = await createJourneyMutation.mutateAsync(journeyData);
        setCurrentJourneyId(data.id);
      }
      
      // Refresh the journeys list
      queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
      
      if (!isAutoSave) {
        toast({
          title: "Journey Saved",
          description: "Your journey has been saved successfully.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Failed to save journey:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "There was an error saving your journey.",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [
    queryClient, journeyTitle, currentJourneyId, journeyMetadata, 
    nodes, edges, updateJourneyMutation, createJourneyMutation, toast
  ]);
  
  // Delete a journey
  const deleteJourney = useCallback(async (journeyId: number, journeyName: string) => {
    try {
      await deleteJourneyMutation.mutateAsync(journeyId);
      
      // If we deleted the current journey, reset the form
      if (currentJourneyId === journeyId) {
        setCurrentJourneyId(null);
        setJourneyTitle("New Customer Journey");
        setNodes(initialNodes);
        setEdges([]);
        setJourneyMetadata({
          customerName: journeyMetadata.customerName, // Preserve customer name
          workflowIntent: "",
          notes: "",
          summary: ""
        });
      }
      
      // Refresh the journeys list
      queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
      
      toast({
        title: "Journey Deleted",
        description: `"${journeyName}" has been deleted.`,
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "There was an error deleting the journey.",
        variant: "destructive"
      });
    }
  }, [
    deleteJourneyMutation, currentJourneyId, queryClient, 
    journeyMetadata.customerName, toast
  ]);
  
  // Auto-save functionality
  const autoSaveChanges = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set a new timeout to save after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      // Before auto-saving, make sure we're using the most up-to-date metadata
      // This is to fix the issue where the customer name gets lost during auto-save
      if (currentJourneyId) {
        console.log("Auto-saving journey with metadata:", journeyMetadata);
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
        console.log("Auto-saved journey at", new Date().toISOString());
      } else {
        saveJourney();
      }
    }, 5000);
    
    setSaveTimeout(timeout);
  }, [saveTimeout, currentJourneyId, journeyMetadata, journeyTitle, nodes, edges, updateJourneyMutation, saveJourney]);
  
  // Load a specific journey
  const loadJourney = useCallback(async (journeyId: number) => {
    try {
      // Clear any existing auto-save timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        setSaveTimeout(null);
      }
      
      setIsLoading(true);
      console.log("Loading journey ID:", journeyId);
      const journey = await fetchCustomerJourney(journeyId);
      
      if (journey) {
        console.log("Journey loaded:", journey);
        
        // Set all the state at once to prevent auto-save issue
        // Block any auto-saves during this process
        const isAutoSaveEnabled = autoSaveChanges !== null;
        
        // First set the journey ID
        setCurrentJourneyId(journey.id);
        
        // Then set the journey data
        setJourneyTitle(journey.title || 'Untitled Journey');
        
        // Add the onNodeEdit handler to nodes
        const processedNodes = (journey.nodes || initialNodes).map(node => ({
          ...node,
          data: {
            ...node.data,
            onNodeEdit: handleNodeEditStable // Use the stable reference
          }
        }));
        
        setNodes(processedNodes);
        setEdges(journey.edges || []);
        
        // Load metadata
        setJourneyMetadata({
          customerName: journey.customerName || '',
          workflowIntent: journey.workflowIntent || '',
          notes: journey.notes || '',
          summary: journey.summary || ''
        });
        
        toast({
          title: "Journey Loaded",
          description: `Loaded "${journey.title || 'Untitled Journey'}"`,
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
  }, [fetchCustomerJourney, saveTimeout, autoSaveChanges, toast, handleNodeEditStable]);
  
  // Update all nodes to include the onNodeEdit callback
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onNodeEdit: handleNodeEditStable // Use the stable reference
        }
      }))
    );
  }, [handleNodeEditStable, setNodes]);
  
  // Update a node's data
  const updateNode = (id: string, data: { 
    stepType: string; 
    title: string; 
    description: string;
    outputPaths?: number; // For MultiPathNode 
  }) => {
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
              outputPaths: data.outputPaths, // Include outputPaths for MultiPathNode
              onNodeEdit: handleNodeEditStable // Use the stable reference
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
        onNodeEdit: handleNodeEditStable // Use the stable reference
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
        onNodeEdit: handleNodeEditStable // Use the stable reference
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
            onNodeEdit: handleNodeEditStable // Use the stable reference
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
            onNodeEdit: handleNodeEditStable // Use the stable reference
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
            onNodeEdit: handleNodeEditStable // Use the stable reference
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
            description: 'Support identifies the problem'
          },
          position: { x: 600, y: 100 }
        },
        {
          id: 'resolution',
          type: 'journeyNode',
          data: { 
            stepType: 'Resolution',
            title: 'Problem Resolution',
            description: 'Issue is resolved for customer'
          },
          position: { x: 850, y: 100 }
        },
        {
          id: 'followup',
          type: 'journeyNode',
          data: { 
            stepType: 'Follow Up',
            title: 'Follow Up',
            description: 'Post-resolution follow-up'
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
    
    // Auto-save when a template is selected
    autoSaveChanges();
  };
  
  // Function to get a new node position
  const getNewNodePosition = (): XYPosition => {
    // Find the rightmost node to place the new node to its right
    const rightmostNode = nodes.reduce(
      (rightmost, node) => {
        const x = node.position.x;
        return x > rightmost.x ? { x, node } : rightmost;
      },
      { x: 0, node: null }
    );
    
    return rightmostNode.node
      ? { x: rightmostNode.x + 250, y: rightmostNode.node.position.y }
      : { x: 100, y: 100 };
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
  
  // State for dialogs
  const [newFlowDialogOpen, setNewFlowDialogOpen] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [newNodeDialogOpen, setNewNodeDialogOpen] = useState(false);
  
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