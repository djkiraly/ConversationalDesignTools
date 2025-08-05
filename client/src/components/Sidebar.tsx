import { useState } from "react";
import { UseCase } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { MoreVertical, PlusCircle, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  useCases: UseCase[];
  activeUseCaseId?: number;
  isLoading: boolean;
  onNewUseCase: () => void;
  onSelectUseCase: (id: number) => void;
  onDeleteUseCase: (id: number) => void;
  isMobile: boolean;
  isVisible: boolean;
  onClose: () => void;
}

export default function Sidebar({
  useCases,
  activeUseCaseId,
  isLoading,
  onNewUseCase,
  onSelectUseCase,
  onDeleteUseCase,
  isMobile,
  isVisible,
  onClose
}: SidebarProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation) {
      onDeleteUseCase(deleteConfirmation);
      setDeleteConfirmation(null);
    }
  };

  const sidebarClasses = `
    w-64 bg-white border-r border-neutral-medium flex flex-col h-full shadow-sm
    ${isMobile ? 'fixed z-20 transition-transform duration-300 top-0 left-0 bottom-0' : ''}
    ${isMobile && !isVisible ? '-translate-x-full' : ''}
  `;

  return (
    <>
      <aside className={sidebarClasses}>
        <div className="p-4 border-b border-neutral-medium">
          <h1 className="text-xl font-semibold text-primary flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Happy Path Designer
          </h1>
        </div>
        
        <div className="p-4 border-b border-neutral-medium">
          <Button 
            className="w-full bg-primary hover:bg-primary-light text-white flex items-center justify-center" 
            onClick={onNewUseCase}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> New Use Case
          </Button>
        </div>
        
        <div className="p-4 pb-0">
          <div className="flex items-center">
            <h2 className="text-sm font-medium uppercase text-neutral-dark/70">My Use Cases</h2>
            <Badge variant="outline" className="ml-auto">
              {isLoading ? "..." : useCases.length}
            </Badge>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="animate-pulse">Loading use cases...</div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-2">
            {useCases.length === 0 ? (
              <div className="p-4 text-center text-neutral-dark/60">
                <div className="flex justify-center mb-2">
                  <AlertCircle className="h-10 w-10 text-neutral-dark/40" />
                </div>
                <p>No use cases yet</p>
                <p className="text-sm mt-1">Click "New Use Case" to get started</p>
              </div>
            ) : (
              useCases.map((useCase) => (
                <div
                  key={useCase.id}
                  className={`
                    p-3 mb-2 rounded-md cursor-pointer transition border
                    ${activeUseCaseId === useCase.id 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'hover:bg-neutral-light border-transparent hover:border-neutral-medium'}
                  `}
                  onClick={() => {
                    onSelectUseCase(useCase.id);
                    if (isMobile) onClose();
                  }}
                >
                  <div className="flex items-center">
                    <h3 className={`font-medium ${activeUseCaseId === useCase.id ? 'text-primary' : 'text-neutral-dark'}`}>
                      {useCase.title}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 ml-auto">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => handleDeleteClick(useCase.id, e)}>
                          <span className="text-red-500">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-xs text-neutral-dark/60 mt-1">
                    Last edited: {formatDistanceToNow(new Date(useCase.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {isMobile && (
          <div className="p-4 border-t border-neutral-medium">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={onClose}
            >
              Close Menu
            </Button>
          </div>
        )}
      </aside>

      {isMobile && isVisible && (
        <div 
          className="fixed inset-0 bg-black/20 z-10"
          onClick={onClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation !== null} onOpenChange={() => setDeleteConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this use case? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
