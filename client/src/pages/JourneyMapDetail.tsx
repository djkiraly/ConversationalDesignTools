import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { JourneyMap, JourneyData, JourneyNode } from '@shared/schema';
import { ArrowLeft, Save, DownloadCloud, Upload, RotateCcw, Plus, Trash2 } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NODE_TYPES = {
  entry: 'input',
  exit: 'output',
  decision: 'default',
  process: 'default',
  action: 'default', 
};

const nodeColors = {
  entry: '#10b981',
  exit: '#f43f5e',
  decision: '#f59e0b',
  process: '#3b82f6',
  action: '#8b5cf6',
  default: '#64748b',
};

// Custom node component
const CustomNode = ({ data, id, selected }) => {
  const nodeType = data.nodeType || 'default';
  const nodeColor = nodeColors[nodeType] || nodeColors.default;
  
  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md border-2 ${
        selected ? 'border-primary' : `border-[${nodeColor}]`
      }`}
      style={{ 
        backgroundColor: `${nodeColor}20`,
        borderColor: nodeColor,
        minWidth: '150px',
        maxWidth: '200px' 
      }}
    >
      <div className="font-medium text-sm mb-1">{data.label}</div>
      {data.description && (
        <div className="text-xs text-muted-foreground line-clamp-2">{data.description}</div>
      )}
      {data.metrics && (
        <div className="mt-2 space-y-1">
          {data.metrics.frequency !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Frequency:</span>
              <span className="font-medium">{data.metrics.frequency}%</span>
            </div>
          )}
          {data.metrics.duration !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Duration:</span>
              <span className="font-medium">{data.metrics.duration}s</span>
            </div>
          )}
          {data.metrics.satisfaction !== undefined && (
            <div className="flex justify-between text-xs">
              <span>Satisfaction:</span>
              <span className="font-medium">{Math.round(data.metrics.satisfaction * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function JourneyMapDetailPage() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const journeyMapId = parseInt(id);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);

  // State for saving status
  const [isSaving, setIsSaving] = useState(false);

  // Fetch journey map details
  const {
    data: journeyMap,
    isLoading,
    isError,
  } = useQuery<JourneyMap>({
    queryKey: [`/api/journey-maps/${journeyMapId}`],
    enabled: !isNaN(journeyMapId),
    refetchOnWindowFocus: false,
  });

  // Parse journey map data
  useEffect(() => {
    if (journeyMap && journeyMap.nodeData) {
      try {
        const data = typeof journeyMap.nodeData === 'string' 
          ? JSON.parse(journeyMap.nodeData) 
          : journeyMap.nodeData;
        
        // Add custom node type to all nodes
        const customNodes = data.nodes.map(node => ({
          ...node,
          type: 'custom',
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        }));
        
        // Add marker types to edges
        const customEdges = data.edges.map(edge => ({
          ...edge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { 
            strokeWidth: 2,
            stroke: edge.type === 'success' ? '#10b981' : 
                    edge.type === 'warning' ? '#f59e0b' :
                    edge.type === 'error' ? '#f43f5e' : '#64748b'
          }
        }));

        setNodes(customNodes);
        setEdges(customEdges);
      } catch (e) {
        console.error("Error parsing journey map data:", e);
        setNodes([]);
        setEdges([]);
      }
    }
  }, [journeyMap, setNodes, setEdges]);

  // Mutation for optimizing a journey map
  const optimizeJourneyMapMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/journey-maps/${journeyMapId}/optimize`, 'POST');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/journey-maps/${journeyMapId}`] });
      setIsOptimizing(false);
      toast({
        title: "Optimization Complete",
        description: "Journey map has been optimized with AI suggestions",
      });
    },
    onError: (error) => {
      setIsOptimizing(false);
      toast({
        title: "Error optimizing journey map",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for saving journey map changes
  const saveJourneyMapMutation = useMutation({
    mutationFn: (data: { nodeData: JourneyData }) => {
      return apiRequest(`/api/journey-maps/${journeyMapId}`, 'PUT', data);
    },
    onSuccess: () => {
      setIsSaving(false);
      toast({
        title: "Success",
        description: "Journey map saved successfully",
      });
    },
    onError: (error) => {
      setIsSaving(false);
      toast({
        title: "Error saving journey map",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle optimize journey map
  function handleOptimize() {
    setIsOptimizing(true);
    optimizeJourneyMapMutation.mutate();
  }

  // Handle saving journey map
  function handleSave() {
    setIsSaving(true);
    
    // Prepare node data for saving
    const nodeData = {
      nodes: nodes.map(({ id, position, data, type, sourcePosition, targetPosition, ...rest }) => ({
        id,
        position,
        data,
        type: type === 'custom' ? data.nodeType || 'default' : type,
        ...rest,
      })),
      edges,
    };
    
    saveJourneyMapMutation.mutate({ nodeData });
  }

  // Handle adding a new node
  function handleAddNode(type: string) {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        nodeType: type,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: '',
        metrics: type !== 'decision' ? {
          frequency: 0,
          duration: 0,
          satisfaction: 0,
        } : undefined,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    
    setNodes((nds) => nds.concat(newNode));
  }

  // Handle edge connections
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: { strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  return (
    <div className="container mx-auto p-4 pt-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => setLocation('/journey-maps')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Journey Maps
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isOptimizing ? "Optimizing..." : "Optimize with AI"}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[600px] w-full mt-6" />
        </div>
      ) : isError || !journeyMap ? (
        <div className="text-center p-10">
          <p className="text-destructive mb-4">Failed to load journey map details.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ 
              queryKey: [`/api/journey-maps/${journeyMapId}`] 
            })}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2">{journeyMap.title}</h1>
          {journeyMap.description && (
            <p className="text-muted-foreground mb-4">{journeyMap.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card className="md:col-span-3">
              <CardHeader className="pb-0">
                <div className="flex justify-between">
                  <div className="flex gap-1 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleAddNode('entry')}
                      className="h-8 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Entry
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddNode('process')}
                      className="h-8 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Process
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddNode('decision')}
                      className="h-8 bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Decision
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddNode('action')}
                      className="h-8 bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Action
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddNode('exit')}
                      className="h-8 bg-red-50 border-red-200 hover:bg-red-100 text-red-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Exit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="w-full h-[600px] border rounded-md">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                  >
                    <Background />
                    <Controls />
                    <MiniMap
                      nodeColor={(node) => {
                        const type = node.data?.nodeType || 'default';
                        return nodeColors[type] || nodeColors.default;
                      }}
                    />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Journey Insights</CardTitle>
                <CardDescription>
                  AI-generated insights about this customer journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {journeyMap.insights ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-medium mb-1">Bottlenecks</h3>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {journeyMap.insights?.bottlenecks?.map((item, i) => (
                          <li key={i}>{item.reason}</li>
                        ))}
                        {(!journeyMap.insights?.bottlenecks || journeyMap.insights.bottlenecks.length === 0) && (
                          <p>No significant bottlenecks identified</p>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Improvement Opportunities</h3>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {journeyMap.insights?.improvements?.map((item, i) => (
                          <li key={i}>{item.description}</li>
                        ))}
                        {(!journeyMap.insights?.improvements || journeyMap.insights.improvements.length === 0) && (
                          <p>No specific improvements suggested</p>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Use AI to optimize this journey map and get valuable insights.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleOptimize}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? "Optimizing..." : "Generate Insights"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}