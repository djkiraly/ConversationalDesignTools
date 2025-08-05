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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UseCase } from '../lib/api';
import { Loader2, SparklesIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UseCaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCases: UseCase[];
  isLoading: boolean;
  onSelect: (useCase: UseCase) => void;
  onSelectWithAI: (useCase: UseCase) => void;
  isGeneratingAI: boolean;
}

export default function UseCaseImportDialog({
  open,
  onOpenChange,
  useCases,
  isLoading,
  onSelect,
  onSelectWithAI,
  isGeneratingAI
}: UseCaseImportDialogProps) {
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<number | null>(null);

  const handleSelect = () => {
    const selectedUseCase = useCases.find(useCase => useCase.id === selectedUseCaseId);
    if (selectedUseCase) {
      onSelect(selectedUseCase);
      onOpenChange(false);
    }
  };

  const handleSelectWithAI = () => {
    const selectedUseCase = useCases.find(useCase => useCase.id === selectedUseCaseId);
    if (selectedUseCase) {
      onSelectWithAI(selectedUseCase);
      // Dialog will be closed by the parent component after AI generation completes
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import a Use Case</DialogTitle>
          <DialogDescription>
            Select an existing use case to import details into your action plan.
          </DialogDescription>
        </DialogHeader>

        {isGeneratingAI && (
          <Alert className="bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
              <AlertDescription>
                Generating AI recommendations based on your use case. This may take a moment...
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              Loading use cases...
            </div>
          ) : useCases.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No use cases found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {useCases.map((useCase) => (
                  <TableRow 
                    key={useCase.id} 
                    className={selectedUseCaseId === useCase.id ? "bg-muted/50" : ""}
                    onClick={() => setSelectedUseCaseId(useCase.id)}
                  >
                    <TableCell>
                      <input 
                        type="radio" 
                        checked={selectedUseCaseId === useCase.id}
                        onChange={() => setSelectedUseCaseId(useCase.id)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{useCase.title}</span>
                        {useCase.problemStatement && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {useCase.problemStatement}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{useCase.customer || "Not specified"}</TableCell>
                    <TableCell>{formatDate(useCase.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="order-3 sm:order-1"
          >
            Cancel
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <Button 
              variant="default"
              onClick={handleSelect}
              disabled={selectedUseCaseId === null || isLoading || isGeneratingAI}
              className="w-full sm:w-auto"
            >
              Import Selected
            </Button>
            
            <Button 
              variant="secondary"
              onClick={handleSelectWithAI}
              disabled={selectedUseCaseId === null || isLoading || isGeneratingAI}
              className="w-full sm:w-auto"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2 text-yellow-500" />
                  Import with AI Suggestions
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}