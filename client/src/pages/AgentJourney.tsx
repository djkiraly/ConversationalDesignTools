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
  Check,
  Terminal,
  Shield,
  Database,
  MessageCircle,
  AlertTriangle,
  BarChart2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { AgentJourney, InsertAgentJourney } from "@shared/schema";
import useEditingState from "@/hooks/useEditingState";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

// Custom node components
const AgentNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`node agent-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}>
    <div className="flex items-center space-x-2 mb-2">
      <Bot size={20} className="text-primary" />
      <div className="font-medium">{data.label}</div>
    </div>
    <div className="text-sm text-muted-foreground">{data.content}</div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const SystemNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`node system-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}>
    <div className="flex items-center space-x-2 mb-2">
      <Database size={20} className="text-blue-500" />
      <div className="font-medium">{data.label}</div>
    </div>
    <div className="text-sm text-muted-foreground">{data.content}</div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

const GuardrailNode = ({ data, selected }: { data: any, selected: boolean }) => (
  <div className={`node guardrail-node rounded-md p-4 w-[300px] ${selected ? 'border-2 border-primary' : 'border border-border'} bg-background`}>
    <div className="flex items-center space-x-2 mb-2">
      <Shield size={20} className="text-red-500" />
      <div className="font-medium">{data.label}</div>
    </div>
    <div className="text-sm text-muted-foreground">{data.content}</div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
);

// Register custom nodes
const nodeTypes: NodeTypes = {
  agent: AgentNode,
  system: SystemNode,
  guardrail: GuardrailNode,
};

// Default node options when adding a new node
const getNewNode = (type: string, position: XYPosition): Node => {
  const nodeData = {
    agent: {
      label: 'Agent Process',
      content: 'Describe how the agent handles this step',
      type: 'agent'
    },
    system: {
      label: 'Backend System',
      content: 'Integration with external system or database',
      type: 'system'
    },
    guardrail: {
      label: 'Guardrail Check',
      content: 'Define validation, safety checks, or constraints',
      type: 'guardrail'
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
        nodes: journey.nodes,
        edges: journey.edges
      });

      // Load nodes and edges into ReactFlow
      try {
        if (journey.nodes && journey.edges) {
          setNodes(Array.isArray(journey.nodes) ? journey.nodes : []);
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
  }, [journeyData, setFormState]);

  // Save nodes and edges to form state before saving
  const updateFormFlowState = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      nodes: nodes,
      edges: edges
    }));
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
    updateFormFlowState();
    
    // Use timeout to ensure form state has updated
    setTimeout(() => {
      if (isEditMode) {
        updateMutation.mutate(formState);
      } else {
        createMutation.mutate(formState);
      }
    }, 0);
  }, [formState, isEditMode, updateFormFlowState, updateMutation, createMutation]);

  // Handle form changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    if (!isEditing) startEditing();
  }, [setFormState, isEditing, startEditing]);

  // Handle backend systems
  const addBackendSystem = useCallback(() => {
    if (newBackendSystem.trim()) {
      setFormState(prev => ({
        ...prev,
        backendSystems: [...prev.backendSystems, newBackendSystem.trim()]
      }));
      setNewBackendSystem('');
      if (!isEditing) startEditing();
    }
  }, [newBackendSystem, setFormState, isEditing, startEditing]);

  const removeBackendSystem = useCallback((system: string) => {
    setFormState(prev => ({
      ...prev,
      backendSystems: prev.backendSystems.filter(s => s !== system)
    }));
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

      const newNode = getNewNode(type, position);
      setNodes(nodes => [...nodes, newNode]);
      if (!isEditing) startEditing();
    },
    [setNodes, isEditing, startEditing]
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
        0.9
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

  // Generate a node for dragging
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
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
                      value={formState.title}
                      onChange={handleInputChange}
                      placeholder="Enter agent journey title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agentName">Agent Name</Label>
                    <Input
                      id="agentName"
                      name="agentName"
                      value={formState.agentName}
                      onChange={handleInputChange}
                      placeholder="Name of the AI agent"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      value={formState.purpose}
                      onChange={handleInputChange}
                      placeholder="Describe the purpose of this agent"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inputInterpretation">Input Interpretation</Label>
                    <Textarea
                      id="inputInterpretation"
                      name="inputInterpretation"
                      value={formState.inputInterpretation}
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
                      value={formState.guardrails}
                      onChange={handleInputChange}
                      placeholder="What safety rules and limitations does this agent have?"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Backend Systems</Label>
                    <div className="flex gap-2">
                      <Input
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
                      {formState.backendSystems.map((system, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Database size={12} />
                          {system}
                          <button
                            type="button"
                            onClick={() => removeBackendSystem(system)}
                            className="text-muted-foreground hover:text-foreground ml-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </Badge>
                      ))}
                      {formState.backendSystems.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No backend systems added</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contextManagement">Context Management</Label>
                    <Textarea
                      id="contextManagement"
                      name="contextManagement"
                      value={formState.contextManagement}
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
                      value={formState.escalationRules}
                      onChange={handleInputChange}
                      placeholder="When and how should this agent escalate to humans?"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="errorMonitoring">Error Monitoring</Label>
                    <Textarea
                      id="errorMonitoring"
                      name="errorMonitoring"
                      value={formState.errorMonitoring}
                      onChange={handleInputChange}
                      placeholder="How are errors detected and handled?"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formState.notes}
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
                  </div>
                </form>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentJourneyPage;