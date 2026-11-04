'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { updateDatasetDetails } from '@/app/dashboard/datasets/[datasetId]/updateDatasetDetails';

interface EditableFieldProps {
  datasetId: string;
  field: 'title' | 'description' | 'requiredVotes';
  initialValue: string | number;
  isMultiline?: boolean;
  className?: string; // Styles for the text/input
  type?: 'text' | 'number';
}

export function EditableField({ 
  datasetId, 
  field, 
  initialValue, 
  isMultiline = false, 
  className,
  type = 'text'
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    // Don't save if value hasn't changed
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    
    // Convert to number if needed
    const payload = type === 'number' ? Number(value) : value;

    const result = await updateDatasetDetails(datasetId, field, payload);
    
    if (result.success) {
      toast.success("Updated successfully");
      setIsEditing(false);
    } else {
      toast.error("Failed to update");
      // Revert on failure
      setValue(initialValue);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isMultiline) {
      e.preventDefault(); // Prevent newline in single line inputs
      handleSave();
    }
    if (e.key === 'Escape') {
      setValue(initialValue); // Revert
      setIsEditing(false);
    }
  };

  // --- EDIT MODE ---
  if (isEditing) {
    const InputComponent = isMultiline ? 'textarea' : 'input';
    
    return (
      <div className="relative w-full">
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={isMultiline ? 3 : 1}
          className={cn(
            "w-full bg-transparent outline-none transition-all",
            "border-b-2 border-primary rounded-none px-0 py-0", // The Windows-style bottom border
            "placeholder:text-muted-foreground/50",
            isLoading && "opacity-50 cursor-wait",
            className // Inherit font size/weight from parent
          )}
        />
        {isLoading && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
             <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  }

  // --- VIEW MODE ---
  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={cn(
        "group relative cursor-pointer rounded-md transition-colors hover:bg-muted/30 px-1 -ml-1 border border-transparent hover:border-border/50 flex items-center gap-2 w-fit min-w-[50px]",
        className
      )}
      title="Click to edit"
    >
      <span className="whitespace-pre-wrap break-words">
        {value}
      </span>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}
