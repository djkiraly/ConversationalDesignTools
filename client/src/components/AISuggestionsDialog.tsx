import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActionPlan } from '../lib/api';
import { Lightbulb, Check, X, Loader2 } from 'lucide-react';

interface AISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionPlan: ActionPlan | null;
  isLoading: boolean;
  suggestions: string | null;
  onGenerateSuggestions: () => Promise<void>;
  onApplySuggestions: (suggestions: string) => void;
}

export default function AISuggestionsDialog({
  open,
  onOpenChange,
  actionPlan,
  isLoading,
  suggestions,
  onGenerateSuggestions,
  onApplySuggestions
}: AISuggestionsDialogProps) {
  const [isApplying, setIsApplying] = useState(false);
  
  const handleApplySuggestions = () => {
    if (!suggestions) return;
    
    setIsApplying(true);
    try {
      onApplySuggestions(suggestions);
      onOpenChange(false);
    } catch (error) {
      console.error("Error applying suggestions:", error);
    } finally {
      setIsApplying(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Suggestions for Your Action Plan
          </DialogTitle>
          <DialogDescription>
            Get AI-powered recommendations to improve your action plan based on industry best practices.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Analyzing your action plan and generating suggestions...
              </p>
            </div>
          ) : !suggestions ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Lightbulb className="h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-center">
                Click "Generate Suggestions" to receive AI recommendations based on your action plan details.
              </p>
              <Button 
                onClick={onGenerateSuggestions}
                className="mt-4"
              >
                Generate Suggestions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Based on Your Action Plan</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {actionPlan?.title} - {actionPlan?.industry || 'Unknown industry'}
                </p>
                <p className="text-sm">
                  The AI has analyzed your primary channel ({actionPlan?.primaryChannel || 'unknown'}), 
                  interaction volume ({actionPlan?.interactionVolume || 'unknown'}), 
                  and your goals to provide tailored suggestions.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">AI Recommendations</h3>
                <div className="bg-primary/5 p-4 rounded-md whitespace-pre-wrap text-sm">
                  {suggestions}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          {suggestions && (
            <Button
              onClick={handleApplySuggestions}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply Suggestions
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}