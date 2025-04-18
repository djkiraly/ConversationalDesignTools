import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  agentPersona: string;
  onApplySuggestions: (suggestions: {
    title?: string;
    description?: string;
    agentPersona?: string;
    conversationFlow?: string;
  }) => void;
}

interface Suggestions {
  title: string;
  description: string;
  agentPersona?: string;
  conversationFlow?: string;
}

export default function SuggestionsDialog({ 
  isOpen, 
  onClose, 
  title, 
  description,
  agentPersona,
  onApplySuggestions
}: SuggestionsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const getSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/openai/suggestions', { 
        title, 
        description 
      });
      
      if (response && !response.error) {
        setSuggestions(response);
      } else {
        throw new Error(response.error || 'Failed to get suggestions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting suggestions');
      toast({
        title: "Error",
        description: err.message || 'Failed to get suggestions',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      getSuggestions();
    } else {
      setSuggestions(null);
      setError(null);
    }
  }, [isOpen]);
  
  const applySuggestions = () => {
    if (suggestions) {
      onApplySuggestions(suggestions);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>AI Suggestions</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-neutral-dark">Generating suggestions using OpenAI...</p>
          </div>
        ) : error ? (
          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-red-800 mb-2">Error getting suggestions</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button onClick={getSuggestions} className="w-full">
              Try Again
            </Button>
          </div>
        ) : suggestions ? (
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Title Suggestion</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-blue-900">
                {suggestions.title}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description Suggestion</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-blue-900 whitespace-pre-line">
                {suggestions.description}
              </div>
            </div>
            
            {suggestions.agentPersona && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Agent Persona Suggestion</h3>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-blue-900 whitespace-pre-line">
                  {suggestions.agentPersona}
                </div>
              </div>
            )}
            
            {suggestions.conversationFlow && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Conversation Flow Suggestion</h3>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-blue-900 whitespace-pre-line font-mono text-xs overflow-auto max-h-64">
                  {suggestions.conversationFlow}
                </div>
              </div>
            )}
          </div>
        ) : null}
        
        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {suggestions && (
            <Button 
              onClick={applySuggestions} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Apply Suggestions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}