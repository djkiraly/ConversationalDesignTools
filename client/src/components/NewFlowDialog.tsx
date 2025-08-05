import { useState, useEffect } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Map, ShoppingCart, HelpCircle, Brain, Sparkles, CheckCircle, Book } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { UseCase, fetchAllUseCases } from "../lib/api";
import { useQuery } from '@tanstack/react-query';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface NewFlowDialogProps {
  onCreateFlow: (flowName: string, templateType: string | null) => void;
  onCreateAIFlow?: (flowName: string, description: string) => void;
  onCreateFromUseCase?: (flowName: string, useCase: UseCase) => void;
}

export default function NewFlowDialog({ onCreateFlow, onCreateAIFlow, onCreateFromUseCase }: NewFlowDialogProps) {
  const [flowName, setFlowName] = useState("New Customer Journey");
  const [isOpen, setIsOpen] = useState(false);
  const [aiTemplateDescription, setAiTemplateDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "ai" | "usecase">("templates");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string>("");
  
  // Fetch use cases
  const { 
    data: useCases = [], 
    isLoading: isLoadingUseCases 
  } = useQuery({
    queryKey: ['/api/use-cases'],
    queryFn: fetchAllUseCases,
    enabled: isOpen // Only fetch when the dialog is open
  });
  
  // Set flow name based on selected use case
  useEffect(() => {
    if (selectedUseCaseId) {
      const selectedUseCase = useCases.find(uc => uc.id.toString() === selectedUseCaseId);
      if (selectedUseCase) {
        setFlowName(`Journey from ${selectedUseCase.title}`);
      }
    }
  }, [selectedUseCaseId, useCases]);
  
  const handleCreateFlow = (templateType: string | null) => {
    onCreateFlow(flowName, templateType);
    setIsOpen(false);
    resetForm();
  };
  
  const handleCreateAIFlow = () => {
    if (onCreateAIFlow && aiTemplateDescription.trim()) {
      setIsGenerating(true);
      onCreateAIFlow(flowName, aiTemplateDescription);
      setIsOpen(false);
      resetForm();
    }
  };
  
  const handleCreateFromUseCase = () => {
    if (onCreateFromUseCase && selectedUseCaseId) {
      const selectedUseCase = useCases.find(uc => uc.id.toString() === selectedUseCaseId);
      if (selectedUseCase) {
        onCreateFromUseCase(flowName, selectedUseCase);
        setIsOpen(false);
        resetForm();
      }
    }
  };
  
  // Reset form state
  const resetForm = () => {
    setFlowName("New Customer Journey");
    setAiTemplateDescription("");
    setActiveTab("templates");
    setIsGenerating(false);
    setSelectedUseCaseId("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Flow
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Customer Journey</DialogTitle>
          <DialogDescription>
            Start from a template or create a blank journey to customize.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <Label htmlFor="flow-name">Journey Name</Label>
            <Input 
              id="flow-name" 
              value={flowName} 
              onChange={(e) => setFlowName(e.target.value)} 
              placeholder="Enter a name for your journey" 
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-between mb-4 border-b">
            <Button 
              variant={activeTab === "templates" ? "default" : "ghost"}
              onClick={() => setActiveTab("templates")}
              className="rounded-b-none border-b-0"
            >
              Templates
            </Button>
            <Button 
              variant={activeTab === "ai" ? "default" : "ghost"}
              onClick={() => setActiveTab("ai")}
              className="rounded-b-none border-b-0 gap-1"
            >
              <Brain className="h-4 w-4" />
              AI Generator
            </Button>
            <Button 
              variant={activeTab === "usecase" ? "default" : "ghost"}
              onClick={() => setActiveTab("usecase")}
              className="rounded-b-none border-b-0 gap-1"
            >
              <Book className="h-4 w-4" />
              From Use Case
            </Button>
          </div>
          
          {activeTab === "templates" ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleCreateFlow(null)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Map className="h-5 w-5 mr-2 text-primary" />
                    Blank Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <CardDescription>
                    Start with a blank canvas and build your customer journey from scratch.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost" className="w-full">
                    Start Blank
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleCreateFlow('sales')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                    Sales Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <CardDescription>
                    Start with a pre-built sales journey template with awareness to purchase.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost" className="w-full">
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleCreateFlow('support')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Support Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <CardDescription>
                    Start with a pre-built support journey for customer assistance.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost" className="w-full">
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : activeTab === "ai" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                    AI-Generated Journey
                  </CardTitle>
                  <CardDescription>
                    Describe your customer journey and let AI design the flow for you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="ai-description">Journey Description</Label>
                    <Textarea
                      id="ai-description"
                      placeholder="Describe the customer journey you want to create. For example: 'A journey for a SaaS product where customers discover the product through social media, sign up for a free trial, get onboarded, and convert to paid users.'"
                      value={aiTemplateDescription}
                      onChange={(e) => setAiTemplateDescription(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCreateAIFlow}
                    disabled={!aiTemplateDescription.trim() || isGenerating || !onCreateAIFlow}
                    className="w-full gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="h-4 w-4 animate-pulse" />
                        Generating Journey...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate AI Journey
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            // Use Case tab content
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Book className="h-5 w-5 mr-2 text-amber-600" />
                    Create from Use Case
                  </CardTitle>
                  <CardDescription>
                    Create a new journey based on an existing use case
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUseCases ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : useCases.length === 0 ? (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertDescription>
                        No use cases found. Create a use case first to use this option.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="use-case-select">Select a Use Case</Label>
                        <Select
                          value={selectedUseCaseId}
                          onValueChange={setSelectedUseCaseId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a use case" />
                          </SelectTrigger>
                          <SelectContent>
                            {useCases.map((useCase) => (
                              <SelectItem key={useCase.id} value={useCase.id.toString()}>
                                {useCase.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedUseCaseId && (
                        <div className="border rounded-md p-3 bg-muted/30">
                          <p className="text-sm font-medium">
                            Use Case Details:
                          </p>
                          {(() => {
                            const selectedUseCase = useCases.find(uc => uc.id.toString() === selectedUseCaseId);
                            return selectedUseCase ? (
                              <div className="mt-2 space-y-2 text-sm">
                                <p><span className="font-medium">Customer:</span> {selectedUseCase.customer || "N/A"}</p>
                                <p><span className="font-medium">Description:</span> {selectedUseCase.description || "N/A"}</p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCreateFromUseCase}
                    disabled={!selectedUseCaseId || isLoadingUseCases || !onCreateFromUseCase}
                    className="w-full gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Create Journey from Use Case
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}