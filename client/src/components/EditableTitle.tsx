import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Edit, Save, X } from 'lucide-react';

interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
  className?: string;
}

export default function EditableTitle({ title, onSave, className = '' }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update the edited title when the title prop changes
  useEffect(() => {
    setEditedTitle(title);
  }, [title]);
  
  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for easy replacement
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleStartEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (editedTitle.trim() !== '') {
      onSave(editedTitle);
      setIsEditing(false);
    }
  };
  
  const handleCancel = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          ref={inputRef}
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 font-semibold"
          placeholder="Enter journey name..."
          aria-label="Journey title"
        />
        <Button size="sm" variant="ghost" onClick={handleSave} title="Save">
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} title="Cancel">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className="font-semibold text-xl">{title}</span>
      <Button 
        size="sm" 
        variant="ghost" 
        className="opacity-0 group-hover:opacity-100 transition-opacity" 
        onClick={handleStartEdit}
        title="Edit title"
      >
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
}