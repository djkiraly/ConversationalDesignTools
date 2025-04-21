import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Transcript } from '@shared/schema';
import { PlusCircle, Trash2, FileText, ArrowUpRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create form schema for transcript creation
const createTranscriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  source: z.string().min(1, "Source is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export default function TranscriptsPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isNewTranscriptOpen, setIsNewTranscriptOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null);

  // Fetch all transcripts
  const {
    data: transcripts = [],
    isLoading,
    isError,
  } = useQuery<Transcript[]>({
    queryKey: ['/api/transcripts'],
    refetchOnWindowFocus: false,
  });

  // Form for creating new transcripts
  const form = useForm<z.infer<typeof createTranscriptSchema>>({
    resolver: zodResolver(createTranscriptSchema),
    defaultValues: {
      title: '',
      source: '',
      content: '',
    },
  });

  // Mutation for creating a new transcript
  const createTranscriptMutation = useMutation({
    mutationFn: (data: z.infer<typeof createTranscriptSchema>) => {
      return apiRequest('/api/transcripts', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      setIsNewTranscriptOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Transcript created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating transcript",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for analyzing a transcript
  const analyzeTranscriptMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/transcripts/${id}/analyze`, 'POST');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      setIsAnalyzing(null);
      toast({
        title: "Analysis Complete",
        description: "Transcript has been analyzed successfully",
      });
    },
    onError: (error) => {
      setIsAnalyzing(null);
      toast({
        title: "Error analyzing transcript",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a transcript
  const deleteTranscriptMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/transcripts/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      toast({
        title: "Success",
        description: "Transcript deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting transcript",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Submit handler for creating a new transcript
  function onSubmit(values: z.infer<typeof createTranscriptSchema>) {
    createTranscriptMutation.mutate(values);
  }

  // Handle analyze transcript
  function handleAnalyze(id: number) {
    setIsAnalyzing(id);
    analyzeTranscriptMutation.mutate(id);
  }

  // Handle delete transcript
  function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this transcript?")) {
      deleteTranscriptMutation.mutate(id);
    }
  }

  // Handle view transcript details
  function handleViewDetails(id: number) {
    setLocation(`/transcript/${id}`);
  }

  return (
    <div className="container mx-auto p-4 pt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conversation Transcripts</h1>
        <Dialog open={isNewTranscriptOpen} onOpenChange={setIsNewTranscriptOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              <span>New Transcript</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Transcript</DialogTitle>
              <DialogDescription>
                Add a new conversation transcript for analysis. This can be from chat, call center logs, or any other customer interaction.
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
                        <Input placeholder="Customer Support Interaction #123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="chat">Live Chat</SelectItem>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email Thread</SelectItem>
                          <SelectItem value="support">Support Ticket</SelectItem>
                          <SelectItem value="chatbot">Chatbot Interaction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transcript Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the full conversation transcript here..."
                          className="h-[200px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include the entire conversation with timestamps, speaker labels, or any other contextual information.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createTranscriptMutation.isPending}
                  >
                    {createTranscriptMutation.isPending ? "Saving..." : "Save Transcript"}
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
          <p className="text-destructive">Failed to load transcripts. Please try again.</p>
          <Button 
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] })}
          >
            Retry
          </Button>
        </div>
      ) : transcripts.length === 0 ? (
        <div className="text-center p-10 border rounded-md bg-muted/10">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted" />
          <h3 className="text-xl font-medium mb-2">No transcripts yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first conversation transcript to analyze and generate journey maps.
          </p>
          <Button onClick={() => setIsNewTranscriptOpen(true)}>
            Add Your First Transcript
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transcripts.map((transcript) => (
            <Card key={transcript.id} className="shadow-sm relative overflow-hidden">
              {transcript.analyzedFlow && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs rounded-bl-md">
                  Analyzed
                </div>
              )}
              <CardHeader>
                <CardTitle>{transcript.title}</CardTitle>
                <CardDescription>
                  <span className="capitalize">{transcript.source}</span> • {new Date(transcript.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3 text-muted-foreground">
                  {transcript.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDetails(transcript.id)}
                  >
                    <FileText className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(transcript.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {!transcript.analyzedFlow ? (
                  <Button
                    size="sm"
                    onClick={() => handleAnalyze(transcript.id)}
                    disabled={isAnalyzing === transcript.id}
                  >
                    {isAnalyzing === transcript.id ? "Analyzing..." : "Analyze"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setLocation(`/journey-map/from-transcript/${transcript.id}`)}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-1" /> Journey Map
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}