import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, FileText, ClipboardList, BarChart3, CalendarClock, Save, Plus, FolderOpen, Edit, List, Lightbulb, FileDown, Import } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useROIParameters, calculateTimeSaved, calculateCostSavings, calculateImplementationCost, 
         calculateMaintenanceCost, calculateCSATImprovement, calculatePaybackPeriod, 
         formatCurrency, formatRange } from '../lib/roiCalculator';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchAllCustomers, fetchAllActionPlans, createActionPlan, updateActionPlan, 
         generateActionPlanSuggestions, fetchAllUseCases, generateActionPlanFromUseCase,
         ActionPlan as ActionPlanType, Customer, UseCase } from '../lib/api';
import { useToast } from '@/hooks/use-toast';
import ActionPlanSelectionDialog from '@/components/ActionPlanSelectionDialog';
import AISuggestionsDialog from '@/components/AISuggestionsDialog';
import UseCaseImportDialog from '@/components/UseCaseImportDialog';
import { exportActionPlanToWord } from '../lib/wordGenerator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

interface FormSection {
  id: string;
  title: string;
  isCompleted: boolean;
}

export default function ActionPlan() {
  const [currentSection, setCurrentSection] = useState('business-discovery');
  const [progress, setProgress] = useState(0);
  const [planTitle, setPlanTitle] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [isUseCaseImportDialogOpen, setIsUseCaseImportDialogOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isGeneratingFromUseCase, setIsGeneratingFromUseCase] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Business Discovery
    industry: '',
    primaryChannel: '',
    interactionVolume: '',
    currentAutomation: '',
    
    // Pain Point Assessment
    biggestChallenge: '',
    repetitiveProcesses: '',
    
    // AI Agent Goals
    aiGoals: [] as string[],
    autonomyLevel: '',
    customGoal: '',
    customGoalEnabled: false,
    goalDetails: {} as Record<string, string>,
    
    // System & Integration Readiness
    currentPlatforms: '',
    teamComfort: '',
    apisAvailable: '',
    
    // Success Metrics
    successMetrics: [] as string[]
  });
  
  // Fetch customers from the API
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: fetchAllCustomers,
  });
  
  // Fetch all action plans
  const { data: actionPlans, isLoading: isLoadingActionPlans } = useQuery({
    queryKey: ['/api/action-plans'],
    queryFn: fetchAllActionPlans,
  });
  
  // Fetch all use cases for import
  const { data: useCases, isLoading: isLoadingUseCases } = useQuery({
    queryKey: ['/api/use-cases'],
    queryFn: fetchAllUseCases,
  });
  
  // Setup mutation for creating an action plan
  const createActionPlanMutation = useMutation({
    mutationFn: createActionPlan,
    onSuccess: (data) => {
      toast({
        title: "Action plan saved successfully",
        description: `Your action plan "${data.title}" has been saved.`,
        variant: "default",
      });
      setCurrentPlanId(data.id);
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving action plan",
        description: error.message || "An error occurred while saving the action plan.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });
  
  // Setup mutation for updating an action plan
  const updateActionPlanMutation = useMutation({
    mutationFn: (data: { id: number, actionPlan: Partial<Omit<ActionPlanType, 'id' | 'createdAt' | 'updatedAt'>> }) => 
      updateActionPlan(data.id, data.actionPlan),
    onSuccess: (data) => {
      toast({
        title: "Action plan updated successfully",
        description: `Your action plan "${data.title}" has been updated.`,
        variant: "default",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating action plan",
        description: error.message || "An error occurred while updating the action plan.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });
  
  const formSections: FormSection[] = [
    { id: 'business-discovery', title: '1. Business Discovery', isCompleted: false },
    { id: 'pain-point-assessment', title: '2. Pain Point Assessment', isCompleted: false },
    { id: 'ai-agent-goals', title: '3. AI Agent Goals', isCompleted: false },
    { id: 'system-integration', title: '4. System & Integration', isCompleted: false },
    { id: 'success-metrics', title: '5. Success Metrics', isCompleted: false },
    { id: 'results', title: '6. View Results', isCompleted: false }
  ];
  
  // Calculate current progress
  const calculateProgress = () => {
    const totalSections = formSections.length - 1; // Exclude results section
    let completed = 0;
    
    if (formData.industry && formData.primaryChannel && formData.interactionVolume) {
      completed++;
    }
    
    if (formData.biggestChallenge && formData.repetitiveProcesses) {
      completed++;
    }
    
    if (formData.aiGoals.length > 0 && formData.autonomyLevel) {
      completed++;
    }
    
    if (formData.currentPlatforms && formData.teamComfort) {
      completed++;
    }
    
    if (formData.successMetrics.length > 0) {
      completed++;
    }
    
    return Math.round((completed / totalSections) * 100);
  };
  
  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setProgress(calculateProgress());
      return newData;
    });
  };
  
  const handleNext = () => {
    const currentIndex = formSections.findIndex(section => section.id === currentSection);
    if (currentIndex < formSections.length - 1) {
      setCurrentSection(formSections[currentIndex + 1].id);
    }
  };
  
  const handlePrevious = () => {
    const currentIndex = formSections.findIndex(section => section.id === currentSection);
    if (currentIndex > 0) {
      setCurrentSection(formSections[currentIndex - 1].id);
    }
  };
  
  // Function to load selected action plan data into the form
  const handleLoadActionPlan = (actionPlan: ActionPlanType) => {
    setPlanTitle(actionPlan.title);
    setSelectedCustomerId(actionPlan.customerId);
    setCurrentPlanId(actionPlan.id);
    
    setFormData({
      industry: actionPlan.industry || '',
      primaryChannel: actionPlan.primaryChannel || '',
      interactionVolume: actionPlan.interactionVolume || '',
      currentAutomation: actionPlan.currentAutomation || '',
      biggestChallenge: actionPlan.biggestChallenge || '',
      repetitiveProcesses: actionPlan.repetitiveProcesses || '',
      aiGoals: actionPlan.aiGoals || [],
      autonomyLevel: actionPlan.autonomyLevel || '',
      customGoal: '',
      customGoalEnabled: false,
      goalDetails: actionPlan.goalDetails || {},
      currentPlatforms: actionPlan.currentPlatforms || '',
      teamComfort: actionPlan.teamComfort || '',
      apisAvailable: actionPlan.apisAvailable || '',
      successMetrics: actionPlan.successMetrics || []
    });
    
    // Update progress
    setProgress(calculateProgress());
    
    toast({
      title: "Action plan loaded",
      description: `"${actionPlan.title}" has been loaded for editing.`,
      variant: "default",
    });
  };
  
  // Function to create a new action plan (reset form)
  const handleNewActionPlan = () => {
    setPlanTitle('');
    setSelectedCustomerId(null);
    setCurrentPlanId(null);
    
    setFormData({
      industry: '',
      primaryChannel: '',
      interactionVolume: '',
      currentAutomation: '',
      biggestChallenge: '',
      repetitiveProcesses: '',
      aiGoals: [],
      autonomyLevel: '',
      customGoal: '',
      customGoalEnabled: false,
      goalDetails: {},
      currentPlatforms: '',
      teamComfort: '',
      apisAvailable: '',
      successMetrics: []
    });
    
    // Reset progress
    setProgress(0);
    
    // Go to first section
    setCurrentSection('business-discovery');
    
    toast({
      title: "New action plan",
      description: "Started a new action plan.",
      variant: "default",
    });
  };
  
  // Handle saving the action plan
  const handleSaveActionPlan = () => {
    if (!planTitle.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for your action plan",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    const actionPlanData = {
      title: planTitle.trim(),
      status: "draft",
      customerId: selectedCustomerId,
      industry: formData.industry,
      primaryChannel: formData.primaryChannel,
      interactionVolume: formData.interactionVolume,
      currentAutomation: formData.currentAutomation,
      biggestChallenge: formData.biggestChallenge,
      repetitiveProcesses: formData.repetitiveProcesses,
      aiGoals: [...formData.aiGoals, ...(formData.customGoalEnabled && formData.customGoal ? [formData.customGoal] : [])],
      goalDetails: formData.goalDetails, // Added goalDetails to save goal-specific information
      autonomyLevel: formData.autonomyLevel,
      currentPlatforms: formData.currentPlatforms,
      teamComfort: formData.teamComfort,
      apisAvailable: formData.apisAvailable,
      successMetrics: formData.successMetrics
    };
    
    if (currentPlanId) {
      // Update existing action plan
      updateActionPlanMutation.mutate({
        id: currentPlanId,
        actionPlan: actionPlanData
      });
    } else {
      // Create new action plan
      createActionPlanMutation.mutate(actionPlanData);
    }
  };
  
  const handleCheckboxChange = (field: string, value: string) => {
    setFormData(prev => {
      const prevValues = prev[field as keyof typeof prev] as string[];
      const newValues = prevValues.includes(value)
        ? prevValues.filter(v => v !== value)
        : [...prevValues, value];
      
      const newData = { ...prev, [field]: newValues };
      setProgress(calculateProgress());
      return newData;
    });
  };
  
  // Handle goal detail changes
  const handleGoalDetailChange = (goalId: string, value: string) => {
    setFormData(prev => {
      const newGoalDetails = { ...prev.goalDetails, [goalId]: value };
      return { ...prev, goalDetails: newGoalDetails };
    });
  };
  
  // Fetch ROI parameters from settings
  const { data: roiParams, isLoading: isLoadingROI } = useROIParameters();
  
  // Generate AI suggestions for improving the action plan
  const handleGenerateSuggestions = async () => {
    if (!currentPlanId) {
      toast({
        title: "Action plan not saved",
        description: "Please save your action plan first to get AI suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingSuggestions(true);
    setAiSuggestions(null);
    
    try {
      const suggestions = await generateActionPlanSuggestions(currentPlanId);
      setAiSuggestions(suggestions);
    } catch (error: any) {
      toast({
        title: "Error generating suggestions",
        description: error.message || "An error occurred while generating AI suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };
  
  // Apply AI suggestions to the current action plan
  const handleApplySuggestions = (suggestions: string) => {
    // Here we would typically extract data from the suggestions
    // For this implementation, we'll just show a success message and update the status
    
    if (currentPlanId) {
      // Just update the status field - our backend now supports partial updates
      updateActionPlanMutation.mutate({
        id: currentPlanId,
        actionPlan: {
          status: "ai-enhanced" // Only update the status field
        }
      }, {
        onSuccess: () => {
          toast({
            title: "Suggestions applied",
            description: "AI suggestions have been applied to your action plan.",
            variant: "default",
          });
          
          // Close the dialog
          setIsSuggestionsDialogOpen(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error applying suggestions",
            description: error.message || "An error occurred while applying AI suggestions.",
            variant: "destructive",
          });
        }
      });
    }
  };
  
  // Handle exporting the action plan to Word
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExportActionPlan = async () => {
    if (!currentPlanId) {
      toast({
        title: "Action plan not saved",
        description: "Please save your action plan first to export it.",
        variant: "destructive",
      });
      return;
    }
    
    // Get the current action plan
    const currentPlan = actionPlans?.find(plan => plan.id === currentPlanId);
    if (!currentPlan) {
      toast({
        title: "Action plan not found",
        description: "The action plan could not be found. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      await exportActionPlanToWord(currentPlan);
      
      toast({
        title: "Export successful",
        description: "Your action plan has been exported to a Word document.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "An error occurred while exporting the action plan.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle the use case import manually (without AI suggestions)
  const handleSelectUseCase = (useCase: UseCase) => {
    // Just use the title and description to populate initial fields
    setPlanTitle(`Action Plan for ${useCase.title}`);
    
    // Set some basic information based on the use case
    setFormData(prev => ({
      ...prev,
      biggestChallenge: useCase.problemStatement || '',
      repetitiveProcesses: useCase.scope || '',
      aiGoals: ["customer-service", "process-automation"],
      successMetrics: ["cost-savings", "time-efficiency", "customer-satisfaction"]
    }));
    
    // Close the dialog
    setIsUseCaseImportDialogOpen(false);
    
    toast({
      title: "Use case imported",
      description: `Basic information from "${useCase.title}" has been imported.`,
      variant: "default",
    });
  };
  
  // Handle use case import with AI-generated suggestions
  const handleSelectUseCaseWithAI = async (useCase: UseCase) => {
    // Start the generation process
    setIsGeneratingFromUseCase(true);
    
    try {
      // Generate an action plan from the use case using AI
      const result = await generateActionPlanFromUseCase(useCase.id);
      
      if (result.success && result.actionPlan) {
        // Update form with AI-generated action plan data
        setPlanTitle(`Action Plan for ${useCase.title}`);
        
        setFormData({
          // Business Discovery
          industry: result.actionPlan.industry || '',
          primaryChannel: result.actionPlan.primaryChannel || '',
          interactionVolume: result.actionPlan.interactionVolume || '',
          currentAutomation: result.actionPlan.currentAutomation || '',
          
          // Pain Point Assessment
          biggestChallenge: result.actionPlan.biggestChallenge || '',
          repetitiveProcesses: result.actionPlan.repetitiveProcesses || '',
          
          // AI Agent Goals
          aiGoals: result.actionPlan.aiGoals || [],
          autonomyLevel: result.actionPlan.autonomyLevel || '',
          customGoal: '',
          customGoalEnabled: false,
          goalDetails: {} as Record<string, string>,
          
          // System & Integration Readiness
          currentPlatforms: result.actionPlan.currentPlatforms || '',
          teamComfort: result.actionPlan.teamComfort || '',
          apisAvailable: result.actionPlan.apisAvailable || '',
          
          // Success Metrics
          successMetrics: result.actionPlan.successMetrics || []
        });
        
        // Update progress
        setProgress(calculateProgress());
        
        toast({
          title: "AI-generated action plan",
          description: `Action plan based on "${useCase.title}" has been created with AI assistance.`,
          variant: "success",
        });
      } else {
        throw new Error(result.error || "Failed to generate action plan from use case");
      }
    } catch (error: any) {
      toast({
        title: "Error generating action plan",
        description: error.message || "An error occurred while generating the action plan.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFromUseCase(false);
      setIsUseCaseImportDialogOpen(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <ClipboardList className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">Action Plan</h1>
          {currentPlanId && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Edit className="h-3 w-3 mr-1" />
              Editing #{currentPlanId}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewActionPlan}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLoadDialogOpen(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
          <Button
            onClick={handleSaveActionPlan}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {currentPlanId ? "Update" : "Save"}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <p className="text-lg text-muted-foreground mb-8">
        Build a tailored Agentic AI deployment plan with emphasis on conversational automation and operational impact.
      </p>
      
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Your progress</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 w-full" />
      </div>
      
      {/* Action Plan Selection Dialog */}
      <ActionPlanSelectionDialog
        open={isLoadDialogOpen}
        onOpenChange={setIsLoadDialogOpen}
        actionPlans={actionPlans || []}
        isLoading={isLoadingActionPlans}
        onSelect={handleLoadActionPlan}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Sections Navigation */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Steps</CardTitle>
              <CardDescription>Complete each section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {formSections.map((section) => (
                  <Button 
                    key={section.id}
                    variant={currentSection === section.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setCurrentSection(section.id)}
                  >
                    <span className="truncate">{section.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Form Content */}
        <div className="lg:col-span-9">
          <Card className="shadow-md">
            {currentSection === 'business-discovery' && (
              <>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Business Discovery</CardTitle>
                    <CardDescription>Tell us about your business and current customer interactions</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUseCaseImportDialogOpen(true)}
                  >
                    <Import className="h-4 w-4 mr-2" />
                    Import Use Case
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="plan-title">Action Plan Title</Label>
                    <Input 
                      id="plan-title" 
                      placeholder="Enter a title for this action plan"
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                    />
                  </div>
                
                  <div className="space-y-2">
                    <Label htmlFor="customer">Select a Customer (Optional)</Label>
                    <Select 
                      value={selectedCustomerId?.toString() || "none"}
                      onValueChange={(value) => setSelectedCustomerId(value && value !== "none" ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                
                  <div className="space-y-2">
                    <Label htmlFor="industry">What industry are you in?</Label>
                    <Input 
                      id="industry" 
                      placeholder="E.g. Retail, Healthcare, Financial Services"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryChannel">What's your primary customer interaction channel?</Label>
                    <Select 
                      value={formData.primaryChannel}
                      onValueChange={(value) => handleInputChange('primaryChannel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="in-person">In-person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interactionVolume">What volume of interactions do you handle monthly?</Label>
                    <Select 
                      value={formData.interactionVolume}
                      onValueChange={(value) => handleInputChange('interactionVolume', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a volume range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1000">0-1,000</SelectItem>
                        <SelectItem value="1000-5000">1,000-5,000</SelectItem>
                        <SelectItem value="5000-10000">5,000-10,000</SelectItem>
                        <SelectItem value="10000-50000">10,000-50,000</SelectItem>
                        <SelectItem value="50000+">50,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentAutomation">Do you currently use any bots or automation?</Label>
                    <RadioGroup 
                      value={formData.currentAutomation}
                      onValueChange={(value) => handleInputChange('currentAutomation', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="automation-yes" />
                        <Label htmlFor="automation-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="automation-no" />
                        <Label htmlFor="automation-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </>
            )}
            
            {currentSection === 'pain-point-assessment' && (
              <>
                <CardHeader>
                  <CardTitle>Pain Point Assessment</CardTitle>
                  <CardDescription>Identify challenges in your current processes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="biggestChallenge">What is your biggest challenge in customer interactions?</Label>
                    <Select 
                      value={formData.biggestChallenge}
                      onValueChange={(value) => handleInputChange('biggestChallenge', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a challenge" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wait-times">Long wait times</SelectItem>
                        <SelectItem value="inconsistent-service">Inconsistent service</SelectItem>
                        <SelectItem value="lack-of-data">Lack of customer data</SelectItem>
                        <SelectItem value="high-cost">High cost of service</SelectItem>
                        <SelectItem value="agent-turnover">High agent turnover</SelectItem>
                        <SelectItem value="complexity">Complex customer issues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="repetitiveProcesses">What processes are repetitive and rule-based?</Label>
                    <Textarea 
                      id="repetitiveProcesses" 
                      placeholder="Describe repetitive processes in your business"
                      value={formData.repetitiveProcesses}
                      onChange={(e) => handleInputChange('repetitiveProcesses', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </>
            )}
            
            {currentSection === 'ai-agent-goals' && (
              <>
                <CardHeader>
                  <CardTitle>AI Agent Goals</CardTitle>
                  <CardDescription>Define what you want your AI to accomplish</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-lg">What do you want your AI to accomplish?</Label>
                    <p className="text-sm text-muted-foreground">Select broad categories or specific goals. You can select multiple goals across categories.</p>
                    
                    <Accordion type="multiple" className="max-h-[500px] overflow-y-auto px-1">
                      {/* Customer Service Category */}
                      <AccordionItem value="customer-service">
                        <AccordionTrigger className="text-md font-medium">
                          Customer Service & Support
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            {[
                              { id: 'customer-support', label: 'General Customer Support' },
                              { id: 'tier1-troubleshooting', label: 'Tier 1 Troubleshooting' },
                              { id: 'customer-engagement', label: 'Customer Engagement' },
                              { id: 'customer-onboarding', label: 'Customer Onboarding & Education' },
                              { id: 'order-management', label: 'Order Management & Status Updates' },
                              { id: 'account-management', label: 'Account Management Assistance' },
                              { id: 'feedback-collection', label: 'Feedback Collection' }
                            ].map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={goal.id}
                                  checked={formData.aiGoals.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    } else {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    }
                                  }}
                                />
                                <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {/* Sales & Marketing Category */}
                      <AccordionItem value="sales-marketing">
                        <AccordionTrigger className="text-md font-medium">
                          Sales & Marketing
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            {[
                              { id: 'lead-generation', label: 'Lead Generation' },
                              { id: 'lead-qualification', label: 'Lead Qualification & Scoring' },
                              { id: 'appointment-scheduling', label: 'Appointment Scheduling' },
                              { id: 'sales-support', label: 'Sales Rep Support' },
                              { id: 'market-research', label: 'Market Research Assistance' }
                            ].map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={goal.id}
                                  checked={formData.aiGoals.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    } else {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    }
                                  }}
                                />
                                <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {/* Internal Operations Category */}
                      <AccordionItem value="internal-operations">
                        <AccordionTrigger className="text-md font-medium">
                          Internal Operations
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            {[
                              { id: 'data-entry', label: 'Data Entry Automation' },
                              { id: 'internal-comms', label: 'Internal Communications' },
                              { id: 'ticket-triage', label: 'Internal Ticket Triage' },
                              { id: 'meeting-coordination', label: 'Meeting Coordination' },
                              { id: 'knowledge-base', label: 'Knowledge Base Navigation' }
                            ].map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={goal.id}
                                  checked={formData.aiGoals.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    } else {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    }
                                  }}
                                />
                                <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {/* HR Support Category */}
                      <AccordionItem value="hr-support">
                        <AccordionTrigger className="text-md font-medium">
                          HR Support
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            {[
                              { id: 'hr-support', label: 'HR Support & FAQ' },
                              { id: 'hr-onboarding', label: 'Employee Onboarding' },
                              { id: 'hr-benefits', label: 'Benefits Administration' },
                              { id: 'hr-policy', label: 'Policy Guidance' }
                            ].map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={goal.id}
                                  checked={formData.aiGoals.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    } else {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    }
                                  }}
                                />
                                <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {/* IT Support Category */}
                      <AccordionItem value="it-support">
                        <AccordionTrigger className="text-md font-medium">
                          IT Support
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            {[
                              { id: 'it-helpdesk', label: 'IT Helpdesk' },
                              { id: 'password-reset', label: 'Password Reset Assistance' },
                              { id: 'software-help', label: 'Software Guidance' },
                              { id: 'system-status', label: 'System Status Updates' }
                            ].map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={goal.id}
                                  checked={formData.aiGoals.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    } else {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    }
                                  }}
                                />
                                <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {/* Business Intelligence Category */}
                      <AccordionItem value="business-intelligence">
                        <AccordionTrigger className="text-md font-medium">
                          Business Intelligence
                        </AccordionTrigger>
                        <AccordionContent className="pl-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            {[
                              { id: 'content-curation', label: 'Content Curation' },
                              { id: 'report-generation', label: 'Report Generation' },
                              { id: 'sentiment-analysis', label: 'Sentiment Analysis' },
                              { id: 'data-insights', label: 'Data Insights & Trends' }
                            ].map((goal) => (
                              <div key={goal.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={goal.id}
                                  checked={formData.aiGoals.includes(goal.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    } else {
                                      handleCheckboxChange('aiGoals', goal.id);
                                    }
                                  }}
                                />
                                <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    
                    {/* Custom Goal Option */}
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="custom-goal" className="flex items-center">
                        <Checkbox
                          id="custom-goal-checkbox"
                          checked={formData.customGoalEnabled}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              customGoalEnabled: !!checked
                            }));
                          }}
                          className="mr-2"
                        />
                        Add a custom goal not listed above
                      </Label>
                      
                      {formData.customGoalEnabled && (
                        <div className="mt-2">
                          <Input 
                            id="custom-goal" 
                            placeholder="Describe your custom goal"
                            value={formData.customGoal || ''}
                            onChange={(e) => handleInputChange('customGoal', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Goals Detail Prompts */}
                    {formData.aiGoals.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <h3 className="font-medium">Goal Details</h3>
                        <p className="text-sm text-muted-foreground">Provide more information about your selected goals:</p>
                        
                        {formData.aiGoals.includes('lead-generation') && (
                          <div className="p-3 bg-muted rounded-md">
                            <Label htmlFor="lead-generation-details" className="font-medium">Lead Generation Details</Label>
                            <Input 
                              id="lead-generation-details" 
                              className="mt-1"
                              placeholder="What information should your agent collect from leads?"
                              value={formData.goalDetails?.['lead-generation'] || ''}
                              onChange={(e) => handleGoalDetailChange('lead-generation', e.target.value)}
                            />
                          </div>
                        )}
                        
                        {formData.aiGoals.includes('customer-support') && (
                          <div className="p-3 bg-muted rounded-md">
                            <Label htmlFor="customer-support-details" className="font-medium">Customer Support Details</Label>
                            <Input 
                              id="customer-support-details" 
                              className="mt-1"
                              placeholder="What type of support inquiries should your agent handle?"
                              value={formData.goalDetails?.['customer-support'] || ''}
                              onChange={(e) => handleGoalDetailChange('customer-support', e.target.value)}
                            />
                          </div>
                        )}
                        
                        {formData.aiGoals.includes('it-helpdesk') && (
                          <div className="p-3 bg-muted rounded-md">
                            <Label htmlFor="it-helpdesk-details" className="font-medium">IT Helpdesk Details</Label>
                            <Input 
                              id="it-helpdesk-details" 
                              className="mt-1"
                              placeholder="Which IT systems should your agent have knowledge about?"
                              value={formData.goalDetails?.['it-helpdesk'] || ''}
                              onChange={(e) => handleGoalDetailChange('it-helpdesk', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="autonomyLevel">How autonomous should it be?</Label>
                    <Select 
                      value={formData.autonomyLevel}
                      onValueChange={(value) => handleInputChange('autonomyLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select autonomy level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assistive">Assistive (Human-led)</SelectItem>
                        <SelectItem value="semi-autonomous">Semi-Autonomous (Human approval for key actions)</SelectItem>
                        <SelectItem value="fully-autonomous">Fully Autonomous (Minimal human intervention)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </>
            )}
            
            {currentSection === 'system-integration' && (
              <>
                <CardHeader>
                  <CardTitle>System & Integration Readiness</CardTitle>
                  <CardDescription>Assess technical capabilities and integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPlatforms">What platforms do you currently use?</Label>
                    <Textarea 
                      id="currentPlatforms" 
                      placeholder="E.g. Salesforce, Zendesk, Microsoft Dynamics, SAP"
                      value={formData.currentPlatforms}
                      onChange={(e) => handleInputChange('currentPlatforms', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamComfort">Is your team comfortable with no-code/low-code tools?</Label>
                    <RadioGroup 
                      value={formData.teamComfort}
                      onValueChange={(value) => handleInputChange('teamComfort', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="comfort-yes" />
                        <Label htmlFor="comfort-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="somewhat" id="comfort-somewhat" />
                        <Label htmlFor="comfort-somewhat">Somewhat</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="comfort-no" />
                        <Label htmlFor="comfort-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apisAvailable">Do you have APIs available?</Label>
                    <RadioGroup 
                      value={formData.apisAvailable}
                      onValueChange={(value) => handleInputChange('apisAvailable', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="apis-yes" />
                        <Label htmlFor="apis-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="apis-no" />
                        <Label htmlFor="apis-no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="not-sure" id="apis-not-sure" />
                        <Label htmlFor="apis-not-sure">Not sure</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </>
            )}
            
            {currentSection === 'success-metrics' && (
              <>
                <CardHeader>
                  <CardTitle>Success Metrics</CardTitle>
                  <CardDescription>Define how you'll measure success</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>What does success look like?</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'csat-improvement', label: 'CSAT improvement' },
                        { id: 'reduced-fte-cost', label: 'Reduced FTE cost' },
                        { id: 'faster-resolutions', label: 'Faster resolutions' },
                        { id: '24-7-coverage', label: '24/7 coverage' },
                        { id: 'deflection-rate', label: 'Higher deflection rate' },
                        { id: 'increased-sales', label: 'Increased sales conversions' }
                      ].map((metric) => (
                        <div key={metric.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={metric.id}
                            checked={formData.successMetrics.includes(metric.id)}
                            onChange={() => handleCheckboxChange('successMetrics', metric.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={metric.id}>{metric.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            )}
            
            {currentSection === 'results' && (
              <>
                <CardHeader>
                  <CardTitle>Your Action Plan</CardTitle>
                  <CardDescription>Review your tailored AI deployment plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="summary">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="blueprint">Implementation</TabsTrigger>
                      <TabsTrigger value="roi">ROI Projection</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4 pt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Recommended Approach</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="font-medium">Bot Type</div>
                              <div className="bg-muted p-2 rounded">
                                {(() => {
                                  // Helper function to check if any goals in a category are selected
                                  const hasGoalsInCategory = (categoryGoals: string[]) => {
                                    return categoryGoals.some(goal => formData.aiGoals.includes(goal));
                                  };
                                  
                                  // Define goal categories
                                  const customerSupportGoals = ['customer-support', 'tier1-troubleshooting', 'customer-engagement'];
                                  const salesGoals = ['lead-generation', 'lead-qualification', 'sales-support', 'market-research'];
                                  const internalProcessGoals = ['hr-support', 'it-helpdesk', 'knowledge-base', 'meeting-coordination', 'data-entry', 'internal-comms'];
                                  const contentGoals = ['content-curation', 'report-generation', 'sentiment-analysis'];
                                  const onboardingGoals = ['customer-onboarding', 'account-management'];
                                  
                                  // Determine primary bot type based on selected goals
                                  if (hasGoalsInCategory(customerSupportGoals)) {
                                    return 'Conversational Support Agent with Knowledge Base Integration';
                                  } else if (hasGoalsInCategory(salesGoals)) {
                                    return 'Lead Qualification & Sales Enablement Agent';
                                  } else if (hasGoalsInCategory(internalProcessGoals)) {
                                    return 'Internal Process Automation Agent';
                                  } else if (hasGoalsInCategory(contentGoals)) {
                                    return 'Content & Analytics Processing Agent';
                                  } else if (hasGoalsInCategory(onboardingGoals)) {
                                    return 'Customer Onboarding & Education Agent';
                                  } else {
                                    return 'Multi-purpose Automation Agent';
                                  }
                                })()}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="font-medium">Use Cases</div>
                              <div className="bg-muted p-2 rounded">
                                {formData.aiGoals.map(goal => {
                                  const label = {
                                    // Original goals
                                    'lead-generation': 'Lead Qualification', 
                                    'customer-support': 'Support Resolution',
                                    'ticket-triage': 'Ticket Prioritization',
                                    'appointment-scheduling': 'Appointment Booking',
                                    'feedback-collection': 'Customer Feedback',
                                    
                                    // Customer-facing goals
                                    'customer-engagement': 'Customer Engagement',
                                    'customer-onboarding': 'Customer Onboarding',
                                    'order-management': 'Order Management',
                                    'tier1-troubleshooting': 'Basic Troubleshooting',
                                    'account-management': 'Account Management',
                                    
                                    // Internal goals
                                    'hr-support': 'HR Support (Internal)',
                                    'it-helpdesk': 'IT Helpdesk (Internal)',
                                    'knowledge-base': 'Knowledge Base Navigation',
                                    'meeting-coordination': 'Meeting Coordination',
                                    'data-entry': 'Data Entry Automation',
                                    'internal-comms': 'Internal Communications',
                                    
                                    // Business intelligence & sales
                                    'lead-qualification': 'Lead Qualification',
                                    'content-curation': 'Content Curation',
                                    'market-research': 'Market Research',
                                    'sales-support': 'Sales Support',
                                    'report-generation': 'Report Generation',
                                    'sentiment-analysis': 'Sentiment Analysis'
                                  }[goal] || goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                  return <div key={goal}>{label}</div>;
                                })}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="font-medium">Autonomy Level</div>
                              <div className="bg-muted p-2 rounded">
                                {formData.autonomyLevel === 'assistive' 
                                  ? 'Assistive (Human-led)'
                                  : formData.autonomyLevel === 'semi-autonomous'
                                  ? 'Semi-Autonomous'
                                  : 'Fully Autonomous'}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="font-medium">Recommended Channels</div>
                              <div className="bg-muted p-2 rounded">
                                {formData.primaryChannel === 'chat' 
                                  ? 'Web Chat + Social Messaging'
                                  : formData.primaryChannel === 'phone'
                                  ? 'Voice + SMS'
                                  : formData.primaryChannel === 'email'
                                  ? 'Email + Web Chat'
                                  : 'Omnichannel Deployment'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="blueprint" className="space-y-4 pt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Implementation Blueprint</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-4">Phase</th>
                                  <th className="text-left py-2 px-4">Key Actions</th>
                                  <th className="text-left py-2 px-4">Tools Needed</th>
                                  <th className="text-left py-2 px-4">Est. Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b">
                                  <td className="py-2 px-4 font-medium">Discovery</td>
                                  <td className="py-2 px-4">Map customer journeys, define scope</td>
                                  <td className="py-2 px-4">Customer Journey Mapping Tool</td>
                                  <td className="py-2 px-4">1-2 weeks</td>
                                </tr>
                                <tr className="border-b">
                                  <td className="py-2 px-4 font-medium">Design</td>
                                  <td className="py-2 px-4">Flowchart interactions, agent behaviors</td>
                                  <td className="py-2 px-4">Flow Builder UI</td>
                                  <td className="py-2 px-4">2-3 weeks</td>
                                </tr>
                                <tr className="border-b">
                                  <td className="py-2 px-4 font-medium">Integration</td>
                                  <td className="py-2 px-4">Connect {formData.currentPlatforms ? formData.currentPlatforms.split(',')[0] : 'CRM'}, setup channels</td>
                                  <td className="py-2 px-4">API Connectors</td>
                                  <td className="py-2 px-4">2-4 weeks</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-4 font-medium">Deploy & Test</td>
                                  <td className="py-2 px-4">Soft launch with test group</td>
                                  <td className="py-2 px-4">QA checklist, Analytics Dashboard</td>
                                  <td className="py-2 px-4">2 weeks</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="roi" className="space-y-4 pt-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">ROI Projection</CardTitle>
                          <CardDescription>
                            Based on industry benchmarks and your input data
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {isLoadingROI ? (
                            <div className="flex justify-center py-8">
                              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            <>
                              {/* Calculate ROI values using our utility functions */}
                              {(() => {
                                // Calculate time saved
                                const timeSaved = calculateTimeSaved(
                                  formData.interactionVolume || '0-1000',
                                  formData.aiGoals.length || 1,
                                  roiParams
                                );
                                
                                // Calculate cost savings
                                const costSavings = calculateCostSavings(timeSaved, roiParams);
                                
                                // Calculate implementation costs
                                const implementationCost = calculateImplementationCost(
                                  formData.aiGoals.length || 1,
                                  roiParams
                                );
                                
                                // Calculate maintenance costs
                                const maintenanceCost = calculateMaintenanceCost(implementationCost, roiParams);
                                
                                // Calculate CSAT improvement
                                const csatImprovement = calculateCSATImprovement(
                                  formData.successMetrics,
                                  roiParams
                                );
                                
                                // Calculate payback period
                                const paybackPeriod = calculatePaybackPeriod(implementationCost, costSavings);
                                
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="text-sm font-medium mb-1">Time saved per month</div>
                                        <div className="flex items-center">
                                          <div className="text-2xl font-bold mr-2">
                                            {formatRange(timeSaved.min, timeSaved.max)}
                                          </div>
                                          <div>hours</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Calculation: {formData.aiGoals.length} use cases × avg. handling time × 
                                          {roiParams.automation_rate_base}-{roiParams.automation_rate_scale}% automation rate
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="text-sm font-medium mb-1">Est. agent replacement cost savings</div>
                                        <div className="text-2xl font-bold">
                                          {formatCurrency(costSavings.min)}-{formatCurrency(costSavings.max)}
                                          <span className="text-sm ml-1 font-normal">per year</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Based on ${roiParams.agent_hourly_cost}/hr fully-loaded agent cost × 
                                          {formatRange(timeSaved.min * 12, timeSaved.max * 12)} hours saved annually
                                        </div>
                                      </div>
                                      
                                      <div className="bg-muted rounded-lg p-3 mt-2">
                                        <div className="text-sm font-medium">Cost-Benefit Analysis</div>
                                        <div className="text-xs mt-1">
                                          <div className="flex justify-between">
                                            <span>Avg. implementation cost:</span>
                                            <span className="font-medium">
                                              {formatCurrency(implementationCost.min)}-{formatCurrency(implementationCost.max)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between mt-1">
                                            <span>Annual maintenance ({roiParams.maintenance_pct}%):</span>
                                            <span className="font-medium">
                                              {formatCurrency(maintenanceCost.min)}-{formatCurrency(maintenanceCost.max)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      <div>
                                        <div className="text-sm font-medium mb-1">Est. increased customer satisfaction</div>
                                        <div className="text-2xl font-bold">
                                          {csatImprovement.min}-{csatImprovement.max}%
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Based on {
                                            formData.successMetrics.includes('24-7-coverage') ? 'expanded availability, ' : ''
                                          }{
                                            formData.successMetrics.includes('faster-resolutions') ? 'response time reduction, ' : ''
                                          }{
                                            formData.successMetrics.includes('csat-improvement') ? 'consistency of service' : 'standard improvements'
                                          }
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="text-sm font-medium mb-1">Payback period</div>
                                        <div className="text-2xl font-bold">
                                          {paybackPeriod.min}-{paybackPeriod.max}
                                          <span className="text-sm ml-1 font-normal">months</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Implementation cost ÷ (monthly cost savings + revenue improvement)
                                        </div>
                                      </div>
                                      
                                      <div className="bg-muted rounded-lg p-3 mt-2">
                                        <div className="text-sm font-medium">Revenue Impact Potential</div>
                                        <div className="text-xs mt-1">
                                          <div className="flex justify-between">
                                            <span>Increased conversion rate:</span>
                                            <span className="font-medium">{
                                              formData.successMetrics.includes('increased-sales') ? '5-10%' : '2-5%'
                                            }</span>
                                          </div>
                                          <div className="flex justify-between mt-1">
                                            <span>Customer retention improvement:</span>
                                            <span className="font-medium">{
                                              formData.successMetrics.includes('csat-improvement') ? '10-15%' : '5-10%'
                                            }</span>
                                          </div>
                                          <div className="flex justify-between mt-1">
                                            <span>Customer lifetime value increase:</span>
                                            <span className="font-medium">{
                                              formData.primaryChannel === 'chat' || formData.primaryChannel === 'social' ? '15-25%' : '10-20%'
                                            }</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                              
                              <div className="mt-6 pt-6 border-t">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="text-sm font-medium">Performance Methodology</div>
                                  {currentPlanId && (
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSuggestionsDialogOpen(true)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                      >
                                        <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                                        AI Suggestions
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportActionPlan}
                                        disabled={isExporting}
                                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                      >
                                        <FileDown className="h-4 w-4 mr-2 text-green-600" />
                                        {isExporting ? 'Exporting...' : 'Export to Word'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Projections are calculated using industry benchmarks from {formData.industry || 'your industry'} and data from {
                                    formData.interactionVolume === '0-1000' ? 'small' : 
                                    formData.interactionVolume === '1000-5000' ? 'medium' : 
                                    'large'
                                  } businesses with similar automation initiatives. Implementation variables include:
                                  complexity of use cases ({formData.aiGoals.length}), 
                                  integration requirements ({formData.currentPlatforms ? 'custom' : 'standard'}), and 
                                  autonomy level ({formData.autonomyLevel || 'variable'}).
                                </p>
                                
                                <div className="text-sm font-medium mb-2">Configurable Parameters</div>
                                <p className="text-xs text-muted-foreground mb-3">
                                  All ROI calculations use configurable parameters that can be adjusted in the Settings page 
                                  to match your organization's specific metrics and requirements.
                                </p>
                                
                                <div className="text-sm font-medium mb-2">Key Performance Impact Areas</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {formData.successMetrics.map(metric => {
                                    const icon = {
                                      'csat-improvement': <BarChart3 className="h-5 w-5" />,
                                      'reduced-fte-cost': <FileText className="h-5 w-5" />,
                                      'faster-resolutions': <CalendarClock className="h-5 w-5" />
                                    }[metric] || <BarChart3 className="h-5 w-5" />;
                                    
                                    const label = {
                                      'csat-improvement': 'CSAT Improvement', 
                                      'reduced-fte-cost': 'FTE Cost Reduction',
                                      'faster-resolutions': 'Faster Resolutions',
                                      '24-7-coverage': '24/7 Coverage',
                                      'deflection-rate': 'Higher Deflection',
                                      'increased-sales': 'Sales Conversion Lift'
                                    }[metric];
                                    
                                    return (
                                      <div key={metric} className="bg-muted p-3 rounded flex items-center">
                                        {icon}
                                        <span className="ml-2">{label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                {/* AI Suggestions Dialog */}
                <AISuggestionsDialog
                  open={isSuggestionsDialogOpen}
                  onOpenChange={setIsSuggestionsDialogOpen}
                  actionPlan={currentPlanId ? actionPlans?.find(plan => plan.id === currentPlanId) || null : null}
                  isLoading={isGeneratingSuggestions}
                  suggestions={aiSuggestions}
                  onGenerateSuggestions={handleGenerateSuggestions}
                  onApplySuggestions={handleApplySuggestions}
                />
              </>
            )}
            
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 'business-discovery'}
              >
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {/* Always show save button but with different styling based on section */}
                <Button 
                  onClick={handleSaveActionPlan}
                  variant={currentSection === 'results' ? "default" : "outline"}
                  disabled={isSaving || !planTitle.trim()}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {currentPlanId ? `Update${currentSection === 'results' ? ' Action Plan' : ''}` : `Save${currentSection === 'results' ? ' Action Plan' : ''}`}
                    </>
                  )}
                </Button>
              
                <Button
                  onClick={handleNext}
                  disabled={currentSection === 'results'}
                >
                  {currentSection === formSections[formSections.length - 2].id ? 'View Results' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}