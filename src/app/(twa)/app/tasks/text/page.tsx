"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, AlertCircle, ArrowLeft } from "lucide-react";

// 1. Define the shape of a Task
type Task = {
    id: string;
    type: "sentiment";
    content: string; // The text to be labeled
    reward: number;
};

export default function TextLabelingPage() {
    const router = useRouter();

    // 2. Mock Data (In reality, this comes from your API)
    const [tasks, setTasks] = useState<Task[]>([
        { id: "1", type: "sentiment", content: "I absolutely loved the service! Fast and friendly.", reward: 0.02 },
        { id: "2", type: "sentiment", content: "The package arrived damaged and late. Very disappointed.", reward: 0.02 },
        { id: "3", type: "sentiment", content: "It was okay, nothing special but not bad either.", reward: 0.02 },
    ]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const currentTask = tasks[currentIndex];

    // 3. Handle Submission
    const handleVote = (sentiment: "positive" | "negative" | "neutral") => {
        if (!currentTask) return;

        setIsAnimating(true);

        // Simulate API Call
        console.log(`Task ${currentTask.id} labeled as: ${sentiment}`);

        // Wait for animation, then switch to next task
        setTimeout(() => {
            setCompletedCount((prev) => prev + 1);

            if (currentIndex < tasks.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                // No more tasks
                alert("Batch complete! Money added to wallet.");
                router.push("/"); // Go back to dashboard
            }
            setIsAnimating(false);
        }, 300); // 300ms delay for UX feel
    };

    // 4. Progress Calculation
    const progress = ((currentIndex) / tasks.length) * 100;

    return (
        <div className="flex flex-col h-screen bg-background p-4 max-w-md mx-auto">

            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Task {currentIndex + 1} of {tasks.length}
                    </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {currentTask?.reward} TON
                </Badge>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-1 mb-6" />

            {/* Main Content Area */}
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
                        <div className="animate-spin text-4xl mb-4">⏳</div>
                        <p>Loading more tasks...</p>
                    </div>
                )}
            </div>

            {/* Action Buttons (Sticky Bottom) */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <Button
                    variant="outline"
                    className="h-16 flex flex-col border-red-200 hover:bg-red-50 hover:border-red-500 dark:border-red-900 dark:hover:bg-red-900/30"
                    onClick={() => handleVote("negative")}
                >
                    <ThumbsDown className="w-6 h-6 text-red-500 mb-1" />
                    <span className="text-xs font-semibold text-red-500">Negative</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-16 flex flex-col border-gray-200 hover:bg-gray-50 dark:border-gray-700"
                    onClick={() => handleVote("neutral")}
                >
                    <AlertCircle className="w-6 h-6 text-gray-500 mb-1" />
                    <span className="text-xs font-semibold text-gray-500">Neutral</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-16 flex flex-col border-green-200 hover:bg-green-50 hover:border-green-500 dark:border-green-900 dark:hover:bg-green-900/30"
                    onClick={() => handleVote("positive")}
                >
                    <ThumbsUp className="w-6 h-6 text-green-500 mb-1" />
                    <span className="text-xs font-semibold text-green-500">Positive</span>
                </Button>
            </div>

        </div>
    );
}
