import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Route, useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Connection,
  MarkerType,
  ConnectionLineType,
  Node,
  XYPosition,
  NodeTypes,
  Position,
  Handle,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import 'reactflow/dist/style.css';
import './agent-journey.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Import resizable node components
import ResizableAgentNode from '../components/ResizableAgentNode';
import ResizableSystemNode from '../components/ResizableSystemNode';
import ResizableDecisionNode from '../components/ResizableDecisionNode';
import ResizableGuardrailNode from '../components/ResizableGuardrailNode';
import ResizableEscalationNode from '../components/ResizableEscalationNode';

// Import auto-sizing agent node component
import AutoSizingAgentNode from '../components/AutoSizingAgentNode';
import { 
  Bot, 
  Database, 
  Shield, 
  ChevronLeft, 
  Save, 
  Trash2, 
  Plus, 
  Map, 
  HelpCircle,
  Loader2,
  GitBranch,
  AlertTriangle,
  StickyNote,
  Play,
  Square,
  RotateCcw,
  Wand2 as MagicWand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  useToast 
} from "@/hooks/use-toast";

import useEditingState from '@/hooks/useEditingState';
import { AgentJourney, InsertAgentJourney } from '@shared/schema';
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

// Custom node components
const AgentNode = ({ data, selected, id }: { data: any, selected: boolean, id: string }) => {
  const { openNodeEditor } = data;
  
  return (
    <div 
      className={`node agent-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}
      onClick={() => openNodeEditor(id, data)}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Bot size={20} className="text-primary" />
        <div className="font-medium">{data.label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{data.content}</div>
      
      {/* Multiple connection points */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Top} id="target-top" />
      <Handle type="target" position={Position.Bottom} id="target-bottom" />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="source-right-bottom" style={{ top: '70%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" />
    </div>
  );
};

const SystemNode = ({ data, selected, id }: { data: any, selected: boolean, id: string }) => {
  const { openNodeEditor } = data;
  
  return (
    <div 
      className={`node system-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}
      onClick={() => openNodeEditor(id, data)}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Database size={20} className="text-blue-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{data.content}</div>
      
      {/* Multiple connection points */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="target-left-bottom" style={{ top: '70%' }} />
      <Handle type="target" position={Position.Top} id="target-top" />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="source-right-bottom" style={{ top: '70%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" />
    </div>
  );
};

const GuardrailNode = ({ data, selected, id }: { data: any, selected: boolean, id: string }) => {
  const { openNodeEditor } = data;
  
  return (
    <div 
      className={`node guardrail-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}
      onClick={() => openNodeEditor(id, data)}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Shield size={20} className="text-red-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{data.content}</div>
      
      {/* Multiple connection points */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Top} id="target-top" />
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="source-right-bottom" style={{ top: '70%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" />
    </div>
  );
};

const DecisionNode = ({ data, selected, id }: { data: any, selected: boolean, id: string }) => {
  const { openNodeEditor } = data;
  
  return (
    <div 
      className={`node decision-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}
      onClick={() => openNodeEditor(id, data)}
    >
      <div className="flex items-center space-x-2 mb-2">
        <GitBranch size={20} className="text-purple-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{data.content}</div>
      
      {/* Multiple connection points - lots of output connections for decisions */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Top} id="target-top" />
      
      {/* Multiple output points for decision branches */}
      <Handle type="source" position={Position.Right} id="source-right-1" style={{ top: '20%' }} />
      <Handle type="source" position={Position.Right} id="source-right-2" style={{ top: '40%' }} />
      <Handle type="source" position={Position.Right} id="source-right-3" style={{ top: '60%' }} />
      <Handle type="source" position={Position.Right} id="source-right-4" style={{ top: '80%' }} />
      
      {/* Bottom outputs */}
      <Handle type="source" position={Position.Bottom} id="source-bottom-1" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom-2" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom-3" style={{ left: '75%' }} />
    </div>
  );
};

const EscalationNode = ({ data, selected, id }: { data: any, selected: boolean, id: string }) => {
  const { openNodeEditor } = data;
  
  return (
    <div 
      className={`node escalation-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}
      onClick={() => openNodeEditor(id, data)}
    >
      <div className="flex items-center space-x-2 mb-2">
        <AlertTriangle size={20} className="text-orange-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <div className="text-sm text-muted-foreground">{data.content}</div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} id="target-left" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="target-left-bottom" style={{ top: '70%' }} />
      <Handle type="target" position={Position.Top} id="target-top" />
      
      {/* Output points */}
      <Handle type="source" position={Position.Right} id="source-right" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" />
      <Handle type="source" position={Position.Bottom} id="source-bottom-human" style={{ left: '75%' }} />
    </div>
  );
};

// Import custom node components
import NoteNode from '../components/NoteNode';
import { StartNode, EndNode, ReturnNode } from '../components/StartEndNodes';

// Default node options when adding a new node
const getNewNode = (type: string, position: XYPosition, openNodeEditor: (id: string, data: any) => void): Node => {
  const nodeData = {
    agent: {
      label: 'Agent Process',
      content: 'Describe how the agent handles this step',
      type: 'agent',
      openNodeEditor
    },
    system: {
      label: 'Backend System',
      content: 'Integration with external system or database',
      type: 'system',
      openNodeEditor
    },
    guardrail: {
      label: 'Guardrail Check',
      content: 'Define validation, safety checks, or constraints',
      type: 'guardrail',
      openNodeEditor
    },
    decision: {
      label: 'Decision Point',
      content: 'Define a decision with multiple possible outcomes',
      type: 'decision',
      openNodeEditor
    },
    escalation: {
      label: 'Escalation Point',
      content: 'Define when and how to escalate to human agents',
      type: 'escalation',
      openNodeEditor
    },
    note: {
      label: 'Note',
      content: 'Add a note or comment about the agent journey',
      type: 'note',
      openNodeEditor
    },
    start: {
      label: 'Start',
      content: 'Entry point for the agent journey flow',
      type: 'start',
      openNodeEditor
    },
    end: {
      label: 'End',
      content: 'Final destination for the agent journey flow',
      type: 'end',
      openNodeEditor
    },
    return: {
      label: 'Return Point',
      content: 'Return point or loop in the agent journey',
      type: 'return',
      openNodeEditor
    }
  };

  const selectedType = type as keyof typeof nodeData;
  const data = nodeData[selectedType];

  return {
    id: `node_${Date.now()}`,
    type: selectedType,
    position,
    data,
  };
};

const AgentJourneyPage: React.FC = () => {
  // Get route match for journey ID
  const [match, params] = useRoute('/agent-journey/:id');
  const journeyId = match ? parseInt(params.id) : null;
  const isEditMode = journeyId !== null;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);
  const queryClient = useQueryClient();

  // Node and edge state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // UI state
  const [nodeMenuOpen, setNodeMenuOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Node editor state
  const [nodeEditorOpen, setNodeEditorOpen] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nodeEditorData, setNodeEditorData] = useState<{ label: string; content: string }>({
    label: '',
    content: ''
  });
  
  // AI Suggestion state
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  
  // Journey form state using useEditingState hook
  const initialJourney: InsertAgentJourney = {
    title: '',
    agentName: '',
    purpose: '',
    notes: '',
    summary: '',
    inputInterpretation: '',
    guardrails: '',
    backendSystems: [],
    contextManagement: '',
    escalationRules: '',
    errorMonitoring: '',
    nodes: [],
    edges: []
  };
  
  const {
    formState,
    setFormState,
    isEditing,
    startEditing,
    cancelEditing,
    hasChanges
  } = useEditingState<InsertAgentJourney>(initialJourney);

  // Add backend system field state
  const [newBackendSystem, setNewBackendSystem] = useState('');

  // Node editor handlers
  const openNodeEditor = useCallback((id: string, data: any) => {
    try {
      if (id && data) {
        setCurrentNodeId(id);
        setNodeEditorData({
          label: data.label || '',
          content: data.content || ''
        });
        setNodeEditorOpen(true);
        if (!isEditing) startEditing();
      } else {
        console.error("Invalid node data or ID for editor", { id, data });
      }
    } catch (error) {
      console.error("Error opening node editor:", error);
      // Handle error gracefully
      toast({
        title: "Error",
        description: "Failed to open node editor. Please try again.",
        variant: "destructive"
      });
    }
  }, [isEditing, startEditing, toast]);

  const saveNodeEdits = useCallback(() => {
    if (!currentNodeId) return;
    
    try {
      // Collect previous data to check if content actually changed
      let contentChanged = false;
      
      setNodes(nodes => nodes.map(node => {
        if (node.id === currentNodeId) {
          // Check if content changed (to trigger size recalculation)
          const previousLabel = node.data.label || '';
          const previousContent = node.data.content || '';
          const newLabel = nodeEditorData?.label || '';
          const newContent = nodeEditorData?.content || '';
          
          contentChanged = previousLabel !== newLabel || previousContent !== newContent;
          
          // Create a new data object with updated values while preserving other fields
          const updatedData = {
            ...node.data,
            label: newLabel,
            content: newContent,
            // Add a timestamp to force the component to re-measure if content changed
            _update: contentChanged ? Date.now() : node.data._update
          };
          
          return {
            ...node,
            data: updatedData
          };
        }
        return node;
      }));
      
      setNodeEditorOpen(false);
      setCurrentNodeId(null);
    } catch (error) {
      console.error("Error saving node edits:", error);
      toast({
        title: "Error",
        description: "Failed to save node edits. Please try again.",
        variant: "destructive"
      });
    }
  }, [currentNodeId, nodeEditorData, setNodes, toast]);

  // Query journey data if in edit mode
  const { data: journeyData, isLoading: isLoadingJourney } = useQuery({
    queryKey: ['/api/agent-journeys', journeyId],
    enabled: isEditMode,
    refetchOnWindowFocus: false
  });

  // Load journey data into form and flow when available
  useEffect(() => {
    if (journeyData) {
      const journey = journeyData as AgentJourney;
      
      setFormState({
        title: journey.title,
        agentName: journey.agentName || '',
        purpose: journey.purpose || '',
        notes: journey.notes || '',
        summary: journey.summary || '',
        inputInterpretation: journey.inputInterpretation || '',
        guardrails: journey.guardrails || '',
        backendSystems: Array.isArray(journey.backendSystems) ? journey.backendSystems : [],
        contextManagement: journey.contextManagement || '',
        escalationRules: journey.escalationRules || '',
        errorMonitoring: journey.errorMonitoring || '',
        nodes: journey.nodes as any,
        edges: journey.edges as any
      });

      // Load nodes and edges into ReactFlow
      try {
        if (journey.nodes && journey.edges) {
          // Add openNodeEditor to each node's data
          const nodesWithEditor = Array.isArray(journey.nodes) 
            ? journey.nodes.map(node => ({
                ...node,
                data: { ...node.data, openNodeEditor }
              }))
            : [];
            
          setNodes(nodesWithEditor);
          setEdges(Array.isArray(journey.edges) ? journey.edges : []);
        }
      } catch (error) {
        console.error("Error parsing journey flow data:", error);
        toast({
          title: "Error",
          description: "Failed to load journey flow data.",
          variant: "destructive"
        });
      }
    }
  }, [journeyData, setFormState, openNodeEditor]);

  // Save nodes and edges to form state before saving
  const updateFormFlowState = useCallback(() => {
    // Ensure nodes and edges are properly serialized
    setFormState((prev: InsertAgentJourney) => {
      // Make sure we have valid arrays, with stringified positions and data
      const formattedNodes = nodes.map(node => ({
        ...node,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        // Ensure any nested objects are properly serialized
        data: {
          ...node.data
        }
      }));
      
      // Make sure edges are properly serialized
      const formattedEdges = edges.map(edge => ({
        ...edge
      }));
      
      return {
        ...prev,
        nodes: formattedNodes,
        edges: formattedEdges
      };
    });
  }, [nodes, edges, setFormState]);

  // Save mutations
  const createMutation = useMutation({
    mutationFn: (journey: InsertAgentJourney) => {
      return apiRequest('POST', '/api/agent-journeys', journey);
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Agent journey created successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-journeys'] });
      navigate(`/agent-journey/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create agent journey.",
        variant: "destructive"
      });
      console.error("Create error:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (journey: InsertAgentJourney) => {
      return apiRequest('PATCH', `/api/agent-journeys/${journeyId}`, journey);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent journey updated successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-journeys', journeyId] });
      cancelEditing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update agent journey.",
        variant: "destructive"
      });
      console.error("Update error:", error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      return apiRequest('DELETE', `/api/agent-journeys/${journeyId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent journey deleted successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-journeys'] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete agent journey.",
        variant: "destructive"
      });
      console.error("Delete error:", error);
    }
  });

  // Save handler
  const handleSave = useCallback(() => {
    // Update the form state with current flow
    updateFormFlowState();
    
    // Use timeout to ensure form state has updated
    setTimeout(() => {
      try {
        // Validate and clean the journey data before saving
        const journeyToSave = {
          ...formState,
          // Ensure backendSystems is always a proper array
          backendSystems: Array.isArray(formState.backendSystems) 
            ? formState.backendSystems.map(s => String(s))
            : [],
          // Ensure nodes and edges are properly formatted
          nodes: nodes.map(node => ({
            ...node,
            position: {
              x: node.position.x,
              y: node.position.y
            },
            data: {
              ...node.data,
              // Remove any circular references or functions
              openNodeEditor: undefined
            }
          })),
          edges: edges.map(edge => ({
            ...edge,
            // Remove any circular references or functions if needed
          }))
        };
        
        // Save to API
        if (isEditMode) {
          updateMutation.mutate(journeyToSave);
        } else {
          createMutation.mutate(journeyToSave);
        }
      } catch (error) {
        console.error("Error preparing journey data for save:", error);
        toast({
          title: "Error",
          description: "Failed to prepare journey data for saving. Please try again.",
          variant: "destructive"
        });
      }
    }, 0);
  }, [formState, isEditMode, updateFormFlowState, updateMutation, createMutation, nodes, edges, toast]);

  // Handle form changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev: InsertAgentJourney) => ({
      ...prev,
      [name]: value
    }));
    if (!isEditing) startEditing();
  }, [setFormState, isEditing, startEditing]);

  // Handle backend systems
  const addBackendSystem = useCallback(() => {
    if (newBackendSystem.trim()) {
      setFormState((prev: InsertAgentJourney) => {
        // Ensure we always have a proper array
        const currentSystems = Array.isArray(prev.backendSystems) 
          ? prev.backendSystems.map(s => String(s)) 
          : [];
          
        return {
          ...prev,
          backendSystems: [...currentSystems, newBackendSystem.trim()]
        };
      });
      setNewBackendSystem('');
      if (!isEditing) startEditing();
    }
  }, [newBackendSystem, setFormState, isEditing, startEditing]);

  const removeBackendSystem = useCallback((system: string) => {
    setFormState((prev: InsertAgentJourney) => {
      // Ensure we always have a proper array
      const currentSystems = Array.isArray(prev.backendSystems) 
        ? prev.backendSystems.map(s => String(s))
        : [];
        
      return {
        ...prev,
        backendSystems: currentSystems.filter(s => s !== system)
      };
    });
    if (!isEditing) startEditing();
  }, [setFormState, isEditing, startEditing]);

  // ReactFlow event handlers
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges(edges => addEdge(newEdge, edges));
      if (!isEditing) startEditing();
    },
    [setEdges, isEditing, startEditing]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type || !reactFlowBounds || !reactFlowInstance.current) {
        return;
      }

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = getNewNode(type, position, openNodeEditor);
      setNodes(nodes => [...nodes, newNode]);
      if (!isEditing) startEditing();
    },
    [setNodes, isEditing, startEditing, openNodeEditor]
  );

  // Export to PDF
  const exportToPdf = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    setIsExporting(true);
    
    try {
      // Get nodes dimensions for centering
      const nodesBounds = getRectOfNodes(nodes);
      const transform = getTransformForBounds(
        nodesBounds,
        nodesBounds.width,
        nodesBounds.height,
        0.9,
        0 // Added padding argument
      );
      
      // Create a canvas from the flow
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: null,
        imageTimeout: 15000
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      // Add title and metadata
      pdf.setFontSize(20);
      pdf.text(`Agent Journey: ${formState.title}`, 20, 30);
      
      if (formState.agentName) {
        pdf.setFontSize(14);
        pdf.text(`Agent: ${formState.agentName}`, 20, 50);
      }
      
      if (formState.purpose) {
        pdf.setFontSize(12);
        pdf.text(`Purpose: ${formState.purpose}`, 20, 70);
      }
      
      // Add image
      pdf.addImage(imgData, 'PNG', 0, 90, canvas.width, canvas.height - 90);
      
      // Save PDF
      pdf.save(`agent-journey-${formState.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export the journey to PDF.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  }, [nodes, formState, toast]);
  
  // AI Suggestion function
  const fetchAiSuggestion = useCallback(async (agentType?: string) => {
    if (isLoadingSuggestion) return;
    
    setIsLoadingSuggestion(true);
    try {
      // Confirm with the user if they want to overwrite existing data
      if (!isEditMode && (formState.title || nodes.length > 0)) {
        if (!window.confirm('This will replace your current form data and nodes. Continue?')) {
          setIsLoadingSuggestion(false);
          return;
        }
      }
      
      // Construct the query params
      const queryParams = agentType ? `?type=${encodeURIComponent(agentType)}` : '';
      
      // Fetch suggestion from API
      const response = await fetch(`/api/agent-journeys/suggestion${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI suggestion');
      }
      
      const suggestion = await response.json();
      
      // Update form with suggestion data
      setFormState({
        title: suggestion.title || '',
        agentName: suggestion.agentName || '',
        purpose: suggestion.purpose || '',
        notes: suggestion.notes || '',
        summary: suggestion.summary || '',
        inputInterpretation: suggestion.inputInterpretation || '',
        guardrails: suggestion.guardrails || '',
        backendSystems: Array.isArray(suggestion.backendSystems) ? suggestion.backendSystems : [],
        contextManagement: suggestion.contextManagement || '',
        escalationRules: suggestion.escalationRules || '',
        errorMonitoring: suggestion.errorMonitoring || '',
        nodes: [], // Will populate nodes separately
        edges: []  // Will auto-generate edges
      });
      
      // Create flow nodes from suggestion
      if (Array.isArray(suggestion.nodesSuggestion) && suggestion.nodesSuggestion.length > 0) {
        // Clear existing nodes
        setNodes([]);
        setEdges([]);
        
        // Create new nodes from suggestion
        const newNodes = suggestion.nodesSuggestion.map((nodeSuggestion: any, index: number) => {
          // Generate a stable ID based on node type and position
          const id = `node_${nodeSuggestion.type}_${index}`;
          
          return {
            id,
            type: nodeSuggestion.type,
            position: nodeSuggestion.position || { x: 100 + index * 200, y: 100 + (index % 2) * 100 },
            data: {
              label: nodeSuggestion.label || `Node ${index + 1}`,
              content: nodeSuggestion.content || '',
              openNodeEditor
            }
          };
        });
        
        // Add the nodes to the canvas
        setNodes(newNodes);
        
        // Create edges connecting nodes in sequence (you could make this more complex)
        const newEdges = [];
        for (let i = 0; i < newNodes.length - 1; i++) {
          newEdges.push({
            id: `edge_${i}_${i+1}`,
            source: newNodes[i].id,
            target: newNodes[i+1].id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            }
          });
        }
        
        // Add the edges to the canvas
        setEdges(newEdges);
      }
      
      // Start editing
      if (!isEditing) startEditing();
      
      // Close any open dialogs
      const closeButtons = document.querySelectorAll('[data-radix-collection-item]');
      closeButtons.forEach((button: any) => {
        if (button.textContent.includes('Cancel')) {
          button.click();
        }
      });
      
      toast({
        title: "Success",
        description: "AI suggestion applied successfully! Review and customize as needed."
      });
      
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
      toast({
        title: "Error",
        description: `Failed to get AI suggestion: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [isLoadingSuggestion, isEditMode, formState.title, nodes.length, setFormState, setNodes, setEdges, isEditing, startEditing, toast, openNodeEditor]);

  // Generate flow visualization based on the journey metadata
  const generateFlowFromMetadata = useCallback(async () => {
    if (isGeneratingFlow || nodes.length > 0 || !formState.title) return;
    
    try {
      setIsGeneratingFlow(true);
      
      // Create initial nodes based on the journey metadata
      const newNodes: Node[] = [];
      const spacing = 200;  // spacing between nodes
      const startPosition = { x: 100, y: 100 };
      
      // Add start node
      const startNode = getNewNode('start', startPosition, openNodeEditor);
      startNode.id = 'start-node';
      newNodes.push(startNode);
      
      // Add agent node based on input interpretation
      if (formState.inputInterpretation) {
        const inputNode = getNewNode('agent', { x: startPosition.x + spacing, y: startPosition.y }, openNodeEditor);
        inputNode.id = 'input-node';
        inputNode.data.label = 'Input Processing';
        inputNode.data.content = formState.inputInterpretation.substring(0, 150) + (formState.inputInterpretation.length > 150 ? '...' : '');
        newNodes.push(inputNode);
      }
      
      // Add guardrail node if present
      if (formState.guardrails) {
        const guardrailsNode = getNewNode('guardrail', { x: startPosition.x + spacing * 2, y: startPosition.y }, openNodeEditor);
        guardrailsNode.id = 'guardrails-node';
        guardrailsNode.data.label = 'Content Guardrails';
        guardrailsNode.data.content = formState.guardrails.substring(0, 150) + (formState.guardrails.length > 150 ? '...' : '');
        newNodes.push(guardrailsNode);
      }
      
      // Add backend systems if present
      if (Array.isArray(formState.backendSystems) && formState.backendSystems.length > 0) {
        const systemsNode = getNewNode('system', { x: startPosition.x + spacing * 2, y: startPosition.y + spacing }, openNodeEditor);
        systemsNode.id = 'backend-systems-node';
        systemsNode.data.label = 'Backend Systems';
        systemsNode.data.content = formState.backendSystems.join(', ');
        newNodes.push(systemsNode);
      }
      
      // Add context management node if present
      if (formState.contextManagement) {
        const contextNode = getNewNode('agent', { x: startPosition.x + spacing * 3, y: startPosition.y }, openNodeEditor);
        contextNode.id = 'context-node';
        contextNode.data.label = 'Context Management';
        contextNode.data.content = formState.contextManagement.substring(0, 150) + (formState.contextManagement.length > 150 ? '...' : '');
        newNodes.push(contextNode);
      }
      
      // Add escalation node if present
      if (formState.escalationRules) {
        const escalationNode = getNewNode('escalation', { x: startPosition.x + spacing * 3, y: startPosition.y + spacing }, openNodeEditor);
        escalationNode.id = 'escalation-node';
        escalationNode.data.label = 'Escalation Path';
        escalationNode.data.content = formState.escalationRules.substring(0, 150) + (formState.escalationRules.length > 150 ? '...' : '');
        newNodes.push(escalationNode);
      }
      
      // Add error monitoring
      if (formState.errorMonitoring) {
        const errorNode = getNewNode('note', { x: startPosition.x + spacing * 4, y: startPosition.y + spacing }, openNodeEditor);
        errorNode.id = 'error-node';
        errorNode.data.label = 'Error Monitoring';
        errorNode.data.content = formState.errorMonitoring.substring(0, 150) + (formState.errorMonitoring.length > 150 ? '...' : '');
        newNodes.push(errorNode);
      }
      
      // Add end node
      const endNode = getNewNode('end', { x: startPosition.x + spacing * 4, y: startPosition.y }, openNodeEditor);
      endNode.id = 'end-node';
      newNodes.push(endNode);
      
      // Create edges to connect the nodes
      const newEdges = [];
      for (let i = 0; i < newNodes.length - 1; i++) {
        // Don't add edges from note nodes
        if (newNodes[i].type === 'note') continue;
        
        // Skip over note nodes when connecting
        let nextIdx = i + 1;
        while (nextIdx < newNodes.length && newNodes[nextIdx].type === 'note') {
          nextIdx++;
        }
        
        if (nextIdx < newNodes.length) {
          newEdges.push({
            id: `edge-${newNodes[i].id}-${newNodes[nextIdx].id}`,
            source: newNodes[i].id,
            target: newNodes[nextIdx].id,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
      }
      
      // Connect escalation node to end node if both exist
      const escalationNode = newNodes.find(node => node.id === 'escalation-node');
      if (escalationNode) {
        newEdges.push({
          id: `edge-escalation-end`,
          source: 'escalation-node',
          target: 'end-node',
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
      
      // Update the flow with new nodes and edges
      setNodes(newNodes);
      setEdges(newEdges);
      
      // Mark the form as edited
      startEditing();
      
      toast({
        title: "Success",
        description: "Flow generated from journey metadata!",
      });
    } catch (error) {
      console.error('Error generating flow from metadata:', error);
      toast({
        title: "Error",
        description: "Failed to generate flow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFlow(false);
    }
  }, [formState, setNodes, setEdges, startEditing, toast, isGeneratingFlow, nodes.length, openNodeEditor]);

  // Memoize nodeTypes to avoid React Flow warning
  const nodeTypes = useMemo<NodeTypes>(() => ({
    agent: AutoSizingAgentNode,
    system: SystemNode,
    guardrail: GuardrailNode,
    decision: DecisionNode,
    escalation: EscalationNode,
    note: NoteNode,
    start: StartNode,
    end: EndNode,
    return: ReturnNode
  }), []);

  // Generate a node for dragging
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left panel - Flow canvas */}
          <div className="w-full lg:w-[75%] h-[60vh] lg:h-[calc(100vh-140px)] min-h-[600px] relative">
            <div ref={reactFlowWrapper} className="h-full w-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={(instance) => {
                  reactFlowInstance.current = instance;
                }}
                nodeTypes={nodeTypes}
                onDragOver={onDragOver}
                onDrop={onDrop}
                fitView
                attributionPosition="bottom-left"
                connectionLineType={ConnectionLineType.SmoothStep}
                deleteKeyCode="Delete"
              >
                <Background />
                <Controls />
                <MiniMap zoomable pannable />
                
                {/* Node toolbar */}
                <Panel position="top-right" className="bg-card border rounded-md shadow-md p-2">
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setNodeMenuOpen(!nodeMenuOpen)}
                    >
                      <Plus size={16} className="mr-1" /> 
                      Add Node
                    </Button>
                    
                    {nodeMenuOpen && (
                      <div className="flex flex-col gap-1 mt-1">
                        {/* Flow control nodes */}
                        <div className="text-xs text-muted-foreground font-medium mt-1 mb-1 px-2">Flow Control:</div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'start')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <Play size={14} className="mr-2 text-green-500" />
                          Start
                        </div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'end')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <Square size={14} className="mr-2 text-red-500" />
                          End
                        </div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'return')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <RotateCcw size={14} className="mr-2 text-indigo-500" />
                          Return Point
                        </div>

                        {/* Agent process nodes */}
                        <div className="text-xs text-muted-foreground font-medium mt-3 mb-1 px-2">Agent Processes:</div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'agent')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <Bot size={14} className="mr-2 text-primary" />
                          Agent Process
                        </div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'system')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <Database size={14} className="mr-2 text-blue-500" />
                          Backend System
                        </div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'guardrail')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <Shield size={14} className="mr-2 text-red-500" />
                          Guardrail Check
                        </div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'decision')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <GitBranch size={14} className="mr-2 text-purple-500" />
                          Decision Point
                        </div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'escalation')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <AlertTriangle size={14} className="mr-2 text-orange-500" />
                          Escalation Point
                        </div>
                        
                        {/* Documentation */}
                        <div className="text-xs text-muted-foreground font-medium mt-3 mb-1 px-2">Documentation:</div>
                        <div
                          onDragStart={(event) => onDragStart(event, 'note')}
                          draggable
                          className="bg-background hover:bg-accent text-sm p-2 rounded cursor-grab flex items-center"
                        >
                          <StickyNote size={14} className="mr-2 text-yellow-500" />
                          Note
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
                
                {/* Actions toolbar */}
                <Panel position="top-left" className="flex gap-2">
                  <Button 
                    onClick={() => navigate("/")} 
                    variant="outline" 
                    size="sm"
                  >
                    <ChevronLeft size={16} className="mr-1" /> Back
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    disabled={isLoadingJourney || createMutation.isPending || updateMutation.isPending}
                    size="sm"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 size={16} className="mr-1 animate-spin" />
                    ) : (
                      <Save size={16} className="mr-1" />
                    )}
                    Save
                  </Button>
                  
                  <Button
                    onClick={exportToPdf}
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 size={16} className="mr-1 animate-spin" />
                    ) : (
                      <Map size={16} className="mr-1" />
                    )}
                    Export
                  </Button>
                  
                  {isEditMode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this agent journey? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            variant="destructive" 
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && (
                              <Loader2 size={16} className="mr-1 animate-spin" />
                            )}
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </Panel>
              </ReactFlow>
            </div>
          </div>
          
          {/* Right panel - Journey details */}
          <div className="w-full lg:w-[25%] flex-shrink-0 border-l bg-card overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Agent Journey Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowGuide(!showGuide)}
                >
                  <HelpCircle size={16} />
                </Button>
              </div>
              
              <div className="mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="w-full"
                    >
                      <Bot size={16} className="mr-2" />
                      AI Suggest Journey Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>AI Journey Suggestion</DialogTitle>
                      <DialogDescription>
                        Get AI-generated example fields for your agent journey.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="agentType">Agent Type (Optional)</Label>
                        <Input
                          id="agentType"
                          placeholder="e.g., Customer Service, Technical Support, Travel, etc."
                        />
                        <p className="text-xs text-muted-foreground">
                          Specify a type of agent or leave blank for a general example.
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm font-medium">What will be generated:</p>
                        <ul className="text-xs mt-2 space-y-1 list-disc pl-4">
                          <li>Detailed form fields including title, purpose, and all metadata</li>
                          <li>Example guardrails and context management rules</li>
                          <li>Sample backend systems and escalation policies</li>
                        </ul>
                        <p className="text-xs mt-2 text-muted-foreground italic">
                          This will only update the form fields and will NOT make any changes to your canvas.
                        </p>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={() => {
                          const agentTypeInput = document.getElementById('agentType') as HTMLInputElement;
                          const agentType = agentTypeInput?.value?.trim();
                          
                          // Use a modified version that doesn't touch the canvas
                          setIsLoadingSuggestion(true);
                          fetch(`/api/agent-journeys/suggestion${agentType ? `?type=${encodeURIComponent(agentType)}` : ''}`)
                            .then(res => {
                              if (!res.ok) throw new Error('Failed to get suggestion');
                              return res.json();
                            })
                            .then(suggestion => {
                              // Only update form fields, not canvas
                              setFormState(prev => ({
                                ...prev,
                                title: suggestion.title || '',
                                agentName: suggestion.agentName || '',
                                purpose: suggestion.purpose || '',
                                notes: suggestion.notes || '',
                                summary: suggestion.summary || '',
                                inputInterpretation: suggestion.inputInterpretation || '',
                                guardrails: suggestion.guardrails || '',
                                backendSystems: Array.isArray(suggestion.backendSystems) ? suggestion.backendSystems : [],
                                contextManagement: suggestion.contextManagement || '',
                                escalationRules: suggestion.escalationRules || '',
                                errorMonitoring: suggestion.errorMonitoring || '',
                                // Keep existing nodes and edges
                                nodes: prev.nodes,
                                edges: prev.edges
                              }));
                              
                              // Start editing mode if not already
                              if (!isEditing) startEditing();
                              
                              // Close dialog
                              const closeButtons = document.querySelectorAll('[data-radix-collection-item]');
                              closeButtons.forEach((button: any) => {
                                if (button.textContent.includes('Cancel')) {
                                  button.click();
                                }
                              });
                              
                              toast({
                                title: "Success",
                                description: "AI suggestion applied to form fields. Canvas remains unchanged."
                              });
                            })
                            .catch(error => {
                              console.error('Error fetching AI suggestion:', error);
                              toast({
                                title: "Error",
                                description: error.message || 'Failed to get AI suggestion',
                                variant: "destructive"
                              });
                            })
                            .finally(() => {
                              setIsLoadingSuggestion(false);
                            });
                        }}
                        disabled={isLoadingSuggestion}
                      >
                        {isLoadingSuggestion ? (
                          <Loader2 size={16} className="mr-1 animate-spin" />
                        ) : (
                          <Bot size={16} className="mr-1" />
                        )}
                        Generate Fields
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {showGuide && (
                <Card className="mb-4 bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">How to use this editor</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <p><strong>1.</strong> Drag nodes from the toolbar to the canvas.</p>
                    <p><strong>2.</strong> Connect nodes by dragging from one handle to another.</p>
                    <p><strong>3.</strong> Click on nodes to edit their contents.</p>
                    <p><strong>4.</strong> Complete all fields in the form.</p>
                    <p><strong>5.</strong> Save your journey when finished.</p>
                    <p><strong>Tip:</strong> Use the <strong>AI Suggest Journey Details</strong> button to get AI-generated form fields!</p>
                  </CardContent>
                </Card>
              )}
              
              {isLoadingJourney ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formState.title || ''}
                        onChange={handleInputChange}
                        placeholder="Enter a title for this agent journey"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        name="agentName"
                        value={formState.agentName || ''}
                        onChange={handleInputChange}
                        placeholder="Enter a name for this agent"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose</Label>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        value={formState.purpose || ''}
                        onChange={handleInputChange}
                        placeholder="What's the main purpose of this agent?"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="inputInterpretation">Input Interpretation</Label>
                      <Textarea
                        id="inputInterpretation"
                        name="inputInterpretation"
                        value={formState.inputInterpretation || ''}
                        onChange={handleInputChange}
                        placeholder="How does this agent interpret user inputs?"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guardrails">Guardrails</Label>
                      <Textarea
                        id="guardrails"
                        name="guardrails"
                        value={formState.guardrails || ''}
                        onChange={handleInputChange}
                        placeholder="What safety measures or guardrails are in place?"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Backend Systems</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newBackendSystem"
                          value={newBackendSystem}
                          onChange={(e) => setNewBackendSystem(e.target.value)}
                          placeholder="Add backend system or API"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addBackendSystem}
                          disabled={!newBackendSystem.trim()}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formState.backendSystems && formState.backendSystems.length > 0 ? (
                          formState.backendSystems.map((system, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              <Database size={12} />
                              {String(system)}
                              <button
                                type="button"
                                onClick={() => removeBackendSystem(String(system))}
                                className="text-muted-foreground hover:text-foreground ml-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No backend systems added</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contextManagement">Context Management</Label>
                      <Textarea
                        id="contextManagement"
                        name="contextManagement"
                        value={formState.contextManagement || ''}
                        onChange={handleInputChange}
                        placeholder="How does this agent maintain context during a conversation?"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="escalationRules">Escalation Rules</Label>
                      <Textarea
                        id="escalationRules"
                        name="escalationRules"
                        value={formState.escalationRules || ''}
                        onChange={handleInputChange}
                        placeholder="When and how does this agent escalate issues?"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="errorMonitoring">Error Monitoring</Label>
                      <Textarea
                        id="errorMonitoring"
                        name="errorMonitoring"
                        value={formState.errorMonitoring || ''}
                        onChange={handleInputChange}
                        placeholder="How are errors monitored and handled?"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formState.notes || ''}
                        onChange={handleInputChange}
                        placeholder="Additional notes about this agent journey"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="summary">Journey Summary</Label>
                      <Textarea
                        id="summary"
                        name="summary"
                        value={formState.summary || ''}
                        onChange={handleInputChange}
                        placeholder="Summary of the agent journey (can be AI-generated)"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-1"
                          onClick={generateFlowFromMetadata}
                          disabled={nodes.length > 0 || !formState.title || isGeneratingFlow}
                        >
                          {isGeneratingFlow ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating Flow...
                            </>
                          ) : (
                            <>
                              <MagicWand className="mr-2 h-4 w-4" />
                              Generate Flow from Metadata
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Node Editor Dialog */}
      {nodeEditorOpen && (
        <Dialog open={nodeEditorOpen} onOpenChange={(open) => {
          if (!open) {
            setNodeEditorOpen(false);
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Node</DialogTitle>
              <DialogDescription>
                Update the content and properties of this node
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nodeName" className="text-right">
                  Label
                </Label>
                <Input
                  id="nodeName"
                  value={nodeEditorData?.label || ''}
                  onChange={(e) => setNodeEditorData((prev) => ({...prev, label: e.target.value}))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nodeContent" className="text-right">
                  Content
                </Label>
                <Textarea
                  id="nodeContent"
                  value={nodeEditorData?.content || ''}
                  onChange={(e) => setNodeEditorData((prev) => ({...prev, content: e.target.value}))}
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setNodeEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveNodeEdits}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AgentJourneyPage;