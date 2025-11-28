import { Loader2 } from 'lucide-react';

export default function loading() {
    return (
        <div className="flex flex-col h-screen items-center justify-center space-y-4">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="text-muted-foreground">Loading tasks...</p>
        </div>
    );
}