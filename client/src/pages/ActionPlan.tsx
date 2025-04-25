import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, FileText, ClipboardList, BarChart3, CalendarClock, Save, Plus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useROIParameters, calculateTimeSaved, calculateCostSavings, calculateImplementationCost, 
         calculateMaintenanceCost, calculateCSATImprovement, calculatePaybackPeriod, 
         formatCurrency, formatRange } from '../lib/roiCalculator';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchAllCustomers, Customer, createActionPlan, ActionPlan as ActionPlanType } from '../lib/api';
import { useToast } from '@/hooks/use-toast';

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
  
  // Setup mutation for creating an action plan
  const createActionPlanMutation = useMutation({
    mutationFn: createActionPlan,
    onSuccess: (data) => {
      toast({
        title: "Action plan saved successfully",
        description: `Your action plan "${data.title}" has been saved.`,
        variant: "default",
      });
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
      aiGoals: formData.aiGoals,
      autonomyLevel: formData.autonomyLevel,
      currentPlatforms: formData.currentPlatforms,
      teamComfort: formData.teamComfort,
      apisAvailable: formData.apisAvailable,
      successMetrics: formData.successMetrics
    };
    
    createActionPlanMutation.mutate(actionPlanData);
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
  
  // Fetch ROI parameters from settings
  const { data: roiParams, isLoading: isLoadingROI } = useROIParameters();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <ClipboardList className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">Action Plan</h1>
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
                <CardHeader>
                  <CardTitle>Business Discovery</CardTitle>
                  <CardDescription>Tell us about your business and current customer interactions</CardDescription>
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
                      value={selectedCustomerId?.toString() || ''}
                      onValueChange={(value) => setSelectedCustomerId(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
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
                  <div className="space-y-2">
                    <Label>What do you want your AI to accomplish?</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'lead-generation', label: 'Lead generation' },
                        { id: 'customer-support', label: 'Customer support' },
                        { id: 'ticket-triage', label: 'Internal ticket triage' },
                        { id: 'appointment-scheduling', label: 'Appointment scheduling' },
                        { id: 'feedback-collection', label: 'Feedback collection' }
                      ].map((goal) => (
                        <div key={goal.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={goal.id}
                            checked={formData.aiGoals.includes(goal.id)}
                            onChange={() => handleCheckboxChange('aiGoals', goal.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={goal.id}>{goal.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
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
                                {formData.aiGoals.includes('customer-support') 
                                  ? 'Conversational Support Agent with Knowledge Base Integration' 
                                  : formData.aiGoals.includes('lead-generation')
                                  ? 'Lead Qualification & Nurturing Agent'
                                  : 'Multi-purpose Automation Agent'}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="font-medium">Use Cases</div>
                              <div className="bg-muted p-2 rounded">
                                {formData.aiGoals.map(goal => {
                                  const label = {
                                    'lead-generation': 'Lead Qualification', 
                                    'customer-support': 'Support Resolution',
                                    'ticket-triage': 'Ticket Prioritization',
                                    'appointment-scheduling': 'Appointment Booking',
                                    'feedback-collection': 'Customer Feedback'
                                  }[goal];
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
                                <div className="text-sm font-medium mb-2">Performance Methodology</div>
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
              
              <Button
                onClick={handleNext}
                disabled={currentSection === 'results'}
              >
                {currentSection === formSections[formSections.length - 2].id ? 'View Results' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}