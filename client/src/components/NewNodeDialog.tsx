import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus } from "lucide-react";

interface NewNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (nodeData: NodeCreationData) => void;
}

export interface NodeCreationData {
  stepType: string;
  title: string;
  description: string;
}

export default function NewNodeDialog({ 
  open, 
  onOpenChange, 
  onAddNode 
}: NewNodeDialogProps) {
  const [stepType, setStepType] = useState("Awareness");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Reset form when dialog state changes
  useEffect(() => {
    if (open) {
      // When opening, reset to defaults
      setStepType("Awareness");
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim() === "") {
      return; // Simple validation - title cannot be empty
    }
    
    // Create node data object and pass to parent
    const nodeData: NodeCreationData = {
      stepType,
      title,
      description
    };
    
    onAddNode(nodeData);
    
    // Close dialog (form will reset on next open)
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Journey Node</DialogTitle>
          <DialogDescription>
            Create a custom node to add to the customer journey flow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stepType" className="text-right">
                Node Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={stepType}
                  onValueChange={(value) => setStepType(value)}
                >
                  <SelectTrigger id="stepType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry Point">Entry Point</SelectItem>
                    <SelectItem value="Awareness">Awareness</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Consideration">Consideration</SelectItem>
                    <SelectItem value="Evaluation">Evaluation</SelectItem>
                    <SelectItem value="Decision">Decision</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Contact">Contact</SelectItem>
                    <SelectItem value="Identification">Identification</SelectItem>
                    <SelectItem value="Resolution">Resolution</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Node title"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happens at this step"
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Node</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}