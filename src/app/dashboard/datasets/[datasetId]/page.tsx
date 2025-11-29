import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// Helper to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
};

export default async function DatasetDetailsPage({ params }: { params: { datasetId: string } }) {
  const { datasetId } = await params;

  // 1. Fetch Dataset Details + First 5 Tasks for Preview
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    include: {
      tasks: {
        take: 5, // Just for preview
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

  // 2. Calculate Specific Stats
  const totalTasks = dataset._count.tasks;
  
  const completedTasksCount = await prisma.task.count({
    where: { 
      datasetId: dataset.id,
      status: 'COMPLETED' 
    }
  });

  const progress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
  const hasTasks = totalTasks > 0;

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-300">
      
      {/* --- Breadcrumb / Back Navigation --- */}
      <div className="mb-6">
        <Link 
          href="/dashboard/datasets"
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to All Datasets
        </Link>
      </div>

      {/* --- Header Section --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{dataset.title}</h1>
          <p className="text-muted-foreground max-w-2xl">{dataset.description}</p>
        </div>
        
        <div className="flex gap-3">
           {hasTasks && (
             <Link 
               href={`/dashboard/datasets/${datasetId}/upload`}
               className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-muted rounded-md transition-colors"
             >
               Add More Data
             </Link>
           )}
           <div className={`px-3 py-1 rounded-full flex items-center justify-center text-xs font-bold border ${
             dataset.status === 'ACTIVE' 
               ? 'bg-green-500/10 text-green-600 border-green-500/20' 
               : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
           }`}>
             {dataset.status}
           </div>
        </div>
      </header>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={totalTasks.toString()} icon="📦" />
        <StatCard label="Data Type" value={dataset.dataType} icon={dataset.dataType === 'IMAGE' ? '🖼️' : '📝'} />
        <StatCard label="Required Consensus" value={`${dataset.requiredVotes} votes`} icon="🤝" />
        <StatCard label="Created On" value={formatDate(dataset.createdAt)} icon="📅" />
      </div>

      {/* --- CONDITIONAL CONTENT AREA --- */}
      
      {!hasTasks ? (
        /* --- EMPTY STATE: Call to Action --- */
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card/50 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Dataset is Empty</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You have created the dataset shell, but there are no tasks for workers to solve yet. Upload your CSV or JSON file to get started.
          </p>
          <Link 
            href={`/dashboard/datasets/${datasetId}/upload`}
            className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:brightness-110 shadow-md active:scale-95 transition-all"
          >
            Upload Data Now →
          </Link>
        </div>

      ) : (
        /* --- POPULATED STATE: Preview & Progress --- */
        <div className="space-y-8">
          
          {/* Progress Bar */}
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="font-semibold text-lg">Labeling Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {completedTasksCount} of {totalTasks} tasks completed
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h3 className="font-semibold">Task Preview (First 5)</h3>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Read-Only View</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Content</th>
                    <th className="px-6 py-3 text-center">Votes</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.tasks.map((task) => (
                    <tr key={task.id} className="bg-card border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {task.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-medium max-w-md truncate">
                        {dataset.dataType === 'IMAGE' ? (
                           /* ✅ FIXED: Accessing first item of imageUrls array */
                           <div className="flex items-center gap-2 text-blue-500">
                              <span>🖼️</span> 
                              {task.imageUrls && task.imageUrls.length > 0 ? (
                                <a href={task.imageUrls[0]} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                                  {task.imageUrls[0].substring(0, 40)}...
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">No image URL</span>
                              )}
                           </div>
                        ) : (
                           /* ✅ FIXED: Accessing textContent field */
                           <span title={task.textContent || ''}>
                             {task.textContent || <span className="italic text-muted-foreground">Empty text</span>}
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {task.collectedVotes} / {dataset.requiredVotes}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {task.status === 'COMPLETED' ? (
                            <span className="text-green-600 font-bold text-xs">✔ Done</span>
                         ) : (
                            <span className="text-muted-foreground text-xs">In Progress</span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="p-4 bg-muted/30 text-center border-t border-border">
               <p className="text-xs text-muted-foreground">
                 Showing first 5 of {totalTasks} tasks. 
               </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// --- Small Helper Component for Stats ---
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
