import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { JourneyMap } from '@shared/schema';
import { PlusCircle, Trash2, GitGraph, ArrowUpRight, Share2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create form schema for journey map creation
const createJourneyMapSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export default function JourneyMapsPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isNewJourneyMapOpen, setIsNewJourneyMapOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState<number | null>(null);

  // Fetch all journey maps
  const {
    data: journeyMaps = [],
    isLoading,
    isError,
  } = useQuery<JourneyMap[]>({
    queryKey: ['/api/journey-maps'],
    refetchOnWindowFocus: false,
  });

  // Form for creating new journey maps
  const form = useForm<z.infer<typeof createJourneyMapSchema>>({
    resolver: zodResolver(createJourneyMapSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Mutation for creating a new journey map
  const createJourneyMapMutation = useMutation({
    mutationFn: (data: z.infer<typeof createJourneyMapSchema>) => {
      const payload = {
        ...data,
        nodeData: {
          nodes: [],
          edges: []
        }
      };
      return apiRequest('/api/journey-maps', 'POST', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-maps'] });
      setIsNewJourneyMapOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Journey map created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating journey map",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for optimizing a journey map
  const optimizeJourneyMapMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/journey-maps/${id}/optimize`, 'POST');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-maps'] });
      setIsOptimizing(null);
      toast({
        title: "Optimization Complete",
        description: "Journey map has been optimized successfully",
      });
    },
    onError: (error) => {
      setIsOptimizing(null);
      toast({
        title: "Error optimizing journey map",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a journey map
  const deleteJourneyMapMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/journey-maps/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey-maps'] });
      toast({
        title: "Success",
        description: "Journey map deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting journey map",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Submit handler for creating a new journey map
  function onSubmit(values: z.infer<typeof createJourneyMapSchema>) {
    createJourneyMapMutation.mutate(values);
  }

  // Handle optimize journey map
  function handleOptimize(id: number) {
    setIsOptimizing(id);
    optimizeJourneyMapMutation.mutate(id);
  }

  // Handle delete journey map
  function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this journey map?")) {
      deleteJourneyMapMutation.mutate(id);
    }
  }

  // Handle view journey map details
  function handleViewDetails(id: number) {
    setLocation(`/journey-map/${id}`);
  }

  // Calculate node and edge counts
  function getMapStats(nodeData: any) {
    try {
      const data = typeof nodeData === 'string' ? JSON.parse(nodeData) : nodeData;
      const nodeCount = data?.nodes?.length || 0;
      const edgeCount = data?.edges?.length || 0;
      return { nodeCount, edgeCount };
    } catch (e) {
      return { nodeCount: 0, edgeCount: 0 };
    }
  }

  return (
    <div className="container mx-auto p-4 pt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customer Journey Maps</h1>
        <Dialog open={isNewJourneyMapOpen} onOpenChange={setIsNewJourneyMapOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              <span>New Journey Map</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Journey Map</DialogTitle>
              <DialogDescription>
                Start with a blank journey map or import from a transcript analysis.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer Onboarding Journey" {...field} />
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
                        <Textarea 
                          placeholder="A detailed map of the customer onboarding process..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="flex flex-col gap-3 sm:flex-row">
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsNewJourneyMapOpen(false);
                      setLocation('/transcripts');
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    From Transcript
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createJourneyMapMutation.isPending}
                  >
                    {createJourneyMapMutation.isPending ? "Creating..." : "Create Blank Map"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center p-10">
          <p className="text-destructive">Failed to load journey maps. Please try again.</p>
          <Button 
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/journey-maps'] })}
          >
            Retry
          </Button>
        </div>
      ) : journeyMaps.length === 0 ? (
        <div className="text-center p-10 border rounded-md bg-muted/10">
          <GitGraph className="h-16 w-16 mx-auto mb-4 text-muted" />
          <h3 className="text-xl font-medium mb-2">No journey maps yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first customer journey map to visualize interaction flows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setIsNewJourneyMapOpen(true)}>
              Create New Map
            </Button>
            <Button variant="outline" onClick={() => setLocation('/transcripts')}>
              Generate From Transcript
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journeyMaps.map((journeyMap) => {
            const { nodeCount, edgeCount } = getMapStats(journeyMap.nodeData);
            return (
              <Card key={journeyMap.id} className="shadow-sm relative">
                {journeyMap.insights && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-bl-md">
                    AI Enhanced
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{journeyMap.title}</CardTitle>
                  <CardDescription>
                    {new Date(journeyMap.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {journeyMap.description && (
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {journeyMap.description}
                    </p>
                  )}
                  <div className="flex items-center gap-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{nodeCount}</span> nodes
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{edgeCount}</span> connections
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDetails(journeyMap.id)}
                    >
                      <GitGraph className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(journeyMap.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant={journeyMap.insights ? "outline" : "default"}
                    onClick={() => handleOptimize(journeyMap.id)}
                    disabled={isOptimizing === journeyMap.id}
                  >
                    {isOptimizing === journeyMap.id ? "Optimizing..." : (journeyMap.insights ? "Re-Optimize" : "Optimize with AI")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}