'use client';

import Link from 'next/link';
import { 
    Plus, 
    Upload, 
    FileText, 
    CheckCircle2, 
    MoreVertical,
    Clock
} from 'lucide-react';

// Mock data to visualize the UI before backend integration
const mockDatasets = [
    { id: 1, title: "Customer Support Tweets", status: "ACTIVE", progress: 45, total: 1200, labeled: 540 },
    { id: 2, title: "Product Image Classification", status: "COMPLETED", progress: 100, total: 500, labeled: 500 },
    { id: 3, title: "Medical Text Analysis", status: "PAUSED", progress: 12, total: 3000, labeled: 360 },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your datasets and track labeling progress.</p>
                </div>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                        <FileText className="h-4 w-4" />
                        Documentation
                    </button>
                    <Link href="/dashboard/datasets/create" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Dataset
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Datasets</p>
                            <h3 className="text-2xl font-bold text-slate-900">12</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Tasks Completed</p>
                            <h3 className="text-2xl font-bold text-slate-900">8,540</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Pending Review</p>
                            <h3 className="text-2xl font-bold text-slate-900">145</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datasets Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Active Datasets</h2>
                
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* New Data Entry Card (Call to Action) */}
                    <Link href="/dashboard/datasets/create" className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 transition-all hover:border-blue-500 hover:bg-blue-50/50">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
                            <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Add New Data</h3>
                        <p className="text-center text-sm text-slate-500 mt-1">Upload CSV, JSON or Excel files to start evaluation.</p>
                    </Link>

                    {/* Existing Datasets Cards */}
                    {mockDatasets.map((dataset) => (
                        <div key={dataset.id} className="flex flex-col rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-start justify-between p-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            dataset.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                            dataset.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' : 
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {dataset.status}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-slate-900">{dataset.title}</h3>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="flex-1 px-5">
                                <div className="flex justify-between text-sm text-slate-500 mb-2">
                                    <span>Progress</span>
                                    <span>{Math.round((dataset.labeled / dataset.total) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100">
                                    <div 
                                        className="h-2 rounded-full bg-blue-600 transition-all" 
                                        style={{ width: `${(dataset.labeled / dataset.total) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="mt-3 text-xs text-slate-400">
                                    {dataset.labeled} of {dataset.total} tasks labeled
                                </div>
                            </div>

                            <div className="mt-4 border-t bg-slate-50 p-4 rounded-b-xl flex justify-between items-center">
                                <span className="text-xs text-slate-500">Updated 2h ago</span>
                                <Link href={`/client/dashboard/dataset/${dataset.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                    Manage &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
