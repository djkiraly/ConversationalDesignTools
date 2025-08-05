import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Edit, Trash2 } from "lucide-react";

interface EditNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: {
    id: string;
    stepType: string;
    title: string;
    description: string;
    outputPaths?: number; // For MultiPathNode
  };
  onUpdate: (id: string, data: {
    stepType: string;
    title: string;
    description: string;
    outputPaths?: number; // For MultiPathNode
  }) => void;
  onDelete: (id: string) => void;
}

export default function EditNodeDialog({ 
  open, 
  onOpenChange, 
  nodeData, 
  onUpdate, 
  onDelete 
}: EditNodeDialogProps) {
  const [stepType, setStepType] = useState(nodeData.stepType);
  const [title, setTitle] = useState(nodeData.title);
  const [description, setDescription] = useState(nodeData.description);
  const [outputPaths, setOutputPaths] = useState(nodeData.outputPaths || 3);
  const [isMultiPath, setIsMultiPath] = useState(nodeData.stepType === 'Decision Split');

  // Update form state when node data changes
  useEffect(() => {
    setStepType(nodeData.stepType);
    setTitle(nodeData.title);
    setDescription(nodeData.description);
    setOutputPaths(nodeData.outputPaths || 3);
    setIsMultiPath(nodeData.stepType === 'Decision Split');
  }, [nodeData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim() === "") {
      return; // Simple validation - title cannot be empty
    }
    
    const updateData: any = {
      stepType,
      title,
      description
    };
    
    // Add outputPaths only if this is a multipath node
    if (isMultiPath) {
      updateData.outputPaths = outputPaths;
    }
    
    onUpdate(nodeData.id, updateData);
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the "${nodeData.title}" node?`)) {
      onDelete(nodeData.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Journey Node</DialogTitle>
          <DialogDescription>
            Make changes to the node's properties.
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
            
            {/* Only show output paths option for Decision Split nodes */}
            {isMultiPath && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="outputPaths" className="text-right">
                  Output Paths
                </Label>
                <div className="col-span-3">
                  <Select
                    value={outputPaths.toString()}
                    onValueChange={(value) => setOutputPaths(parseInt(value))}
                  >
                    <SelectTrigger id="outputPaths">
                      <SelectValue placeholder="Number of paths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 paths</SelectItem>
                      <SelectItem value="3">3 paths</SelectItem>
                      <SelectItem value="4">4 paths</SelectItem>
                      <SelectItem value="5">5 paths</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Node
            </Button>
            <Button type="submit">Update Node</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}