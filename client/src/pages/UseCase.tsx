import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UseCase } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  useForm 
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { parseConversationFlow } from "@/lib/parseConversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, PlusCircle, Trash2, MessageSquare, Settings, ChevronRight, CheckCircle, Edit, Wand2 } from "lucide-react";
import { generateUseCaseDetails, UseCaseDetailsSuggestions } from "@/lib/api";

// Define form schema based on the UseCase model
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  customer: z.string().optional(),
  
  // New fields for properly defining the use case
  problemStatement: z.string().optional(),
  proposedSolution: z.string().optional(),
  keyObjectives: z.string().optional(),
  requiredDataInputs: z.string().optional(),
  expectedOutputs: z.string().optional(),
  keyStakeholders: z.string().optional(),
  scope: z.string().optional(),
  potentialRisks: z.string().optional(),
  estimatedImpact: z.string().optional(),
  
  conversationFlow: z.string().optional(),
});

export default function UseCasePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<number | null>(null);
  const [currentUseCase, setCurrentUseCase] = useState<UseCase | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Fetch all use cases
  const { 
    data: useCases = [], 
    isLoading,
    error
  } = useQuery<UseCase[]>({
    queryKey: ['/api/use-cases'],
  });

  // Form for creating new use cases
  const createForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      customer: "",
      
      // Initialize new fields
      problemStatement: "",
      proposedSolution: "",
      keyObjectives: "",
      requiredDataInputs: "",
      expectedOutputs: "",
      keyStakeholders: "",
      scope: "",
      potentialRisks: "",
      estimatedImpact: "",
      
      conversationFlow: ""
    }
  });

  // Create use case mutation
  const createUseCaseMutation = useMutation({
    mutationFn: async (useCase: z.infer<typeof formSchema>) => {
      // Ensure all fields are properly formatted for JSON
      const formattedData = {
        ...useCase,
        conversationFlow: "", // Always start with empty conversation flow
        problemStatement: useCase.problemStatement || "",
        proposedSolution: useCase.proposedSolution || "",
        keyObjectives: useCase.keyObjectives || "",
        requiredDataInputs: useCase.requiredDataInputs || "",
        expectedOutputs: useCase.expectedOutputs || "",
        keyStakeholders: useCase.keyStakeholders || "",
        scope: useCase.scope || "",
        potentialRisks: useCase.potentialRisks || "",
        estimatedImpact: useCase.estimatedImpact || ""
      };
      
      return apiRequest('POST', '/api/use-cases', formattedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
      toast({
        title: "Use case created",
        description: "Your new use case has been created successfully."
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast({
        title: "Error creating use case",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });
  
  // Edit form for editing use cases
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      customer: "",
      problemStatement: "",
      proposedSolution: "",
      keyObjectives: "",
      requiredDataInputs: "",
      expectedOutputs: "",
      keyStakeholders: "",
      scope: "",
      potentialRisks: "",
      estimatedImpact: "",
      conversationFlow: ""
    }
  });
  
  // Update use case mutation
  const updateUseCaseMutation = useMutation({
    mutationFn: async ({ id, useCase }: { id: number, useCase: z.infer<typeof formSchema> }) => {
      // Ensure all fields are properly formatted for JSON
      const formattedData = {
        ...useCase,
        conversationFlow: useCase.conversationFlow || "",
        problemStatement: useCase.problemStatement || "",
        proposedSolution: useCase.proposedSolution || "",
        keyObjectives: useCase.keyObjectives || "",
        requiredDataInputs: useCase.requiredDataInputs || "",
        expectedOutputs: useCase.expectedOutputs || "",
        keyStakeholders: useCase.keyStakeholders || "",
        scope: useCase.scope || "",
        potentialRisks: useCase.potentialRisks || "",
        estimatedImpact: useCase.estimatedImpact || ""
      };
      
      return apiRequest('PATCH', `/api/use-cases/${id}`, formattedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
      toast({
        title: "Use case updated",
        description: "The use case has been updated successfully."
      });
      setIsEditDialogOpen(null);
      setCurrentUseCase(null);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error updating use case",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Delete use case mutation
  const deleteUseCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/use-cases/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
      toast({
        title: "Use case deleted",
        description: "The use case has been deleted successfully."
      });
      setIsDeleteDialogOpen(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting use case",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleCreateSubmit = (data: z.infer<typeof formSchema>) => {
    createUseCaseMutation.mutate(data);
  };
  
  const handleEditUseCase = (useCase: UseCase) => {
    setCurrentUseCase(useCase);
    setIsEditDialogOpen(useCase.id);
    
    // Reset the form with the use case data
    editForm.reset({
      title: useCase.title,
      description: useCase.description || "",
      customer: useCase.customer || "",
      problemStatement: useCase.problemStatement || "",
      proposedSolution: useCase.proposedSolution || "",
      keyObjectives: useCase.keyObjectives || "",
      requiredDataInputs: useCase.requiredDataInputs || "",
      expectedOutputs: useCase.expectedOutputs || "",
      keyStakeholders: useCase.keyStakeholders || "",
      scope: useCase.scope || "",
      potentialRisks: useCase.potentialRisks || "",
      estimatedImpact: useCase.estimatedImpact || "",
      conversationFlow: useCase.conversationFlow || ""
    });
  };
  
  const handleEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditDialogOpen) {
      updateUseCaseMutation.mutate({ 
        id: isEditDialogOpen, 
        useCase: data 
      });
    }
  };

  const handleDeleteUseCase = (id: number) => {
    deleteUseCaseMutation.mutate(id);
  };
  
  // AI Details Generation Mutation
  const generateDetailsMutation = useMutation({
    mutationFn: async (id: number) => {
      return generateUseCaseDetails(id);
    },
    onSuccess: (suggestions) => {
      // Update the form with AI-generated suggestions
      const currentValues = editForm.getValues();
      
      editForm.setValue("problemStatement", suggestions.problemStatement);
      editForm.setValue("proposedSolution", suggestions.proposedSolution);
      editForm.setValue("keyObjectives", suggestions.keyObjectives);
      editForm.setValue("requiredDataInputs", suggestions.requiredDataInputs);
      editForm.setValue("expectedOutputs", suggestions.expectedOutputs);
      editForm.setValue("keyStakeholders", suggestions.keyStakeholders);
      editForm.setValue("scope", suggestions.scope);
      editForm.setValue("potentialRisks", suggestions.potentialRisks);
      editForm.setValue("estimatedImpact", suggestions.estimatedImpact);
      
      toast({
        title: "AI suggestions generated",
        description: "Use case details have been populated with AI-generated suggestions."
      });
      
      setIsGeneratingAI(false);
    },
    onError: (error) => {
      console.error("Error generating AI suggestions:", error);
      toast({
        title: "Error generating suggestions",
        description: (error as Error).message,
        variant: "destructive"
      });
      setIsGeneratingAI(false);
    }
  });
  
  // Handle AI generation
  const handleGenerateAI = () => {
    if (isEditDialogOpen) {
      setIsGeneratingAI(true);
      generateDetailsMutation.mutate(isEditDialogOpen);
    }
  };

  // If there's an error fetching data, display error message
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error Loading Use Cases</h2>
          <p>{(error as Error).message}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold">Use Cases</h1>
        </div>
        <Button 
          className="flex items-center"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Use Case
        </Button>
      </div>

      <p className="text-muted-foreground mb-8">
        Define conversation flows and use cases for your AI agents. 
        Create detailed conversation templates that your team can use for consistent interactions.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : useCases.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Use Cases Found</h2>
          <p className="text-muted-foreground mb-6">Create your first use case to get started.</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Use Case
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase) => (
            <Card key={useCase.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{useCase.title}</CardTitle>
                <CardDescription>
                  {useCase.customer ? `Customer: ${useCase.customer}` : "No customer specified"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {useCase.description || "No description provided"}
                </p>
                
                {/* Show problem statement if available */}
                {useCase.problemStatement && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-primary">Problem Statement:</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {useCase.problemStatement}
                    </p>
                  </div>
                )}
                
                {/* Key highlights of the use case */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {useCase.keyObjectives && (
                    <div className="text-xs">
                      <span className="inline-block bg-primary/10 text-primary rounded-sm px-1.5 py-0.5 text-[10px] font-medium mb-1">
                        Objectives
                      </span>
                      <p className="line-clamp-1">{useCase.keyObjectives}</p>
                    </div>
                  )}
                  
                  {useCase.estimatedImpact && (
                    <div className="text-xs">
                      <span className="inline-block bg-green-100 text-green-800 rounded-sm px-1.5 py-0.5 text-[10px] font-medium mb-1">
                        Impact
                      </span>
                      <p className="line-clamp-1">{useCase.estimatedImpact}</p>
                    </div>
                  )}
                </div>
                
                {/* Conversation snippet if available */}
                {useCase.conversationFlow && (
                  <div className="mt-4 p-3 bg-muted rounded-md text-xs line-clamp-2">
                    <span className="font-mono">
                      {useCase.conversationFlow.substring(0, 100)}
                      {useCase.conversationFlow.length > 100 ? "..." : ""}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="default" 
                  onClick={() => handleEditUseCase(useCase)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsDeleteDialogOpen(useCase.id)}
                  size="icon"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Use Case Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Use Case</DialogTitle>
            <DialogDescription>
              Define a new conversational AI use case for your chatbot.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Customer Onboarding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and goals of this use case..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* New fields for properly defining the use case */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="detailed-fields">
                  <AccordionTrigger className="font-semibold text-primary">
                    Detailed Use Case Definition (Optional)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="problemStatement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problem Statement</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Concise statement of the problem this AI use case will solve..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="proposedSolution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proposed AI Solution</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="High-level description of the proposed AI solution..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="keyObjectives"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Objectives & Success Metrics</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Quantifiable objectives and success metrics for this use case..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="requiredDataInputs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Data Inputs</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Data sources, types, and availability status..."
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="expectedOutputs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Outputs & Actions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What outputs and actions will the AI produce..."
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={createForm.control}
                      name="keyStakeholders"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Stakeholders</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Business and technical stakeholders involved..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>High-Level Scope</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define inclusions and exclusions for this use case..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="potentialRisks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potential Risks & Dependencies</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Identify potential risks and dependencies..."
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="estimatedImpact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Impact/Value</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Quantify the expected impact or value..."
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUseCaseMutation.isPending}
                >
                  {createUseCaseMutation.isPending ? "Creating..." : "Create Use Case"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen !== null} onOpenChange={() => setIsDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this use case? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => isDeleteDialogOpen && handleDeleteUseCase(isDeleteDialogOpen)}
              disabled={deleteUseCaseMutation.isPending}
            >
              {deleteUseCaseMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Use Case Dialog */}
      <Dialog open={isEditDialogOpen !== null} onOpenChange={(open) => !open && setIsEditDialogOpen(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Use Case</DialogTitle>
            <DialogDescription>
              Update the use case details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Customer Onboarding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and goals of this use case..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* New fields for properly defining the use case */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed Definition</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    The information above covers the basic details of your use case. To add more comprehensive
                    information, switch to the "Detailed Definition" tab.
                  </p>
                </TabsContent>
                
                <TabsContent value="detailed" className="space-y-4 pt-4">
                  <FormField
                    control={editForm.control}
                    name="problemStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Statement</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Concise statement of the problem this AI use case will solve..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="proposedSolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed AI Solution</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="High-level description of the proposed AI solution..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="keyObjectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Objectives & Success Metrics</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Quantifiable objectives and success metrics for this use case..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="requiredDataInputs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Data Inputs</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Data sources, types, and availability status..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="expectedOutputs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Outputs & Actions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What outputs and actions will the AI produce..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="keyStakeholders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Stakeholders</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Business and technical stakeholders involved..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>High-Level Scope</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Define inclusions and exclusions for this use case..."
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="potentialRisks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potential Risks & Dependencies</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Identify potential risks and dependencies..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="estimatedImpact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Impact/Value</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Quantify the expected impact or value..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex justify-between">
                <div>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="mr-2"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || generateDetailsMutation.isPending}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGeneratingAI || generateDetailsMutation.isPending ? "Generating..." : "AI Suggest"}
                  </Button>
                </div>
                <div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(null)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateUseCaseMutation.isPending}
                  >
                    {updateUseCaseMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}