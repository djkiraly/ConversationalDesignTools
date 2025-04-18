import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Wand2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string>("");
  const [editedSuggestion, setEditedSuggestion] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const getSuggestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!title && !description) {
        throw new Error("Title or description must be provided for context");
      }
      
      const response = await apiRequest('POST', '/api/openai/agent-persona', { 
        title, 
        description,
        currentPersona
      }) as OpenAIResponse;
      
      if (response && response.success && response.suggestion) {
        const personaSuggestion = response.suggestion;
        setSuggestion(personaSuggestion);
        setEditedSuggestion(personaSuggestion);
      } else {
        throw new Error(response.error || 'Failed to get suggestion from API');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting suggestions');
      toast({
        title: "Error",
        description: err.message || 'Failed to get agent persona suggestion',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      getSuggestion();
      setIsEditing(false);
    } else {
      setSuggestion("");
      setEditedSuggestion("");
      setError(null);
    }
  }, [isOpen]);
  
  const applySuggestion = () => {
    if (isEditing) {
      onApplySuggestion(editedSuggestion);
    } else {
      onApplySuggestion(suggestion);
    }
    onClose();
  };
  
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Agent Persona Suggestion</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-neutral-dark">Generating agent persona suggestion using OpenAI...</p>
          </div>
        ) : error ? (
          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-red-800 mb-2">Error getting suggestion</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button onClick={getSuggestion} className="w-full">
              Try Again
            </Button>
          </div>
        ) : suggestion ? (
          <div className="py-4 space-y-6">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Edit Suggestion</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleEditMode}
                    className="flex items-center text-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Done Editing
                  </Button>
                </div>
                <Textarea
                  value={editedSuggestion}
                  onChange={(e) => setEditedSuggestion(e.target.value)}
                  rows={10}
                  className="w-full resize-none font-normal"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Suggested Agent Persona</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleEditMode}
                    className="flex items-center text-xs"
                  >
                    <Wand2 className="h-3.5 w-3.5 mr-1" />
                    Modify Suggestion
                  </Button>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-blue-900 whitespace-pre-line">
                  {suggestion}
                </div>
              </div>
            )}
          </div>
        ) : null}
        
        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {suggestion && (
            <Button 
              onClick={applySuggestion} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Apply {isEditing ? 'Modified' : ''} Suggestion
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}