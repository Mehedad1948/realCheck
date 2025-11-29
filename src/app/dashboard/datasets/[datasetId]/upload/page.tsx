'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Papa from 'papaparse'; // CSV parser
import { UploadCloud, FileText, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addTasksToDataset } from '@/app/actions/datasets/addTasksToDataset';

type ParsedRow = Record<string, any>;

export default function DatasetUploadPage() {
    const params = useParams();
    const router = useRouter();
    const datasetId = params.datasetId as string;

    // State
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>('');

    // UI State
    const [isDragOver, setIsDragOver] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- File Handling ---

    const handleFileChange = (uploadedFile: File) => {
        setFile(uploadedFile);
        setError(null);
        setIsParsing(true);
        setParsedData([]);

        if (uploadedFile.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    if (Array.isArray(json)) {
                        // Flatten if necessary or just take the array
                        // Assuming simple array of objects
                        setParsedData(json);
                        if (json.length > 0) {
                            setHeaders(Object.keys(json[0]));
                            setSelectedColumn(Object.keys(json[0])[0]); // Default to first
                        }
                    } else {
                        setError("JSON must be an array of objects.");
                    }
                } catch (err) {
                    setError("Invalid JSON file.");
                } finally {
                    setIsParsing(false);
                }
            };
            reader.readAsText(uploadedFile);
        } else {
            // Assume CSV
            Papa.parse(uploadedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        setParsedData(results.data as ParsedRow[]);
                        setHeaders(results.meta.fields || []);
                        if (results.meta.fields && results.meta.fields.length > 0) {
                            setSelectedColumn(results.meta.fields[0]);
                        }
                    } else {
                        setError("File appears to be empty.");
                    }
                    setIsParsing(false);
                },
                error: (err) => {
                    setError("Error parsing CSV: " + err.message);
                    setIsParsing(false);
                }
            });
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    }, []);

    // --- Submission ---

    const handleUpload = async () => {
        if (!parsedData.length || !selectedColumn) return;

        setIsUploading(true);

        // Extract only the selected column data
        const cleanData = parsedData.map(row => ({
            content: String(row[selectedColumn] || "") // Ensure string
        })).filter(row => row.content.trim() !== "");

        const result = await addTasksToDataset(datasetId, cleanData);

        if (result.success) {
            router.push(`/dashboard/datasets`); // Redirect to list
        } else {
            setError(result.error || "Upload failed");
            setIsUploading(false);
        }
    };

    // --- Render ---

    return (
        <main className="min-h-screen bg-background p-6 text-foreground">
            <div className="mx-auto max-w-4xl space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Upload Data</h1>
                    <p className="mt-2 text-muted-foreground">
                        Import your tasks via CSV or JSON. Select the column that contains the main data (text or image URL).
                    </p>
                </div>

                {/* 1. Dropzone */}
                {!file && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={onDrop}
                        className={cn(
                            "flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                            isDragOver ? "border-primary bg-primary/5" : "border-border bg-card",
                        )}
                    >
                        <div className="flex flex-col items-center text-center p-8">
                            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                                <UploadCloud className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold">Drag & drop your file here</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Supported formats: CSV, JSON</p>

                            <div className="mt-6">
                                <label htmlFor="file-upload" className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                                    Browse Files
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".csv,.json"
                                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive flex gap-2 items-center">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                        <button onClick={() => setFile(null)} className="ml-auto text-sm underline">Try again</button>
                    </div>
                )}

                {/* 2. Configuration & Preview Area */}
                {file && !isParsing && parsedData.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Top Bar: File Info + Column Selector */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{parsedData.length} rows found</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                        Map Content Column:
                                    </label>
                                    <select
                                        value={selectedColumn}
                                        onChange={(e) => setSelectedColumn(e.target.value)}
                                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="border-b border-border bg-muted/50 px-6 py-3">
                                <h3 className="text-sm font-semibold text-foreground">Data Preview (First 5 rows)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/30 text-muted-foreground">
                                        <tr>
                                            {headers.slice(0, 4).map((header) => (
                                                <th key={header} className={cn("px-6 py-3 font-medium", header === selectedColumn && "text-primary bg-primary/5")}>
                                                    {header} {header === selectedColumn && "(Selected)"}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {parsedData.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="bg-card hover:bg-muted/30">
                                                {headers.slice(0, 4).map((header) => (
                                                    <td key={`${i}-${header}`} className="px-6 py-3 max-w-[200px] truncate text-muted-foreground">
                                                        {String(row[header])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setFile(null)}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-all"
                            >
                                {isUploading ? (
                                    <>Uploading...</>
                                ) : (
                                    <>
                                        Upload {parsedData.length} Tasks
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
