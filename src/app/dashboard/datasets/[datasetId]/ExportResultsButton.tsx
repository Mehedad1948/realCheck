'use client';

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Shadcn UI Imports (Assuming standard path, otherwise adjust)
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getDatasetExportData } from '@/app/actions/datasets/export';

interface Props {
    datasetId: string;
}

export function ExportResultsButton({ datasetId }: Props) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'JSON' | 'CSV') => {
        setIsExporting(true);
        try {
            const result = await getDatasetExportData(datasetId);

            if (!result.success || !result.data) {
                toast.error(result.message || "Failed to export data");
                return;
            }

            // Generate filename with date
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${result.filename}_${timestamp}`;

            if (format === 'JSON') {
                downloadJSON(result.data, filename);
            } else {
                downloadCSV(result.data, filename);
            }

            toast.success(`${format} export downloaded successfully`);
        } catch (e) {
            console.error('🎮🎮', e);
            toast.error("An unexpected error occurred during export");
        } finally {
            setIsExporting(false);
        }
    };

    // --- Helpers (Same logic as before) ---
    const downloadJSON = (data: any, filename: string) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        triggerDownload(blob, `${filename}.json`);
    };

    const downloadCSV = (tasks: any[], filename: string) => {
        const headers = [
            'TaskId', 'Status', 'Content', 'ImageURL', 'IsValidation',
            'CorrectAnswer', 'WorkerId', 'WorkerReputation', 'WorkerAnswer', 'IsVoteCorrect', 'VoteTime'
        ];
        console.log('➡️➡️➡️', tasks);

        const rows = tasks.flatMap(task =>
            task.votes.map((vote: any) => [
                task.id,
                task.status,
                `"${(task.content || '').replace(/"/g, '""')}"`, // Safe escape
                task.imageUrls && task.imageUrls.length > 0 ? task.imageUrls[0] : '',
                `"${(vote.selection || '').replace(/"/g, '""')}"`,
            ])
        );

        const csvContent = [
            headers.join(','),
            ...rows.map((r: any[]) => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `${filename}.csv`);
    };

    const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={isExporting}
                    className="gap-2"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export Results'}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Select Format</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleExport('CSV')}
                    className="cursor-pointer gap-2"
                >
                    <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-500" />
                    <span>CSV (Excel)</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleExport('JSON')}
                    className="cursor-pointer gap-2"
                >
                    <FileJson className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                    <span>JSON (Raw)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
