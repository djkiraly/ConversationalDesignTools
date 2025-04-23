import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { PlusCircle, Map, ShoppingCart, HelpCircle, Brain, Sparkles, User, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer } from "../lib/api";
import { Separator } from '@/components/ui/separator';

interface NewFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFlow: (flowName: string, templateType: string | null) => void;
  onCreateAIFlow?: (flowName: string, description: string) => void;
  customers: Customer[];
  currentCustomerName: string;
  isGeneratingAI?: boolean;
}

export default function NewFlowDialog({ 
  open, 
  onOpenChange, 
  onCreateFlow, 
  onCreateAIFlow, 
  customers = [],
  currentCustomerName = "",
  isGeneratingAI = false
}: NewFlowDialogProps) {
  const [flowName, setFlowName] = useState("New Customer Journey");
  const [selectedCustomer, setSelectedCustomer] = useState(currentCustomerName || "");
  const [aiTemplateDescription, setAiTemplateDescription] = useState("");
  const [isAiTabActive, setIsAiTabActive] = useState(false);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // When opening, set default values
      setFlowName("New Customer Journey");
      setSelectedCustomer(currentCustomerName || "");
      setAiTemplateDescription("");
      setIsAiTabActive(false);
    }
  }, [open, currentCustomerName]);
  
  const handleCreateFlow = (templateType: string | null) => {
    // Include the customer name when creating the flow
    onCreateFlow(flowName, templateType);
    onOpenChange(false);
  };
  
  const handleCreateAIFlow = () => {
    if (onCreateAIFlow && aiTemplateDescription.trim()) {
      onCreateAIFlow(flowName, aiTemplateDescription);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Customer Journey</DialogTitle>
          <DialogDescription>
            Start from a template or create a blank journey to customize.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Journey name input */}
          <div>
            <Label htmlFor="flow-name">Journey Name</Label>
            <Input 
              id="flow-name" 
              value={flowName} 
              onChange={(e) => setFlowName(e.target.value)} 
              placeholder="Enter a name for your journey" 
              className="mt-1"
            />
          </div>
          
          {/* Customer selection dropdown */}
          <div>
            <Label htmlFor="customer-select">Customer</Label>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            >
              <SelectTrigger id="customer-select" className="mt-1">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.companyName}>
                    {customer.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Template selection tabs */}
          <div className="flex justify-between mb-4 border-b">
            <Button 
              variant={!isAiTabActive ? "default" : "ghost"}
              onClick={() => setIsAiTabActive(false)}
              className="rounded-b-none border-b-0"
            >
              Templates
            </Button>
            <Button 
              variant={isAiTabActive ? "default" : "ghost"}
              onClick={() => setIsAiTabActive(true)}
              className="rounded-b-none border-b-0 gap-1"
            >
              <Brain className="h-4 w-4" />
              AI Generator
            </Button>
          </div>
          
          {/* Template content */}
          {!isAiTabActive ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card 
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md" 
                onClick={() => handleCreateFlow(null)}
              >
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
              
              <Card 
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md" 
                onClick={() => handleCreateFlow('sales')}
              >
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
              
              <Card 
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md" 
                onClick={() => handleCreateFlow('support')}
              >
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
          ) : (
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
                    disabled={!aiTemplateDescription.trim() || isGeneratingAI || !onCreateAIFlow}
                    className="w-full gap-2"
                  >
                    {isGeneratingAI ? (
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
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {/* Show create button only for template view */}
          {!isAiTabActive && (
            <Button onClick={() => handleCreateFlow(null)}>
              Create Journey
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}