import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card'; // Adjust path to your shadcn components
import { Badge } from '@/components/ui/badge';
import { getActiveDatasets } from '@/app/actions/tasks/getDatasets';

export default async function DatasetList() {
    // 1. Fetch data directly in the Server Component
    // We fetch the first page with a limit of 50 for the main list
    const { success, data, error } = await getActiveDatasets(1, 50);

    if (!success) {
        return (
            <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
                Error loading tasks: {error}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No active tasks available at the moment. Check back later!
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {data.map((dataset) => (
                <Link
                    key={dataset.id}
                    className="mb-4 block"
                    href={`/app/tasks/${dataset.id}`}
                >
                    <Card className="hover:bg-accent/50 relative transition-colors cursor-pointer active:scale-95 duration-200 border-border/50">

                        <CardContent className="p-4  grid grid-cols-[1fr_auto] items-center justify-between">
                            <div className="font-bold absolute top-1 right-2 text-primary text-xs">EARN {dataset.reward} TON</div>

                            <Badge variant="secondary" className="absolute right-2 bottom-1 text-[10px] h-5 px-1 mt-1">
                                {/* @ts-ignore: _count exists at runtime if included in query */}
                                {dataset._count?.tasks || 0} Tasks
                            </Badge>
                            {/* Left Side: Icon + Text */}
                            <div className="flex items-center gap-4">
                                {/* Icon Container */}
                                <div className="h-10 w-10  rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <span className="text-xl">
                                        {/* You can add logic here to show different icons based on title keywords */}
                                        {getIconForDataset(dataset.title)}
                                    </span>
                                </div>

                                {/* Text Content */}
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold text-wrap pr-2">{dataset.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {dataset.description}
                                    </p>
                                </div>
                            </div>


                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

// Simple helper to give variety to the list based on keywords
function getIconForDataset(title: string) {
    const t = title.toLowerCase();
    if (t.includes('image') || t.includes('bound') || t.includes('box')) return '🖼️';
    if (t.includes('text') || t.includes('sentiment')) return '📝';
    if (t.includes('audio') || t.includes('sound')) return '🎧';
    if (t.includes('video')) return '🎥';
    return '📂'; // Default folder icon
}
