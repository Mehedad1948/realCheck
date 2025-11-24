"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getTasks, submitVote } from '@/app/actions/tasks';

type Task = {
    id: string;
    type: string;
    content: string;
    reward: number;
};

export default function TextLabelingPage() {
    const router = useRouter();

    // --- 2. STATE MANAGEMENT ---
    // Start with an empty array, we will fetch data on mount
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const currentTask = tasks[currentIndex];

    // --- 3. FETCH TASKS ON MOUNT ---
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const data = await getTasks();
                // Ensure data matches Task type, or cast it if your backend is loose
                setTasks(data as Task[]);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load tasks. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTasks();
    }, []);

    // --- 4. HANDLE VOTE (Async) ---
    const handleVote = async (sentiment: "positive" | "negative" | "neutral") => {
        if (!currentTask) return;

        // Start UI Animation immediately for snappiness
        setIsAnimating(true);

        try {
            // Call Server Action
            const result = await submitVote(currentTask.id, sentiment);

            if (result.success) {
                // Wait for the animation timing (simulating smooth transition)
                setTimeout(() => {
                    if (currentIndex < tasks.length - 1) {
                        // Move to next task
                        setCurrentIndex((prev) => prev + 1);
                        setIsAnimating(false);
                    } else {
                        // Batch Complete
                        toast.success("Batch Complete!", {
                            description: "Reward has been added to your wallet.", // You can use result.reward here if your action returns it
                            duration: 4000,
                            
                            action: {
                                label: "View Wallet",
                                onClick: () => router.push("/app"),
                            },
                        });
                        router.push("/app");
                    }
                }, 300); // Keep this small delay for the UI animation
            } else {
                // Action failed logic
                setIsAnimating(false);
                toast.error("Error saving vote. Please try again.");
            }
        } catch (error) {
            setIsAnimating(false);
            toast.error("Network error. Please try again.");
        }
    };

    // Calculate progress (safeguard against divide by zero)
    const progress = tasks.length > 0 ? ((currentIndex) / tasks.length) * 100 : 0;

    // --- 5. RENDER ---
    if (isLoading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4">
                <div className="animate-spin text-4xl">⏳</div>
                <p className="text-muted-foreground">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background p-4 max-w-md mx-auto">

            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        {tasks.length > 0 ? `Task ${currentIndex + 1} of ${tasks.length}` : 'No Tasks'}
                    </span>
                </div>
                {currentTask && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {currentTask.reward} TON
                    </Badge>
                )}
            </div>

            <Progress value={progress} className="h-1 mb-6" />

            <div className="flex-1 flex items-center justify-center pb-20">
                {currentTask ? (
                    <Card className={`w-full border-2 transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                        <CardHeader>
                            <Badge variant="outline" className="w-fit mb-2">Sentiment Analysis</Badge>
                            <h3 className="text-sm text-muted-foreground uppercase tracking-wider">Analyze this comment</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-medium leading-relaxed">
                                "{currentTask.content}"
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center">
                        <p>No more tasks available.</p>
                        <Button variant="link" onClick={() => router.push('/app')}>Go Home</Button>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <Button
                    variant="outline"
                    disabled={isAnimating || !currentTask}
                    className="h-16 flex flex-col border-red-200 hover:bg-red-50 hover:border-red-500 dark:border-red-900 dark:hover:bg-red-900/30 transition-colors"
                    onClick={() => handleVote("negative")}
                >
                    <ThumbsDown className="w-6 h-6 text-red-500 mb-1" />
                    <span className="text-xs font-semibold text-red-500">Negative</span>
                </Button>

                <Button
                    variant="outline"
                    disabled={isAnimating || !currentTask}
                    className="h-16 flex flex-col border-gray-200 hover:bg-gray-50 dark:border-gray-700 transition-colors"
                    onClick={() => handleVote("neutral")}
                >
                    <AlertCircle className="w-6 h-6 text-gray-500 mb-1" />
                    <span className="text-xs font-semibold text-gray-500">Neutral</span>
                </Button>

                <Button
                    variant="outline"
                    disabled={isAnimating || !currentTask}
                    className="h-16 flex flex-col border-green-200 hover:bg-green-50 hover:border-green-500 dark:border-green-900 dark:hover:bg-green-900/30 transition-colors"
                    onClick={() => handleVote("positive")}
                >
                    <ThumbsUp className="w-6 h-6 text-green-500 mb-1" />
                    <span className="text-xs font-semibold text-green-500">Positive</span>
                </Button>
            </div>

        </div>
    );
}
