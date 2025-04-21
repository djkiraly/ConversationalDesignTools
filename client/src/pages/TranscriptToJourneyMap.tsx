import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { Transcript, JourneyMap } from '@shared/schema';
import { ArrowLeft, GitGraph, FileText, MessageSquare, Save, RotateCcw } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Node colors by type
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

// Form schema for journey map creation
const createJourneyMapSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export default function TranscriptToJourneyMapPage() {
  const { transcriptId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const parsedTranscriptId = parseInt(transcriptId);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Form for creating journey map
  const form = useForm<z.infer<typeof createJourneyMapSchema>>({
    resolver: zodResolver(createJourneyMapSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Fetch transcript details
  const {
    data: transcript,
    isLoading: isLoadingTranscript,
    isError: isErrorTranscript,
  } = useQuery<Transcript>({
    queryKey: [`/api/transcripts/${parsedTranscriptId}`],
    enabled: !isNaN(parsedTranscriptId),
    refetchOnWindowFocus: false,
  });

  // Set default title when transcript loads
  useEffect(() => {
    if (transcript) {
      form.setValue('title', `Journey Map from: ${transcript.title}`);
    }
  }, [transcript, form]);

  // Parse journey map data from transcript analysis
  useEffect(() => {
    if (transcript?.analyzedFlow) {
      try {
        const analysisData = typeof transcript.analyzedFlow === 'string' 
          ? JSON.parse(transcript.analyzedFlow) 
          : transcript.analyzedFlow;
        
        if (analysisData.journeyMap) {
          // Add custom node type to all nodes
          const customNodes = analysisData.journeyMap.nodes.map(node => ({
            ...node,
            type: 'custom',
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          }));
          
          // Add marker types to edges
          const customEdges = analysisData.journeyMap.edges.map(edge => ({
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
        }
      } catch (e) {
        console.error("Error parsing journey map data from transcript:", e);
        setNodes([]);
        setEdges([]);
      }
    }
  }, [transcript, setNodes, setEdges]);

  // Mutation for creating a new journey map
  const createJourneyMapMutation = useMutation({
    mutationFn: (data: z.infer<typeof createJourneyMapSchema>) => {
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
      
      // Extract insights from transcript analysis
      let insights = null;
      if (transcript?.analyzedFlow) {
        const analysisData = typeof transcript.analyzedFlow === 'string' 
          ? JSON.parse(transcript.analyzedFlow) 
          : transcript.analyzedFlow;
        
        if (analysisData.insights) {
          insights = analysisData.insights;
        }
      }
      
      return apiRequest('/api/journey-maps', 'POST', {
        ...data,
        nodeData,
        nodeStyles: null,
        insights,
        transcriptId: parsedTranscriptId
      });
    },
    onSuccess: (data) => {
      setIsCreating(false);
      toast({
        title: "Success",
        description: "Journey map created successfully",
      });
      // Navigate to the new journey map
      setLocation(`/journey-map/${data.id}`);
    },
    onError: (error) => {
      setIsCreating(false);
      toast({
        title: "Error creating journey map",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Submit handler for creating journey map
  function onSubmit(values: z.infer<typeof createJourneyMapSchema>) {
    if (!transcript?.analyzedFlow) {
      toast({
        title: "Error",
        description: "Transcript hasn't been analyzed yet. Please analyze it first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    createJourneyMapMutation.mutate(values);
  }

  return (
    <div className="container mx-auto p-4 pt-6">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/transcript/${parsedTranscriptId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Transcript
        </Button>
      </div>
      
      {isLoadingTranscript ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[600px] w-full mt-6" />
        </div>
      ) : isErrorTranscript || !transcript ? (
        <div className="text-center p-10">
          <p className="text-destructive mb-4">Failed to load transcript data.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ 
              queryKey: [`/api/transcripts/${parsedTranscriptId}`] 
            })}
          >
            Retry
          </Button>
        </div>
      ) : !transcript.analyzedFlow ? (
        <div className="text-center p-10">
          <p className="text-amber-500 mb-4">
            This transcript hasn't been analyzed yet. Please analyze it first to generate a journey map.
          </p>
          <Button 
            onClick={() => setLocation(`/transcript/${parsedTranscriptId}`)}
          >
            Go Back to Analyze
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitGraph className="h-5 w-5" />
                    Journey Map Preview
                  </CardTitle>
                  <CardDescription>
                    Generated from {transcript.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[500px] border rounded-md">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
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
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Save Journey Map</CardTitle>
                  <CardDescription>
                    Create a new customer journey map from this analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isCreating}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isCreating ? "Creating..." : "Save Journey Map"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Transcript Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-md p-4 max-h-[200px] overflow-y-auto text-sm">
                <p className="line-clamp-6">{transcript.content}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}