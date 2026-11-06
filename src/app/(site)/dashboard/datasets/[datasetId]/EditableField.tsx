'use client';

import { Loader2, Pencil } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateDatasetAction } from '@/server/actions/datasets';

type Props = {
  datasetId: string;
  field: 'title' | 'description' | 'requiredVotes' | 'maxVotes';
  initialValue: string | number;
  isMultiline?: boolean;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'number';
};

export function EditableField({ datasetId, field, initialValue, isMultiline = false, className, placeholder, type = 'text' }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(initialValue));
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const cancel = () => {
    setValue(String(initialValue));
    setIsEditing(false);
  };

  const save = () => {
    if (value === String(initialValue)) return setIsEditing(false);
    const change =
      field === 'requiredVotes' || field === 'maxVotes'
        ? ({ field, value: Number(value) } as const)
        : ({ field, value } as const);

    startTransition(async () => {
      const result = await updateDatasetAction({ datasetId, change });
      if (result.ok) {
        toast.success('Saved');
        setIsEditing(false);
      } else {
        toast.error(result.error);
        cancel();
      }
    });
  };

  if (isEditing) {
    const Input = isMultiline ? 'textarea' : 'input';
    return (
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type={isMultiline ? undefined : type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isMultiline) {
              e.preventDefault();
              save();
            }
            if (e.key === 'Escape') cancel();
          }}
          disabled={isPending}
          rows={isMultiline ? 3 : undefined}
          className={cn(
            'w-full rounded-none border-b-2 border-primary bg-transparent px-0 outline-none',
            isPending && 'cursor-wait opacity-50',
            className,
          )}
        />
        {isPending && <Loader2 className="absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'group -ml-1 flex w-fit min-w-[50px] items-center gap-2 rounded-md border border-transparent px-1 text-left transition-colors hover:border-border/50 hover:bg-muted/30',
        className,
      )}
      title="Click to edit"
    >
      <span className={cn('break-words whitespace-pre-wrap', !value && 'text-muted-foreground italic')}>
        {value || placeholder}
      </span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
