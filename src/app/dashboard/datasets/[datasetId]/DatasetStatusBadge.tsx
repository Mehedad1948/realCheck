'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
// Ensure this path matches your actual server action location
import { toggleDatasetStatus } from '@/app/actions/datasets/updateDatasetStatusAction'; 

interface Props {
  datasetId: string;
  initialStatus: string;
}

export function DatasetStatusBadge({ datasetId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const isEditable = status === 'ACTIVE' || status === 'PAUSED';

  const handleToggle = () => {
    if (!isEditable || isPending) return;

    const newStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    startTransition(async () => {
      // Optimistic update
      setStatus(newStatus); 

      const result = await toggleDatasetStatus(datasetId, newStatus);

      if (!result.success) {
        // Revert on failure
        setStatus(status); 
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    });
  };

  // THEME LOGIC:
  // We use specific colors for Light mode and Dark mode to ensure readability.
  // Dark mode colors use /30 opacity for backgrounds and lighter text shades.
  const getStatusStyles = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ACTIVE':
        return cn(
          "bg-green-100 text-green-700 border-green-200", // Light
          "dark:bg-green-900/30 dark:text-green-400 dark:border-green-800", // Dark
          "hover:bg-green-200 dark:hover:bg-green-900/50" // Hover
        );
      case 'PAUSED':
        return cn(
          "bg-yellow-100 text-yellow-700 border-yellow-200", // Light
          "dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800", // Dark
          "hover:bg-yellow-200 dark:hover:bg-yellow-900/50" // Hover
        );
      case 'COMPLETED':
        return cn(
          "bg-blue-100 text-blue-700 border-blue-200", // Light
          "dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", // Dark
          "cursor-default"
        );
      default:
        return cn(
          "bg-gray-100 text-gray-700 border-gray-200", // Light
          "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700", // Dark
          "cursor-not-allowed"
        );
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!isEditable || isPending}
      className={cn(
        "px-3 py-1 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-200 select-none",
        getStatusStyles(status),
        isPending && "opacity-70 cursor-wait",
        !isEditable && "opacity-80"
      )}
      title={isEditable ? "Click to toggle status" : "Status cannot be changed"}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
      ) : (
        <span className={cn("w-2 h-2 rounded-full mr-2", 
          status === 'ACTIVE' ? "bg-green-500 dark:bg-green-400" : 
          status === 'PAUSED' ? "bg-yellow-500 dark:bg-yellow-400" : 
          status === 'COMPLETED' ? "bg-blue-500 dark:bg-blue-400" : "bg-gray-400"
        )} />
      )}
      {status}
    </button>
  );
}
