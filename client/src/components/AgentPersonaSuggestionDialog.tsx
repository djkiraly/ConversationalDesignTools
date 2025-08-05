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
import { Wand2, AlertCircle, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AgentPersonaSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  currentPersona: string;
  onApplySuggestion: (suggestion: string) => void;
}

interface OpenAIResponse {
  success: boolean;
  suggestion?: string;
  error?: string;
}

export default function AgentPersonaSuggestionDialog({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  currentPersona,
  onApplySuggestion 
}: AgentPersonaSuggestionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const generateSuggestion = async () => {
    // Reset states
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await apiRequest(
        "POST", 
        "/api/openai/agent-persona", 
        {
          title,
          description,
          currentPersona
        }
      ) as OpenAIResponse;

      if (response.success && response.suggestion) {
        setSuggestion(response.suggestion);
      } else {
        setError(response.error || "Failed to generate suggestion. Please try again.");
      }
    } catch (err) {
      console.error("Error generating agent persona suggestion:", err);
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
        title: "Agent Persona Updated",
        description: "The AI suggestion has been applied to the agent persona.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Generate Agent Persona Suggestion</DialogTitle>
          <DialogDescription>
            AI will suggest a persona based on your use case title and description.
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
                Get AI Suggestions for Agent Persona
              </h3>
              <p className="text-sm text-neutral-dark/70 mb-4 max-w-md">
                AI will analyze your use case and suggest an appropriate agent persona 
                that aligns with your conversation scenario.
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
                Generating persona suggestion...
              </p>
              <p className="text-xs text-neutral-dark/60 mt-2">
                This might take a moment as we craft the perfect agent persona for your use case.
              </p>
            </div>
          )}

          {suggestion && !isLoading && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-800 flex items-center mb-2">
                  <Check className="h-4 w-4 mr-2" />
                  Suggestion Generated
                </h3>
                <div className="bg-white p-3 rounded border border-green-100">
                  <p className="text-neutral-dark whitespace-pre-wrap">{suggestion}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  Apply Suggestion
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}