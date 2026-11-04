'use client';

import { useState, useTransition } from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { deleteAllTasksFromDataset } from '@/app/actions/datasets';
// TODO: Import your actual server action here

interface Props {
    datasetId: string;
    hasTasks: boolean;
}

export function ClearTasksButton({ datasetId, hasTasks }: Props) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');
    const [isPending, startTransition] = useTransition();

    const CONFIRM_KEY = "clear me";

    const handleClear = () => {
        if (confirmInput.toLowerCase() !== CONFIRM_KEY) return;

        startTransition(async () => {
            try {
                const result = await deleteAllTasksFromDataset(datasetId);

                if (result.success) {
                    toast.success("All tasks cleared successfully");
                    setShowConfirm(false);
                    setConfirmInput('');
                    // Optional: Router refresh if needed
                    // router.refresh();
                } else {
                    toast.error(result.error || "Failed to clear tasks");
                }
            } catch (error) {
                toast.error("Something went wrong");
            }
        });
    };

    return (
        <>
            {/* --- DANGER ZONE CONTAINER --- 
          Using 'destructive' variable guarantees theme matching 
      */}
            <div className="mt-8 rounded-lg border border-destructive/50 bg-background overflow-hidden">
                {/* Header */}
                <div className="bg-destructive/10 px-4 py-3 border-b border-destructive/20 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                </div>

                {/* Content Row */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-medium text-foreground">Clear all tasks</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            This will permanently delete all tasks, votes, and worker history.
                            This action cannot be undone.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={!hasTasks || isPending}
                        className={cn(
                            // Base Layout
                            "whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2",
                            // Focus states
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            // Disabled states
                            "disabled:pointer-events-none disabled:opacity-50",
                            // Colors: Uses 'destructive' text, standard border, and background
                            "border border-destructive/30 bg-background text-destructive hover:bg-destructive/10"
                        )}
                    >
                        Clear Tasks
                    </button>
                </div>
            </div>

            {/* --- CONFIRMATION MODAL --- 
          Built using standard Shadcn-compatible utility classes (bg-background, text-foreground, etc.)
      */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-popover border border-border rounded-lg shadow-lg p-6 relative animate-in zoom-in-95 duration-200">

                        {/* Close Button */}
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>

                        {/* Modal Header */}
                        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">
                                Are you absolutely sure?
                            </h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                This action cannot be undone. This will permanently delete the tasks from our servers.
                            </p>
                        </div>

                        {/* Confirmation Input */}
                        <div className="my-6">
                            <label className="text-sm font-medium leading-none text-foreground">
                                Type <span className="font-bold select-none text-destructive">{CONFIRM_KEY}</span> to confirm.
                            </label>
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                className={cn(
                                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors mt-2 text-foreground",
                                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                )}
                                placeholder="Type here..."
                                autoFocus
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-y-2 sm:gap-y-0">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2",
                                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground"
                                )}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleClear}
                                disabled={confirmInput.toLowerCase() !== CONFIRM_KEY || isPending}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2",
                                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                                )}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "I understand, delete tasks"
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
