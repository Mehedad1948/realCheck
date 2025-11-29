import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
    Plus,
    Upload,
    FileText,
    CheckCircle2,
    MoreVertical,
    Clock,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. Fetch Data (Server Side)
async function getDashboardData() {
    // TODO: Replace with actual session user ID later
    const CLIENT_ID = "cmiis4nn200017yfjmvhkre56";

    const datasets = await prisma.dataset.findMany({
        where: { clientId: CLIENT_ID },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { tasks: true }
            }
        }
    });

    // Calculate Aggregates
    const totalDatasets = datasets.length;
    const totalTasks = datasets.reduce((acc, curr) => acc + curr._count.tasks, 0);

    // Mocking "completed" tasks for now as we haven't built the worker side yet
    const pendingReview = 0;

    return { datasets, totalDatasets, totalTasks, pendingReview };
}

export default async function DashboardPage() {
    const { datasets, totalDatasets, totalTasks, pendingReview } = await getDashboardData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your datasets and track labeling progress.</p>
                </div>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                        <FileText className="h-4 w-4" />
                        Docs
                    </button>
                    <Link
                        href="/dashboard/datasets/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 shadow-sm transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        New Dataset
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Card 1 */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Datasets</p>
                            <h3 className="text-2xl font-bold text-foreground">{totalDatasets}</h3>
                        </div>
                    </div>
                </div>
                {/* Card 2 */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Tasks Uploaded</p>
                            <h3 className="text-2xl font-bold text-foreground">{totalTasks.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                {/* Card 3 */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                            <h3 className="text-2xl font-bold text-foreground">{pendingReview}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datasets Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Active Datasets</h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                    {/* New Data Entry Card (Call to Action) */}
                    <Link
                        href="/dashboard/datasets/create"
                        className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-all hover:border-primary/50 hover:bg-primary/5"
                    >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                            <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Add New Data</h3>
                        <p className="text-center text-sm text-muted-foreground mt-1">
                            Configure a new dataset and upload your CSV/JSON files.
                        </p>
                    </Link>

                    {/* Real Datasets Cards */}
                    {datasets.map((dataset) => (
                        <div key={dataset.id} className="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                            <Link href={`/dashboard/datasets/${dataset.id}`} className="flex items-start justify-between p-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {/* Status Badge */}
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border",
                                            dataset.status === 'ACTIVE'
                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                        )}>
                                            {dataset.status}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border border-border px-1.5 rounded">
                                            {dataset.dataType}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-foreground line-clamp-1" title={dataset.question}>
                                        {dataset.title || dataset.question}
                                    </h3>
                                </div>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </Link>

                            <div className="flex-1 px-5">
                                {/* Progress Bar Placeholder - Since we don't have 'completed' counts yet, we show a placeholder */}
                                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                                    <span>Completion</span>
                                    <span>0%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{ width: `0%` }}
                                    ></div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    {dataset._count.tasks} tasks uploaded
                                </div>
                            </div>

                            <div className="mt-4 border-t border-border bg-muted/30 p-4 rounded-b-xl flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                    Created {new Date(dataset.createdAt).toLocaleDateString()}
                                </span>
                                <Link
                                    href={`/dashboard/datasets/${dataset.id}/upload`}
                                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                                >
                                    Add Data &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
