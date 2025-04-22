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
import { AlertCircle, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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
  onGenerateSummary?: () => Promise<string>;
}

export default function JourneyMetadataDialog({
  metadata,
  onUpdateMetadata,
  onGenerateSummary,
}: JourneyMetadataDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState(metadata.customerName || "");
  const [workflowIntent, setWorkflowIntent] = useState(metadata.workflowIntent || "");
  const [notes, setNotes] = useState(metadata.notes || "");
  const [summary, setSummary] = useState(metadata.summary || "");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const handleSubmit = () => {
    onUpdateMetadata({
      customerName,
      workflowIntent,
      notes,
      summary, // Include summary in the update
    });
    setOpen(false);
  };
  
  // Function to handle generating summary via AI
  const handleGenerateSummary = async () => {
    if (!onGenerateSummary) return;
    
    try {
      setIsGeneratingSummary(true);
      setSummaryError("");
      const newSummary = await onGenerateSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummaryError(
        error instanceof Error 
          ? error.message 
          : "Failed to generate summary. Please try again."
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleOpen = (openState: boolean) => {
    if (openState) {
      // Reset form with current metadata when opening
      setCustomerName(metadata.customerName || "");
      setWorkflowIntent(metadata.workflowIntent || "");
      setNotes(metadata.notes || "");
      setSummary(metadata.summary || "");
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
          
          <Separator className="my-2" />
          
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="summary" className="text-right pt-2">
              Journey Summary
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex justify-between items-start">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1 mb-2"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary || !onGenerateSummary}
                >
                  {isGeneratingSummary ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate AI Summary
                    </>
                  )}
                </Button>
              </div>
              
              {summaryError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{summaryError}</AlertDescription>
                </Alert>
              )}
              
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="AI-generated summary of the customer journey"
                rows={4}
              />
              
              {!summary && !summaryError && (
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Generate AI Summary" to create an AI-powered summary of this journey based on its nodes and metadata.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}