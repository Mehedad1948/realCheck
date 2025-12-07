import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';
import { ExportResultsButton } from '@/app/dashboard/datasets/[datasetId]/ExportResultsButton';
import { DatasetStatusBadge } from '@/app/dashboard/datasets/[datasetId]/DatasetStatusBadge';
import { FundingStatusCard } from '@/app/dashboard/datasets/[datasetId]/FundingStatusCard';
import { ClearTasksButton } from '@/app/dashboard/datasets/[datasetId]/ClearTasksButton';
// IMPORT THE NEW COMPONENT

// Helper to format dates
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
    }).format(date);
};

export default async function DatasetDetailsPage({ params }: { params: Promise<{ datasetId: string }> }) {
    const { datasetId } = await params;

    // 1. Fetch Dataset + Owner Balance
    const dataset = await prisma.dataset.findUnique({
        where: { id: datasetId },
        include: {
            owner: {
                select: { balance: true },
            },
            tasks: {
                take: 5,
                orderBy: { createdAt: 'asc' },
            },
            _count: {
                select: { tasks: true },
            },
        },
    });

    if (!dataset) {
        return notFound();
    }

    // 2. Calculate Stats
    const totalTasks = dataset._count.tasks;
    const hasTasks = totalTasks > 0;

    const completedTasksCount = await prisma.task.count({
        where: {
            datasetId: dataset.id,
            status: 'COMPLETED'
        }
    });

    const progress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    // --- FINANCIAL CALCULATION ---
    const remainingTasks = totalTasks - completedTasksCount;
    // Fallback: If reward is 0 or null, assume 0.00
    const rewardPerTask = dataset.reward || 0;
    const estimatedCostToFinish = remainingTasks * dataset.requiredVotes * rewardPerTask;
    const userBalance = dataset.owner.balance || 0;

    // Logic: Is balance strictly less than needed AND are there tasks remaining?
    const isInsufficient = userBalance < estimatedCostToFinish && remainingTasks > 0;

    return (
        <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-300">

            {/* Breadcrumbs and Header remain the same... */}
            <div className="mb-6">
                <Link
                    href="/dashboard/datasets"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors w-fit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to All Datasets
                </Link>
            </div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{dataset.title}</h1>
                    <p className="text-muted-foreground max-w-2xl">{dataset.description}</p>
                </div>

                <div className="flex gap-3 items-center">
                    <ExportResultsButton datasetId={datasetId} />
                    {hasTasks && (
                        <Link
                            href={`/dashboard/datasets/${datasetId}/upload`}
                            className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-muted rounded-md transition-colors"
                        >
                            Add More Data
                        </Link>
                    )}
                    <DatasetStatusBadge datasetId={dataset.id} initialStatus={dataset.status} />
                </div>
            </header>

            {/* --- Stats Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Tasks" value={totalTasks.toString()} icon="📦" />

                {/* --- DYNAMIC INTERACTIVE CARD --- */}
                <FundingStatusCard
                    balance={userBalance}
                    estimatedCost={estimatedCostToFinish}
                    isInsufficient={isInsufficient}
                />

                <StatCard label="Required Consensus" value={`${dataset.requiredVotes} votes`} icon="🤝" />
                <StatCard label="Created On" value={formatDate(dataset.createdAt)} icon="📅" />
            </div>

            {/* Rest of the page (Table, ClearButton, etc) remains exactly the same... */}
            {!hasTasks ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card/50 text-center">
                    {/* Empty State Content */}
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Dataset is Empty</h3>
                    <Link
                        href={`/dashboard/datasets/${datasetId}/upload`}
                        className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg mt-4"
                    >
                        Upload Data Now →
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Progress Bar and Table logic... (keep existing code) */}

                    {/* ... (Existing Table Code) ... */}

                    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                        {/* ... table content ... */}
                        <div className="p-4 bg-muted/30 text-center border-t border-border">
                            <p className="text-xs text-muted-foreground">Showing first 5 tasks.</p>
                        </div>
                    </div>

                    <div>
                        <ClearTasksButton datasetId={dataset.id} hasTasks={hasTasks} />
                    </div>
                </div>
            )}

        </div>
    );
}

// Keep the simple StatCard for the non-interactive ones
function StatCard({ label, value, icon }: { label: string, value: string | number, icon: string }) {
    return (
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
                <p className="text-lg font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}
