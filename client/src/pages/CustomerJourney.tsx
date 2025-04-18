import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Upload, Users, Map, MessageSquare, Target, Activity } from "lucide-react";

// Form validation schemas
const userResearchSchema = z.object({
  targetUsers: z.string().min(1, "Target users are required"),
  userNeeds: z.string().min(1, "User needs are required"),
  painPoints: z.string().min(1, "Pain points are required"),
  behaviors: z.string().min(1, "User behaviors are required")
});

const stakeholderSchema = z.object({
  objectives: z.string().min(1, "Business objectives are required"),
  stakeholderRequirements: z.string().min(1, "Stakeholder requirements are required")
});

const touchpointSchema = z.object({
  interactionPoints: z.string().min(1, "Interaction points are required")
});

const currentStateSchema = z.object({
  existingProcesses: z.string().min(1, "Existing processes are required")
});

const competitiveAnalysisSchema = z.object({
  competitors: z.string().min(1, "Competitor analysis is required")
});

// Unified schema for all tabs
const customerJourneySchema = z.object({
  userResearch: userResearchSchema,
  stakeholder: stakeholderSchema,
  touchpoint: touchpointSchema,
  currentState: currentStateSchema,
  competitiveAnalysis: competitiveAnalysisSchema
});

type CustomerJourneyFormValues = z.infer<typeof customerJourneySchema>;

