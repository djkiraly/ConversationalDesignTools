import { useState } from "react";
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
              Customer Name
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="col-span-3"
              placeholder="Enter customer name"
            />
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