"use client";

import { submitVote } from '@/app/actions/tasks';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Task } from '@/lib/types/tasks'; // Ensure this matches your schema
import { Dataset } from '@prisma/client';
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Standard shadcn utility
import { SwipeWrapper } from '@/components/tools/SwipeWrapper';

export default function ClientTaskPage({ tasks, datasetData }: { tasks: Task[], datasetData: Dataset }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // NEW: Store user answers locally { [taskId]: "Option A" }
    const [userVotes, setUserVotes] = useState<Record<string, string>>({});

    const currentTask = tasks[currentIndex];

    // Calculate progress
    const progress = tasks.length > 0 ? ((currentIndex + 1) / tasks.length) * 100 : 0;

    // --- Navigation Handlers ---

    const handleNext = () => {
        if (currentIndex < tasks.length - 1) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setIsAnimating(false);
            }, 150); // Small delay for animation feel
        } else {
            // If currently on last slide and we have voted, show finish
            if (userVotes[currentTask.id]) handleBatchComplete();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => prev - 1);
                setIsAnimating(false);
            }, 150);
        }
    };

    // --- Voting Handler ---

    const handleVote = async (selectedOption: string) => {
        if (!currentTask) return;

        // 1. Optimistic Update: Save vote locally immediately so UI updates
        setUserVotes((prev) => ({
            ...prev,
            [currentTask.id]: selectedOption
        }));

        // 2. Submit to Server
        try {
            // Only submit if we haven't submitted this exact vote before (optional optimization)
            // For now, we submit every click to be safe
            const result = await submitVote(currentTask.id, selectedOption);

            if (!result.success) {
                toast.error(result.message || "Error saving vote.");
                // Optional: Revert local state on failure
            } else {
                // 3. Auto Advance on success
                handleNext();
            }
        } catch (error) {
            toast.error("Network error.");
        }
    };

    const handleBatchComplete = () => {
        toast.success("Batch Complete!", {
            description: "Reward added to wallet.",
            action: {
                label: "Dashboard",
                onClick: () => router.push("/app"),
            },
        });
        router.push("/app");
    };

    const renderContent = () => {
        if (!currentTask) return null;

        if (currentTask.imageUrls && currentTask.imageUrls.length > 0) {
            return (
                <div className="space-y-4 pointer-events-none">
                    {/* pointer-events-none prevents image drag interfering with swipe */}
                    {currentTask.imageUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                            <Image
                                width={400}
                                height={400}
                                src={url}
                                alt={`Task Content ${idx + 1}`}
                                className="object-contain w-full h-full"
                            />
                        </div>
                    ))}
                </div>
            );
        }

        if (currentTask.textContent) {
            return (
                <div className="bg-secondary/30 p-6 rounded-lg border border-border pointer-events-none">
                    <p className="text-lg font-medium leading-relaxed text-foreground">
                        &ldquo;{currentTask.textContent}&rdquo;
                    </p>
                </div>
            );
        }

        return <div className="text-muted-foreground italic">Content missing...</div>;
    };

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
                <p className="text-lg mb-4">No tasks available at the moment.</p>
                <Button onClick={() => router.push("/app")} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen max-w-md mx-auto p-4 gap-4">
            {/* Top Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/app")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Task {currentIndex + 1} of {tasks.length}</span>
                        <span>+{currentTask?.reward} TON</span>
                    </div>
                    <Progress value={progress} className="h-2 transition-all duration-500" />
                </div>
            </div>

            {/* 
               SWIPE WRAPPER 
               Handles swipes and edge taps to navigate 
            */}
            <SwipeWrapper
                onSwipeLeft={handleNext}
                onSwipeRight={handlePrevious}
                className="flex-1 flex flex-col h-full"
            >
                <Card className={cn(
                    "flex-1 flex flex-col justify-between shadow-sm transition-opacity duration-200",
                    isAnimating ? "opacity-50" : "opacity-100"
                )}>
                    <div>
                        <CardHeader>
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-lg font-semibold">
                                    {datasetData?.question}
                                </CardTitle>
                                <Badge variant="secondary" className="uppercase text-[10px]">
                                    {datasetData?.dataType?.replace("_", " ") || "Task"}
                                </Badge>
                            </div>
                            <div className='text-sm opacity-90 mb-3'>
                                {datasetData.description}
                            </div>
                        </CardHeader>

                        <CardContent className="select-none">
                            {renderContent()}
                        </CardContent>
                    </div>

                    <CardFooter className="flex flex-col gap-4">
                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {datasetData?.options?.map((option) => {
                                const isSelected = userVotes[currentTask.id] === option;
                                return (
                                    <Button
                                        key={option}
                                        onClick={() => handleVote(option)}
                                        // If selected, use 'default' (solid color), else 'outline'
                                        variant={isSelected ? "default" : "outline"}
                                        className={cn(
                                            "h-12 text-base transition-all active:scale-95",
                                            // Custom styling for selected state if needed
                                            isSelected ? "border-primary font-bold ring-2 ring-primary/20" : "hover:bg-primary/5"
                                        )}
                                    >
                                        {option}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Manual Navigation Footer (Optional but good UX) */}
                        <div className="flex justify-between w-full pt-2 border-t mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="text-muted-foreground"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                            </Button>

                            <span className="text-xs text-muted-foreground self-center">
                                Swipe or Tap sides
                            </span>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNext}
                                disabled={currentIndex === tasks.length - 1}
                                className="text-muted-foreground"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </SwipeWrapper>
        </div>
    );
}