export default function CustomerJourney() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("userResearch");
  
  // Form setup
  const form = useForm<CustomerJourneyFormValues>({
    resolver: zodResolver(customerJourneySchema),
    defaultValues: {
      userResearch: {
        targetUsers: "",
        userNeeds: "",
        painPoints: "",
        behaviors: ""
      },
      stakeholder: {
        objectives: "",
        stakeholderRequirements: ""
      },
      touchpoint: {
        interactionPoints: ""
      },
      currentState: {
        existingProcesses: ""
      },
      competitiveAnalysis: {
        competitors: ""
      }
    }
  });

  // Form submit handler
  const onSubmit = (values: CustomerJourneyFormValues) => {
    // In a real application, this would save to the database
    console.log(values);
    
    toast({
      title: "Customer Journey Saved",
      description: "Your customer journey data has been saved successfully."
    });
  };

  // Export as JSON
  const handleExport = () => {
    const values = form.getValues();
    const jsonString = JSON.stringify(values, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-journey.json";
    a.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported Successfully",
      description: "Customer journey data has been exported as JSON."
    });
  };

  // Import from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        form.reset(json);
        
        toast({
          title: "Imported Successfully",
          description: "Customer journey data has been imported."
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid JSON file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Customer Journey</CardTitle>
          <CardDescription>
            Define and document your AI conversation journey for better user experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use this tool to map out your AI conversation flow, from initial user research to defining success metrics. 
            Each section helps you document essential aspects of the customer journey.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Export Journey
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById("import-json")?.click()}
            >
              <Upload className="h-4 w-4" /> Import Journey
              <input
                id="import-json"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="userResearch" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
              <TabsTrigger value="userResearch" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> <span className="hidden md:inline">User Research</span>
              </TabsTrigger>
              <TabsTrigger value="stakeholder" className="flex items-center gap-2">
                <Target className="h-4 w-4" /> <span className="hidden md:inline">Stakeholder Input</span>
              </TabsTrigger>
              <TabsTrigger value="touchpoint" className="flex items-center gap-2">
                <Map className="h-4 w-4" /> <span className="hidden md:inline">Touchpoint Mapping</span>
              </TabsTrigger>
              <TabsTrigger value="currentState" className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> <span className="hidden md:inline">Current State</span>
              </TabsTrigger>
              <TabsTrigger value="competitiveAnalysis" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> <span className="hidden md:inline">Competitive Analysis</span>
              </TabsTrigger>
            </TabsList>

            {/* User Research */}
            <TabsContent value="userResearch">
              <Card>
                <CardHeader>
                  <CardTitle>User Research</CardTitle>
                  <CardDescription>
                    Document your research about target users and their needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userResearch.targetUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Users</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your target users and their demographics"
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Define who will be using your AI system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userResearch.userNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Needs</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What needs do your users have? What are they trying to achieve?"
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Identify the core needs your AI will address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userResearch.painPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pain Points</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What frustrations or challenges do your users currently face?"
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Document the problems your AI solution will solve
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userResearch.behaviors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Behaviors</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How do users currently behave? What patterns do they follow?"
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe typical user behaviors and patterns
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stakeholder Input */}
            <TabsContent value="stakeholder">
              <Card>
                <CardHeader>
                  <CardTitle>Stakeholder Input</CardTitle>
                  <CardDescription>
                    Document business requirements and stakeholder needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stakeholder.objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Objectives</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What business goals should the AI system achieve?"
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Define the organizational objectives the AI will support
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stakeholder.stakeholderRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stakeholder Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What specific requirements do stakeholders have?"
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Document requirements from different departments or stakeholders
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Touchpoint Mapping */}
            <TabsContent value="touchpoint">
              <Card>
                <CardHeader>
                  <CardTitle>Touchpoint Mapping</CardTitle>
                  <CardDescription>
                    Identify all potential interaction points between users and the AI system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="touchpoint.interactionPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interaction Points</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List all potential interaction points (e.g., initial greeting, question handling, error recovery, handoff, etc.)"
                            {...field} 
                            rows={6}
                          />
                        </FormControl>
                        <FormDescription>
                          Map out where and how users will interact with your AI
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Accordion type="single" collapsible className="mt-6">
                    <AccordionItem value="journeyTypes">
                      <AccordionTrigger>Journey Output Examples</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-sm text-muted-foreground">
                          <div>
                            <h4 className="font-medium text-foreground">Entry Points</h4>
                            <p>How users begin interacting with the system (e.g., website chat, mobile app, voice interface)</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">Conversation Flows</h4>
                            <p>The possible paths through a conversation with key decision points</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">Decision Points</h4>
                            <p>Where the AI or user must make choices that affect the journey</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">Exit Conditions</h4>
                            <p>How and when interactions are concluded (successful completion, handoff, abandonment)</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Current State Analysis */}
            <TabsContent value="currentState">
              <Card>
                <CardHeader>
                  <CardTitle>Current State Analysis</CardTitle>
                  <CardDescription>
                    Document existing processes that the AI will enhance or replace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentState.existingProcesses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Existing Processes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe current processes that will be enhanced or replaced by AI"
                            {...field} 
                            rows={6}
                          />
                        </FormControl>
                        <FormDescription>
                          Document how things work now before AI implementation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitive Analysis */}
            <TabsContent value="competitiveAnalysis">
              <Card>
                <CardHeader>
                  <CardTitle>Competitive Analysis</CardTitle>
                  <CardDescription>
                    Review similar AI solutions in the market
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="competitiveAnalysis.competitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competitor Analysis</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Analyze similar AI solutions in the market and identify opportunities for differentiation"
                            {...field} 
                            rows={6}
                          />
                        </FormControl>
                        <FormDescription>
                          Identify what makes your AI solution unique compared to others
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Journey Outputs</CardTitle>
              <CardDescription>
                Document the key outputs of your customer journey definition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="personas">
                  <AccordionTrigger>Persona Profiles</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create detailed representations of target users with their goals, behaviors, and motivations.
                    </p>
                    <Textarea 
                      placeholder="Document your user personas here"
                      rows={4}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="journeyMaps">
                  <AccordionTrigger>Journey Maps</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create visual representations showing user paths through the system, including entry points, 
                      conversation flows, decision points, and exit conditions.
                    </p>
                    <Textarea 
                      placeholder="Document your journey maps here"
                      rows={4}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="interactionModels">
                  <AccordionTrigger>Interaction Models</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define frameworks specifying how users will communicate with the AI and how the AI will respond.
                    </p>
                    <Textarea 
                      placeholder="Document your interaction models here"
                      rows={4}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="successMetrics">
                  <AccordionTrigger>Success Metrics</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define KPIs to measure the effectiveness of the journey (completion rates, satisfaction scores, etc.).
                    </p>
                    <Textarea 
                      placeholder="Document your success metrics here"
                      rows={4}
                    />
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="prototypeScenarios">
                  <AccordionTrigger>Prototype Scenarios</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create example conversations demonstrating key user journeys.
                    </p>
                    <Textarea 
                      placeholder="Document your prototype scenarios here"
                      rows={4}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="mt-4">Save Customer Journey</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}