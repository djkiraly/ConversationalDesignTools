import { useState } from 'react';
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
import { PlusCircle, Map, ShoppingCart, HelpCircle } from "lucide-react";

interface NewFlowDialogProps {
  onCreateFlow: (flowName: string, templateType: string | null) => void;
}

export default function NewFlowDialog({ onCreateFlow }: NewFlowDialogProps) {
  const [flowName, setFlowName] = useState("New Customer Journey");
  const [isOpen, setIsOpen] = useState(false);
  
  const handleCreateFlow = (templateType: string | null) => {
    onCreateFlow(flowName, templateType);
    setIsOpen(false);
    // Reset to default
    setFlowName("New Customer Journey");
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