import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react'; // Added import
import { DatasetStatusBadge } from './DatasetStatusBadge';
import { ExportResultsButton } from './ExportResultsButton';
import { ClearTasksButton } from './ClearTasksButton';
// NEW IMPORT
import { EditableField } from '@/components/ui/EditableField'; 

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
};

export default async function DatasetDetailsPage({ params }: { params: Promise<{ datasetId: string }> }) {
  const { datasetId } = await params;

  // 1. Fetch Dataset + Owner Balance + Tasks Preview
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    include: {
      owner: { select: { balance: true } },
      tasks: { take: 5, orderBy: { createdAt: 'asc' } },
      _count: { select: { tasks: true } },
    },
  });

  if (!dataset) return notFound();

  // 2. Stats Logic
  const totalTasks = dataset._count.tasks;
  const hasTasks = totalTasks > 0;
  const completedTasksCount = await prisma.task.count({
    where: { datasetId: dataset.id, status: 'COMPLETED' }
  });
  const progress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Financials
  const remainingTasks = totalTasks - completedTasksCount;
  const estimatedCostToFinish = remainingTasks * dataset.requiredVotes * (dataset.reward || 0);
  const userBalance = dataset.owner.balance || 0;
  const isInsufficient = userBalance < estimatedCostToFinish && remainingTasks > 0;

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-300">

      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/dashboard/datasets"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to All Datasets
        </Link>
      </div>

      {/* --- Header Section (Editable) --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
        <div className="w-full max-w-2xl">
            {/* EDITABLE TITLE */}
            <div className="mb-2">
                <EditableField 
                    datasetId={dataset.id}
                    field="title"
                    initialValue={dataset.title}
                    className="text-3xl font-bold"
                />
            </div>
            
            {/* EDITABLE DESCRIPTION */}
            <div className="text-muted-foreground">
                <EditableField 
                    datasetId={dataset.id}
                    field="description"
                    initialValue={dataset.description || "No description provided."}
                    isMultiline={true}
                    className="text-base "
                />
            </div>
        </div>

        <div className="flex gap-3 items-center shrink-0">
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
        
        {/* Financial Stat Card */}
        <StatCard 
          label={isInsufficient ? "Insufficient Funds" : "Est. Cost to Finish"} 
          value={formatCurrency(estimatedCostToFinish)}
          icon={isInsufficient ? "⚠️" : "💰"}
          className={isInsufficient ? "border-destructive/50 bg-destructive/5" : ""}
          iconClassName={isInsufficient ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}
          valueClassName={isInsufficient ? "text-destructive font-extrabold" : ""}
          labelClassName={isInsufficient ? "text-destructive" : ""}
        />

        {/* EDITABLE CONSENSUS STAT CARD */}
        <StatCard 
          label="Required Consensus" 
          icon="🤝" 
          value={
            <div className="flex items-center gap-1">
                <EditableField 
                    datasetId={dataset.id}
                    field="requiredVotes"
                    initialValue={dataset.requiredVotes}
                    type="number"
                    className="font-bold" // Keeps the bold look
                />
                <span className="text-sm font-normal text-muted-foreground">votes</span>
            </div>
          }
        />
        
        <StatCard label="Created On" value={formatDate(dataset.createdAt)} icon="📅" />
      </div>

      {/* --- Content Area (Empty/Populated logic remains same) --- */}
      {!hasTasks ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card/50 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Dataset is Empty</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You have created the dataset shell, but there are no tasks yet.
          </p>
          <Link
            href={`/dashboard/datasets/${datasetId}/upload`}
            className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:brightness-110 shadow-md active:scale-95 transition-all"
          >
            Upload Data Now →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Progress Bar */}
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="font-semibold text-lg">Labeling Progress</h3>
                <p className="text-sm text-muted-foreground">{completedTasksCount} of {totalTasks} tasks completed</p>
              </div>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Table (Keep existing table code...) */}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              {/* ... (Existing table code) ... */}
              <div className="p-4 bg-muted/30 text-center border-t border-border">
                  Showing first 5 tasks.
              </div>
          </div>

          <div><ClearTasksButton datasetId={dataset.id} hasTasks={hasTasks} /></div>
        </div>
      )}

    </div>
  );
}

// --- UPDATED STAT CARD ---
// Now accepts ReactNode for value to support the input field
interface StatCardProps { 
  label: string; 
  value: ReactNode; // Changed from string | number
  icon: string;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}

function StatCard({ label, value, icon, className, iconClassName, valueClassName, labelClassName }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-border p-4 rounded-lg shadow-sm flex items-center gap-4 transition-colors", className)}>
      <div className={cn("w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg transition-colors", iconClassName)}>
        {icon}
      </div>
      <div>
        <p className={cn("text-xs text-muted-foreground uppercase font-semibold tracking-wide", labelClassName)}>{label}</p>
        <div className={cn("text-lg font-bold text-foreground", valueClassName)}>
            {value}
        </div>
      </div>
    </div>
  );
}
