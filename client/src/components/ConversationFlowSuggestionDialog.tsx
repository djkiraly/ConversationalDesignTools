import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wand2, AlertCircle, Check, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ConversationFlowSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  currentFlow: string;
  agentPersona: string;
  onApplySuggestion: (suggestion: string) => void;
}

interface OpenAIResponse {
  success: boolean;
  suggestion?: string;
  error?: string;
}

export default function ConversationFlowSuggestionDialog({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  currentFlow,
  agentPersona,
  onApplySuggestion 
}: ConversationFlowSuggestionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [currentDiff, setCurrentDiff] = useState<"side-by-side" | "unified">("side-by-side");

  const generateSuggestion = async () => {
    // Reset states
    setIsLoading(true);
    setError(null);
    
    // Keep the suggestion if regenerating (for better UX during loading)
    if (!suggestion) {
      setSuggestion(null);
    }

    try {
      // Get the latest edited flow from the Editor component
      const response = await apiRequest(
        "POST", 
        "/api/openai/conversation-flow", 
        {
          title,
          description,
          currentFlow,
          agentPersona
        }
      ) as OpenAIResponse;

      if (response.success && response.suggestion) {
        setSuggestion(response.suggestion);
      } else {
        setError(response.error || "Failed to generate suggestion. Please try again.");
      }
    } catch (err) {
      console.error("Error generating conversation flow suggestion:", err);
      setError("An error occurred while generating a suggestion. Please check your OpenAI API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApplySuggestion(suggestion);
      onClose();
      toast({
        title: "Conversation Flow Updated",
        description: "The AI suggestion has been applied to the conversation flow.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Improve Conversation Flow</DialogTitle>
          <DialogDescription>
            AI will suggest improvements to your conversation flow based on best practices in conversational AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!suggestion && !isLoading && (
            <div className="rounded-md border p-6 flex flex-col items-center text-center">
              <Wand2 className="h-8 w-8 text-neutral-dark/70 mb-2" />
              <h3 className="text-lg font-medium mb-2">
                Get AI Suggestions for Conversation Flow
              </h3>
              <p className="text-sm text-neutral-dark/70 mb-4 max-w-md">
                AI will analyze your current conversation flow and suggest improvements based on
                best practices in conversational design, natural dialogue patterns, and effective customer interactions.
              </p>
              <Button 
                onClick={generateSuggestion} 
                className="mt-2"
                disabled={isLoading}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Suggestion
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="rounded-md border p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-neutral-dark/80">
                Generating flow suggestions...
              </p>
              <p className="text-xs text-neutral-dark/60 mt-2">
                This might take a moment as we analyze your conversation flow and craft improvements.
              </p>
            </div>
          )}

          {suggestion && !isLoading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h3 className="font-medium text-green-800 flex items-center mr-3">
                    <Check className="h-4 w-4 mr-2" />
                    Suggestion Generated
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={generateSuggestion}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={currentDiff === 'side-by-side' ? 'bg-blue-50' : ''}
                    onClick={() => setCurrentDiff('side-by-side')}
                  >
                    Side by Side
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={currentDiff === 'unified' ? 'bg-blue-50' : ''}
                    onClick={() => setCurrentDiff('unified')}
                  >
                    Unified View
                  </Button>
                </div>
              </div>

              {currentDiff === 'side-by-side' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-2 text-neutral-dark/70">Current Flow</div>
                    <div className="bg-neutral-light/50 p-3 rounded overflow-auto max-h-[400px]">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{currentFlow}</pre>
                    </div>
                  </div>
                  <div className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-2 text-green-700">Suggested Flow</div>
                    <div className="bg-green-50 p-3 rounded overflow-auto max-h-[400px]">
                      <pre className="text-xs whitespace-pre-wrap font-mono">{suggestion}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-2 text-green-700">Suggested Flow</div>
                  <div className="bg-green-50 p-3 rounded overflow-auto max-h-[400px]">
                    <pre className="text-xs whitespace-pre-wrap font-mono">{suggestion}</pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  Apply Suggestions
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}