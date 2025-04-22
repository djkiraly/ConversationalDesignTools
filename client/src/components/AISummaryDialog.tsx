import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2, Brain } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface AISummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSummary: string | null;
  onSaveSummary: (summary: string) => void;
  onGenerateSummary: () => Promise<string>;
}

export default function AISummaryDialog({
  open,
  onOpenChange,
  currentSummary,
  onSaveSummary,
  onGenerateSummary,
}: AISummaryDialogProps) {
  const [summary, setSummary] = useState(currentSummary || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Function to handle generating summary via AI
  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);
      setError("");
      const newSummary = await onGenerateSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error("Error generating summary:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Failed to generate summary. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    onSaveSummary(summary);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI-Generated Journey Summary</DialogTitle>
          <DialogDescription>
            Generate an AI-powered summary of your customer journey or edit the existing one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Journey Summary</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                onClick={handleGenerateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Generate New Summary
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="AI-generated summary of the customer journey will appear here. You can also edit it manually."
              rows={8}
              className="resize-none"
            />
            
            {!summary && !error && !isGenerating && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Click "Generate New Summary" to create an AI-powered summary of this journey based on its nodes and metadata.
                    The summary will be generated using OpenAI's model and can be edited before saving.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}