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
import { ActionPlan } from '../lib/api';

interface ActionPlanSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionPlans: ActionPlan[];
  isLoading: boolean;
  onSelect: (actionPlan: ActionPlan) => void;
}

export default function ActionPlanSelectionDialog({
  open,
  onOpenChange,
  actionPlans,
  isLoading,
  onSelect
}: ActionPlanSelectionDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const handleSelect = () => {
    const selectedPlan = actionPlans.find(plan => plan.id === selectedPlanId);
    if (selectedPlan) {
      onSelect(selectedPlan);
      onOpenChange(false);
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Load Saved Action Plan</DialogTitle>
          <DialogDescription>
            Select an existing action plan to continue working on it.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">
              Loading action plans...
            </div>
          ) : actionPlans.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No saved action plans found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionPlans.map((plan) => (
                  <TableRow 
                    key={plan.id} 
                    className={selectedPlanId === plan.id ? "bg-muted/50" : ""}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <TableCell>
                      <input 
                        type="radio" 
                        checked={selectedPlanId === plan.id}
                        onChange={() => setSelectedPlanId(plan.id)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{plan.title}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        plan.status === 'draft' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : plan.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(plan.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSelect}
            disabled={selectedPlanId === null || isLoading}
          >
            Load Selected Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}