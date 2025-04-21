import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { Transcript, TranscriptAnalysisResult } from '@shared/schema';
import { ArrowLeft, GitGraph, FileText, MessageSquare, BarChart, Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react';

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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function TranscriptDetailPage() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const transcriptId = parseInt(id);

  // Fetch transcript details
  const {
    data: transcript,
    isLoading,
    isError,
  } = useQuery<Transcript>({
    queryKey: [`/api/transcripts/${transcriptId}`],
    enabled: !isNaN(transcriptId),
    refetchOnWindowFocus: false,
  });

  // Get analysis data
  const analyzedData: TranscriptAnalysisResult | undefined = 
    transcript?.analyzedFlow 
      ? (typeof transcript.analyzedFlow === 'string' 
        ? JSON.parse(transcript.analyzedFlow) 
        : transcript.analyzedFlow)
      : undefined;

  // Mutation for analyzing a transcript
  const analyzeTranscriptMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/transcripts/${transcriptId}/analyze`, 'POST');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/transcripts/${transcriptId}`] });
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Transcript has been analyzed successfully",
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Error analyzing transcript",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle analyze transcript
  function handleAnalyze() {
    setIsAnalyzing(true);
    analyzeTranscriptMutation.mutate();
  }

  // Handle view journey map
  function handleViewJourneyMap() {
    setLocation(`/journey-map/from-transcript/${transcriptId}`);
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  // Format conversation content with proper styling
  function formatConversation(content: string) {
    const lines = content.split('\n');
    
    // Try to detect patterns like "Agent:", "Customer:", "User:", etc.
    return lines.map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <br key={i} />;

      if (
        trimmedLine.startsWith('Agent:') ||
        trimmedLine.startsWith('Representative:') ||
        trimmedLine.startsWith('Support:')
      ) {
        return (
          <div key={i} className="flex gap-2 mb-2">
            <div className="bg-primary/10 text-primary rounded-full p-1">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-primary">Agent: </span>
              {trimmedLine.replace(/^(Agent|Representative|Support):/, '').trim()}
            </div>
          </div>
        );
      } else if (
        trimmedLine.startsWith('Customer:') ||
        trimmedLine.startsWith('User:') ||
        trimmedLine.startsWith('Client:')
      ) {
        return (
          <div key={i} className="flex gap-2 mb-2">
            <div className="bg-muted rounded-full p-1">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-medium">Customer: </span>
              {trimmedLine.replace(/^(Customer|User|Client):/, '').trim()}
            </div>
          </div>
        );
      } else if (trimmedLine.match(/^\[\d+:\d+(:\d+)?(am|pm|AM|PM)?\]/)) {
        // Timestamp pattern
        return (
          <div key={i} className="text-xs text-muted-foreground mt-2 mb-1">
            {trimmedLine}
          </div>
        );
      } else {
        return <p key={i} className="mb-2">{trimmedLine}</p>;
      }
    });
  }

  return (
    <div className="container mx-auto p-4 pt-6 max-w-5xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation('/transcripts')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Transcripts
      </Button>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-[400px] w-full mt-6" />
        </div>
      ) : isError || !transcript ? (
        <div className="text-center p-10">
          <p className="text-destructive mb-4">Failed to load transcript details.</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ 
              queryKey: [`/api/transcripts/${transcriptId}`] 
            })}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{transcript.title}</h1>
              <div className="flex items-center gap-3 text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="capitalize">{transcript.source}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(transcript.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!transcript.analyzedFlow ? (
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="whitespace-nowrap"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Transcript"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleAnalyze}
                    className="whitespace-nowrap"
                  >
                    Re-Analyze
                  </Button>
                  <Button
                    onClick={handleViewJourneyMap}
                    className="whitespace-nowrap"
                  >
                    <GitGraph className="h-4 w-4 mr-2" /> View Journey Map
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analysis results */}
            {analyzedData ? (
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                    <CardDescription>
                      AI-powered insights from this conversation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sentiment analysis */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Sentiment Analysis</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Positive</span>
                            <span>{Math.round(analyzedData.sentiments.positive * 100)}%</span>
                          </div>
                          <Progress value={analyzedData.sentiments.positive * 100} className="bg-muted h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Neutral</span>
                            <span>{Math.round(analyzedData.sentiments.neutral * 100)}%</span>
                          </div>
                          <Progress value={analyzedData.sentiments.neutral * 100} className="bg-muted h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Negative</span>
                            <span>{Math.round(analyzedData.sentiments.negative * 100)}%</span>
                          </div>
                          <Progress value={analyzedData.sentiments.negative * 100} className="bg-muted h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Customer intents */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Identified Intents</h3>
                      <div className="flex flex-wrap gap-2">
                        {analyzedData.intents.map((intent, i) => (
                          <Badge key={i} variant="secondary">
                            {intent.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Insights accordions */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="bottlenecks">
                        <AccordionTrigger>
                          <span className="text-sm font-medium">Bottlenecks</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            {analyzedData.insights.bottlenecks.map((bottleneck, i) => (
                              <li key={i}>
                                <p className="font-medium">{bottleneck.reason}</p>
                                <p className="text-xs text-muted-foreground">{bottleneck.suggestion}</p>
                              </li>
                            ))}
                            {analyzedData.insights.bottlenecks.length === 0 && (
                              <li className="text-muted-foreground">No significant bottlenecks identified</li>
                            )}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="dropoffs">
                        <AccordionTrigger>
                          <span className="text-sm font-medium">Drop-offs</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            {analyzedData.insights.dropoffs.map((dropoff, i) => (
                              <li key={i}>
                                <div className="flex justify-between">
                                  <p className="font-medium">{dropoff.reason}</p>
                                  <span className="text-xs">{dropoff.frequency}%</span>
                                </div>
                              </li>
                            ))}
                            {analyzedData.insights.dropoffs.length === 0 && (
                              <li className="text-muted-foreground">No significant drop-offs identified</li>
                            )}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="improvements">
                        <AccordionTrigger>
                          <span className="text-sm font-medium">Suggested Improvements</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            {analyzedData.insights.improvements.map((improvement, i) => (
                              <li key={i}>
                                <p className="font-medium">{improvement.type}</p>
                                <p className="text-xs">{improvement.description}</p>
                                <p className="text-xs text-primary">Impact: {improvement.impact}</p>
                              </li>
                            ))}
                            {analyzedData.insights.improvements.length === 0 && (
                              <li className="text-muted-foreground">No specific improvements suggested</li>
                            )}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="lg:col-span-1">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle>Analysis Needed</CardTitle>
                    <CardDescription>
                      Run an analysis to get AI-powered insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center p-8">
                    <BarChart className="h-16 w-16 mx-auto mb-4 text-muted" />
                    <p className="text-muted-foreground mb-4">
                      Analyze this transcript to extract intents, sentiment, and generate a customer journey map.
                    </p>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Now"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Transcript content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-md p-4 max-h-[500px] overflow-y-auto">
                    {formatConversation(transcript.content)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}