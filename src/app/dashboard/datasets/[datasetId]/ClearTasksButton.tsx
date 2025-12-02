'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react'; // Assuming you have lucide-react or use an SVG
import { deleteAllTasksFromDataset } from '@/app/actions/datasets/deleteAllTasksFromDataset';

export default function ClearTasksButton({
    datasetId,
    hasTasks
}: {
    datasetId: string,
    hasTasks: boolean
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClear = async () => {
        // 1. Confirmation Dialog
        const confirmed = window.confirm(
            "Are you sure? This will permanently delete ALL tasks in this dataset. This action cannot be undone."
        );

        if (!confirmed) return;

        setIsLoading(true);

        // 2. Call Server Action
        const result = await deleteAllTasksFromDataset(datasetId);

        if (!result.success) {
            alert(result.error);
        }

        setIsLoading(false);
    };

    return (
        <Button
            variant="destructive"
            disabled={!hasTasks || isLoading}
            onClick={handleClear}
            className="gap-2"
        >
            {isLoading ? 'Clearing...' : (
                <>
                    <Trash2 className="w-4 h-4" /> Clear All Tasks
                </>
            )}
        </Button>
    );
}
