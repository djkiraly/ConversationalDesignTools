import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, BarChart, CheckSquare, FileText, BookOpen, Compass, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UseCaseDevelopment() {
  // State to track active tab
  const [activeTab, setActiveTab] = useState("discovery");
  const { toast } = useToast();
  
  // State for industry and business function selection
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // State for questionnaire generation
  const [isGeneratingQuestionnaire, setIsGeneratingQuestionnaire] = useState(false);
  const [questionnaireContent, setQuestionnaireContent] = useState("");
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState(false);
  
  // State for framework content
  const [isGeneratingFramework, setIsGeneratingFramework] = useState(false);
  const [frameworkContent, setFrameworkContent] = useState("");
  const [showFrameworkDialog, setShowFrameworkDialog] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");
  
  // Industry options
  const industries = [
    { value: "finance", label: "Finance & Banking" },
    { value: "healthcare", label: "Healthcare" },
    { value: "retail", label: "Retail & E-commerce" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "technology", label: "Technology" },
    { value: "telecom", label: "Telecommunications" },
    { value: "insurance", label: "Insurance" },
    { value: "energy", label: "Energy & Utilities" }
  ];
  
  // Business function options
  const businessFunctions = [
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "customerService", label: "Customer Service" },
    { value: "operations", label: "Operations" },
    { value: "hr", label: "Human Resources" },
    { value: "finance", label: "Finance & Accounting" },
    { value: "it", label: "IT & Security" },
    { value: "supplyChain", label: "Supply Chain" }
  ];
  
  // Function to generate questionnaire
  const generateQuestionnaire = async () => {
    if (!selectedIndustry || !selectedFunction) {
      toast({
        title: "Missing information",
        description: "Please select both an industry and business function.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingQuestionnaire(true);
    
    try {
      const response = await fetch('/api/use-case-development/generate-questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry: industries.find(i => i.value === selectedIndustry)?.label || selectedIndustry,
          businessFunction: businessFunctions.find(f => f.value === selectedFunction)?.label || selectedFunction,
          companyName
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questionnaire');
      }
      
      setQuestionnaireContent(data.content);
      setShowQuestionnaireDialog(true);
    } catch (error) {
      console.error('Error generating questionnaire:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate questionnaire. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestionnaire(false);
    }
  };
  
  // Function to load framework content
  const loadFrameworkContent = async (frameworkName: string) => {
    setSelectedFramework(frameworkName);
    setIsGeneratingFramework(true);
    
    try {
      const response = await fetch('/api/use-case-development/framework-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frameworkName
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load framework content');
      }
      
      setFrameworkContent(data.content);
      setShowFrameworkDialog(true);
    } catch (error: any) {
      console.error('Error loading framework content:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load framework content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFramework(false);
    }
  };
  
  // Dummy data for use cases
  const useCases = [
    {
      id: 1,
      title: "Customer Churn Prediction",
      category: "Customer Analytics",
      description: "Predict which customers are likely to cancel services or stop using the product",
      industry: "finance",
      function: "marketing",
      complexity: "medium",
      dataRequirements: ["Customer metadata", "Transaction history", "Service usage patterns", "Support ticket history"],
      impactPotential: "high"
    },
    {
      id: 2,
      title: "Predictive Maintenance",
      category: "Operations",
      description: "Predict equipment failures before they occur to schedule maintenance proactively",
      industry: "manufacturing",
      function: "operations",
      complexity: "high",
      dataRequirements: ["Equipment sensor data", "Maintenance records", "Environmental data", "Operating parameters"],
      impactPotential: "high"
    },
    {
      id: 3,
      title: "Document Automation",
      category: "Process Efficiency",
      description: "Extract, classify, and process information from documents automatically",
      industry: "insurance",
      function: "operations",
      complexity: "medium",
      dataRequirements: ["Document images/PDFs", "Form templates", "Classification examples"],
      impactPotential: "medium"
    },
    {
      id: 4,
      title: "Sentiment Analysis",
      category: "Customer Insights",
      description: "Analyze customer feedback and social media to understand sentiment and emerging issues",
      industry: "retail",
      function: "customerService",
      complexity: "low",
      dataRequirements: ["Customer reviews", "Support conversations", "Social media mentions"],
      impactPotential: "medium"
    },
    {
      id: 5,
      title: "Personalized Recommendations",
      category: "Revenue Growth",
      description: "Suggest relevant products or content based on user behavior and preferences",
      industry: "retail",
      function: "sales",
      complexity: "medium",
      dataRequirements: ["User behavior data", "Purchase history", "Product metadata", "Demographic information"],
      impactPotential: "high"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Compass className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">Use-Case Development</h1>
      </div>
      
      <p className="text-lg text-muted-foreground mb-8">
        Collaboratively identify, define, qualify, and prioritize high-value AI use cases aligned with strategic objectives.
      </p>
      
      <Tabs defaultValue="discovery" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="discovery">
            <div className="flex items-center">
              <Compass className="h-4 w-4 mr-2" />
              <span>Guided Discovery</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="ideation">
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              <span>AI Opportunity Identification</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="qualification">
            <div className="flex items-center">
              <CheckSquare className="h-4 w-4 mr-2" />
              <span>Qualification & Prioritization</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="definition">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>Definition & Scoping</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Guided Discovery & Problem Framing Tab */}
        <TabsContent value="discovery">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Criteria</CardTitle>
                  <CardDescription>Select the appropriate context for your use case discovery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="function">Business Function</Label>
                    <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                      <SelectTrigger id="function">
                        <SelectValue placeholder="Select function" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessFunctions.map(func => (
                          <SelectItem key={func.value} value={func.value}>
                            {func.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      placeholder="Enter company name" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={generateQuestionnaire}
                    disabled={isGeneratingQuestionnaire}
                  >
                    {isGeneratingQuestionnaire ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Questionnaire'
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Frameworks</CardTitle>
                  <CardDescription>Pain point identification tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => loadFrameworkContent("Jobs to be Done")}
                      disabled={isGeneratingFramework}
                    >
                      {isGeneratingFramework && selectedFramework === "Jobs to be Done" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <span className="mr-2">•</span>
                      )}
                      Jobs to be Done
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => loadFrameworkContent("5 Whys Analysis")}
                      disabled={isGeneratingFramework}
                    >
                      {isGeneratingFramework && selectedFramework === "5 Whys Analysis" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <span className="mr-2">•</span>
                      )}
                      5 Whys Analysis
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => loadFrameworkContent("Value Stream Mapping")}
                      disabled={isGeneratingFramework}
                    >
                      {isGeneratingFramework && selectedFramework === "Value Stream Mapping" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <span className="mr-2">•</span>
                      )}
                      Value Stream Mapping
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => loadFrameworkContent("SWOT Analysis")}
                      disabled={isGeneratingFramework}
                    >
                      {isGeneratingFramework && selectedFramework === "SWOT Analysis" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <span className="mr-2">•</span>
                      )}
                      SWOT Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Business Objectives & Pain Points</CardTitle>
                  <CardDescription>Document the client's strategic goals and challenges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="strategic-objectives">Strategic Objectives</Label>
                      <Textarea 
                        id="strategic-objectives" 
                        placeholder="What are the client's key business objectives or KPIs?" 
                        className="min-h-[100px] mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pain-points">Pain Points</Label>
                      <Textarea 
                        id="pain-points" 
                        placeholder="What specific challenges, inefficiencies, or unmet goals does the client face?" 
                        className="min-h-[100px] mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="current-process">Current Process</Label>
                      <Textarea 
                        id="current-process" 
                        placeholder="Describe the current process, systems, or approaches used to address this area" 
                        className="min-h-[100px] mt-2"
                      />
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline">Save Draft</Button>
                      <Button onClick={() => setActiveTab("ideation")}>
                        Continue to Ideation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* AI Opportunity Identification & Ideation Tab */}
        <TabsContent value="ideation">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Use Case Library</CardTitle>
                  <CardDescription>Explore proven AI use cases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search-use-cases">Search</Label>
                      <Input id="search-use-cases" placeholder="Search use cases..." />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="filter-industry">Filter by Industry</Label>
                      <Select>
                        <SelectTrigger id="filter-industry">
                          <SelectValue placeholder="All industries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All industries</SelectItem>
                          {industries.map(industry => (
                            <SelectItem key={industry.value} value={industry.value}>
                              {industry.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="filter-function">Filter by Function</Label>
                      <Select>
                        <SelectTrigger id="filter-function">
                          <SelectValue placeholder="All functions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All functions</SelectItem>
                          {businessFunctions.map(func => (
                            <SelectItem key={func.value} value={func.value}>
                              {func.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="filter-impact">Filter by Impact</Label>
                      <Select>
                        <SelectTrigger id="filter-impact">
                          <SelectValue placeholder="All impacts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All impacts</SelectItem>
                          <SelectItem value="high">High Impact</SelectItem>
                          <SelectItem value="medium">Medium Impact</SelectItem>
                          <SelectItem value="low">Low Impact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Suggested Use Cases</CardTitle>
                  <CardDescription>Based on your discovery inputs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete the discovery phase to receive tailored use case suggestions.
                  </p>
                  <Button className="w-full">
                    Generate Suggestions
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Use Case Catalog</CardTitle>
                  <CardDescription>Browse and select relevant AI use cases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {useCases.map(useCase => (
                      <div key={useCase.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{useCase.title}</h3>
                          <div className="flex gap-2">
                            <Badge variant="outline">{useCase.category}</Badge>
                            <Badge 
                              variant={
                                useCase.impactPotential === 'high' ? 'default' : 
                                useCase.impactPotential === 'medium' ? 'secondary' : 'outline'
                              }
                            >
                              {useCase.impactPotential.charAt(0).toUpperCase() + useCase.impactPotential.slice(1)} Impact
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4">{useCase.description}</p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium">Data Requirements:</p>
                            <ul className="list-disc pl-4 text-sm text-muted-foreground">
                              {useCase.dataRequirements.map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Complexity:</p>
                            <p className="text-sm text-muted-foreground capitalize">{useCase.complexity}</p>
                            
                            <p className="text-sm font-medium mt-2">Typical ROI Timeframe:</p>
                            <p className="text-sm text-muted-foreground">
                              {useCase.complexity === 'low' ? '1-3 months' : 
                               useCase.complexity === 'medium' ? '3-6 months' : '6-12 months'}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button size="sm">
                            Select Use Case
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setActiveTab("discovery")}>
                        Back to Discovery
                      </Button>
                      <Button onClick={() => setActiveTab("qualification")}>
                        Continue to Qualification
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Qualification & Prioritization Tab */}
        <TabsContent value="qualification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feasibility Assessment</CardTitle>
                <CardDescription>Evaluate technical and organizational readiness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Data Readiness</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="data-availability">Data Availability</Label>
                        <Select defaultValue="partial">
                          <SelectTrigger id="data-availability" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="data-quality">Data Quality</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="data-quality" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="data-privacy">Data Privacy Concerns</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="data-privacy" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Technical Viability</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="integration-complexity">Integration Complexity</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="integration-complexity" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="infrastructure-readiness">Infrastructure Readiness</Label>
                        <Select defaultValue="partial">
                          <SelectTrigger id="infrastructure-readiness" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="technical-expertise">Technical Expertise</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="technical-expertise" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Organizational Readiness</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="stakeholder-buy-in">Stakeholder Buy-in</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="stakeholder-buy-in" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="change-readiness">Change Readiness</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="change-readiness" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="resistant">Resistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="resource-availability">Resource Availability</Label>
                        <Select defaultValue="limited">
                          <SelectTrigger id="resource-availability" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="abundant">Abundant</SelectItem>
                            <SelectItem value="sufficient">Sufficient</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Value & Impact Assessment</CardTitle>
                <CardDescription>Estimate potential ROI and impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Potential Benefits</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="cost-savings">Estimated Cost Savings</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="cost-savings">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High (&gt;$500K annually)</SelectItem>
                            <SelectItem value="medium">Medium ($100K-$500K annually)</SelectItem>
                            <SelectItem value="low">Low (&lt;$100K annually)</SelectItem>
                            <SelectItem value="none">None/Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="revenue-impact">Potential Revenue Impact</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="revenue-impact">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High (&gt;10% growth)</SelectItem>
                            <SelectItem value="medium">Medium (5-10% growth)</SelectItem>
                            <SelectItem value="low">Low (&lt;5% growth)</SelectItem>
                            <SelectItem value="none">None/Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="efficiency-gains">Efficiency Gains</Label>
                        <Select defaultValue="high">
                          <SelectTrigger id="efficiency-gains">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High (&gt;30% improvement)</SelectItem>
                            <SelectItem value="medium">Medium (10-30% improvement)</SelectItem>
                            <SelectItem value="low">Low (&lt;10% improvement)</SelectItem>
                            <SelectItem value="none">None/Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customer-experience">Customer Experience Impact</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger id="customer-experience">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transformative">Transformative</SelectItem>
                            <SelectItem value="significant">Significant</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Success Metrics & KPIs</h3>
                    <Textarea 
                      placeholder="Define clear, measurable success metrics for this use case" 
                      className="min-h-[100px]"
                      defaultValue="- Reduce customer service response time by 35%
- Increase first-contact resolution rate from 65% to 80%
- Decrease operational costs by $250K annually
- Improve CSAT scores by 15 points"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Strategic Alignment</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="business-alignment">Business Strategy Alignment</Label>
                        <Select defaultValue="high">
                          <SelectTrigger id="business-alignment" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="capability-alignment">Service Capability Alignment</Label>
                        <Select defaultValue="high">
                          <SelectTrigger id="capability-alignment" className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Card className="bg-muted border-none">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Overall Assessment</h3>
                          <Badge className="text-sm">Recommended</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Feasibility</p>
                            <p className="text-2xl font-bold text-amber-500">Medium</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Value</p>
                            <p className="text-2xl font-bold text-green-500">High</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Alignment</p>
                            <p className="text-2xl font-bold text-green-500">High</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setActiveTab("ideation")}>
              Back to Ideation
            </Button>
            <Button onClick={() => setActiveTab("definition")}>
              Continue to Definition
            </Button>
          </div>
        </TabsContent>
        
        {/* Definition & Scoping Tab */}
        <TabsContent value="definition">
          <Card>
            <CardHeader>
              <CardTitle>Use Case Definition</CardTitle>
              <CardDescription>Document the formal use case specification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="use-case-title">Use Case Title</Label>
                      <Input 
                        id="use-case-title" 
                        defaultValue="Customer Service Chatbot with Intelligent Routing" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="problem-statement">Problem Statement</Label>
                      <Textarea 
                        id="problem-statement" 
                        className="min-h-[100px]"
                        defaultValue="Customer service representatives spend too much time handling routine inquiries that could be automated, resulting in higher operational costs and slower response times for complex issues that require human intervention."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="proposed-solution">Proposed AI Solution</Label>
                      <Textarea 
                        id="proposed-solution" 
                        className="min-h-[100px]"
                        defaultValue="Implement an AI-powered conversational chatbot that can handle routine customer inquiries automatically while intelligently routing complex issues to the appropriate human agent based on context, sentiment, and expertise matching."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="success-metrics">Key Objectives & Success Metrics</Label>
                      <Textarea 
                        id="success-metrics" 
                        className="min-h-[100px]"
                        defaultValue="1. Automate at least 65% of routine customer inquiries
2. Reduce average response time by 35%
3. Improve first-contact resolution rate from 65% to 80%
4. Decrease operational costs by $250K annually
5. Maintain or improve CSAT scores"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-inputs">Required Data Inputs</Label>
                      <Textarea 
                        id="data-inputs" 
                        className="min-h-[100px]"
                        defaultValue="1. Historical customer service conversations (text and categorization)
2. Knowledge base articles and FAQs
3. Product and service information database
4. Customer account information (with appropriate privacy controls)
5. Agent skills matrix and availability data"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expected-outputs">Expected Outputs & Actions</Label>
                      <Textarea 
                        id="expected-outputs" 
                        className="min-h-[100px]"
                        defaultValue="1. Automated responses to routine inquiries
2. Intelligent routing of complex issues to appropriate human agents
3. Real-time sentiment analysis to flag urgent issues
4. Analytics dashboard showing performance metrics
5. Integration with existing CRM and ticketing systems"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stakeholders">Key Stakeholders</Label>
                      <Textarea 
                        id="stakeholders" 
                        className="min-h-[80px]"
                        defaultValue="Business: Customer Service Director, Operations Manager, Digital Transformation Lead
Technical: CIO, IT Infrastructure Manager, Data Security Officer"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="risks">Potential Risks & Dependencies</Label>
                      <Textarea 
                        id="risks" 
                        className="min-h-[80px]"
                        defaultValue="1. Data privacy and compliance requirements
2. Integration with legacy systems
3. Agent adoption and change management
4. Maintaining consistent customer experience
5. Dependency on high-quality training data"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Implementation Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Phase 1</div>
                        <div>
                          <p className="font-medium">Discovery & Planning (4 weeks)</p>
                          <p className="text-sm text-muted-foreground">Requirements gathering, data assessment, architecture design</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Phase 2</div>
                        <div>
                          <p className="font-medium">Development (8 weeks)</p>
                          <p className="text-sm text-muted-foreground">Model training, conversational flow design, integration development</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Phase 3</div>
                        <div>
                          <p className="font-medium">Testing & Validation (4 weeks)</p>
                          <p className="text-sm text-muted-foreground">QA testing, agent training, pilot deployment</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Phase 4</div>
                        <div>
                          <p className="font-medium">Deployment & Optimization (Ongoing)</p>
                          <p className="text-sm text-muted-foreground">Full rollout, performance monitoring, continuous improvement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Resource Requirements</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Team</div>
                        <div>
                          <p className="text-sm text-muted-foreground">Project Manager, ML Engineers (2), Conversation Designers, Integration Developers (2)</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Technology</div>
                        <div>
                          <p className="text-sm text-muted-foreground">NLP Platform, Conversational AI Framework, Integration Middleware, Analytics Tools</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 flex-shrink-0 font-medium">Budget</div>
                        <div>
                          <p className="text-sm text-muted-foreground">Implementation: $350K-$500K<br />Ongoing: $75K-$100K annually</p>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-4 mt-6">Next Steps</h3>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                      <li>Secure executive sponsorship and budget approval</li>
                      <li>Conduct detailed data discovery workshop</li>
                      <li>Develop comprehensive project plan</li>
                      <li>Assemble cross-functional implementation team</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab("qualification")}>
                    Back to Qualification
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline">
                      Export Definition
                    </Button>
                    <Button>
                      Save & Submit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}