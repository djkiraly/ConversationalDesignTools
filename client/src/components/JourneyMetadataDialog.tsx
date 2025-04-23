import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Users } from "lucide-react";
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
import { Customer } from "../lib/api";

interface JourneyMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  customers: Customer[];
}

export default function JourneyMetadataDialog({
  open,
  onOpenChange,
  metadata,
  onUpdateMetadata,
  customers = []
}: JourneyMetadataDialogProps) {
  const [customerName, setCustomerName] = useState(metadata.customerName || "");
  const [workflowIntent, setWorkflowIntent] = useState(metadata.workflowIntent || "");
  const [notes, setNotes] = useState(metadata.notes || "");
  
  // Update form values when metadata or open state changes
  useEffect(() => {
    if (open) {
      console.log("Metadata changed in dialog:", metadata);
      setCustomerName(metadata.customerName || "");
      setWorkflowIntent(metadata.workflowIntent || "");
      setNotes(metadata.notes || "");
    }
  }, [metadata, open]);

  const handleSubmit = () => {
    onUpdateMetadata({
      customerName,
      workflowIntent,
      notes,
      summary: metadata.summary, // Keep existing summary
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <div className="flex-grow">
                <Select 
                  value={customerName || ""}
                  onValueChange={setCustomerName}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.name}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
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