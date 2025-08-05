import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";


interface JourneyMetadataDialogProps {
  metadata: {
    customerName: string;
    workflowIntent: string;
    notes: string;
    summary?: string;
  };
  onUpdateMetadata: (metadata: {
    customerName: string;
    workflowIntent: string;
    notes: string;
    summary?: string;
  }) => void;
}

export default function JourneyMetadataDialog({
  metadata,
  onUpdateMetadata,
}: JourneyMetadataDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState(metadata.customerName || "");
  const [workflowIntent, setWorkflowIntent] = useState(metadata.workflowIntent || "");
  const [notes, setNotes] = useState(metadata.notes || "");
  
  // Fetch customers for the dropdown
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });
  
  // Update form values when metadata changes (e.g., when selecting a different journey)
  useEffect(() => {
    console.log("Metadata changed in dialog:", metadata);
    setCustomerName(metadata.customerName || "");
    setWorkflowIntent(metadata.workflowIntent || "");
    setNotes(metadata.notes || "");
  }, [metadata]);


  const handleSubmit = () => {
    onUpdateMetadata({
      customerName,
      workflowIntent,
      notes,
      summary: metadata.summary, // Keep existing summary
    });
    setOpen(false);
  };
  


  const handleOpen = (openState: boolean) => {
    if (openState) {
      // Reset form with current metadata when opening
      setCustomerName(metadata.customerName || "");
      setWorkflowIntent(metadata.workflowIntent || "");
      setNotes(metadata.notes || "");
    }
    setOpen(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Pencil className="h-4 w-4" />
          Edit Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Journey Metadata</DialogTitle>
          <DialogDescription>
            Add metadata to help organize and identify this customer journey.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerName" className="text-right">
              Customer
            </Label>
            <div className="col-span-3">
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <Select 
                    disabled={isLoadingCustomers} 
                    value={customerName || ""}
                    onValueChange={(value) => {
                      console.log("Customer selected:", value);
                      setCustomerName(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.companyName}>
                          {customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isLoadingCustomers && (
                  <span className="text-xs text-neutral-dark/60 flex items-center ml-2">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-dark/60 mt-1">
                Select a customer for this journey
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="workflowIntent" className="text-right">
              Workflow Intent
            </Label>
            <Input
              id="workflowIntent"
              value={workflowIntent}
              onChange={(e) => setWorkflowIntent(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Lead Generation, Support Automation"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Additional notes or context about this journey"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}