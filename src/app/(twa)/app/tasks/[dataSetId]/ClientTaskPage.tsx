"use client";

import { submitVote } from '@/app/actions/tasks'; // Ensure this path is correct
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Task } from '@/lib/types/tasks';
import { Dataset } from '@prisma/client';
import { ArrowLeft } from "lucide-react";
import Image from 'next/image';
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ClientTaskPage({ tasks, datasetData }: { tasks: Task[], datasetData: Dataset }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const currentTask = tasks[currentIndex];

    console.log('🐞🐞🐞', datasetData);


    // Calculate progress safely
    const progress = tasks.length > 0 ? ((currentIndex) / tasks.length) * 100 : 0;


    const handleVote = async (selectedOption: string) => {
        if (!currentTask) return;

        setIsAnimating(true);

        try {
            const result = await submitVote(currentTask.id, selectedOption);

            if (result.success) {
                setTimeout(() => {
                    if (currentIndex < tasks.length - 1) {
                        setCurrentIndex((prev) => prev + 1);
                        setIsAnimating(false);
                    } else {
                        handleBatchComplete();
                    }
                }, 250);
            } else {
                setIsAnimating(false);
                toast.error("Error saving vote.");
            }
        } catch (error) {
            setIsAnimating(false);
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

        // Image Logic
        if (currentTask.imageUrls && currentTask.imageUrls.length > 0) {
            return (
                <div className="space-y-4">
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

        // Text Logic
        if (currentTask.textContent) {
            return (
                <div className="bg-secondary/30 p-6 rounded-lg border border-border">
                    <p className="text-lg font-medium leading-relaxed text-foreground">
                        &ldquo;{currentTask.textContent}&ldquo;
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

    console.log('✅✅', currentTask);

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
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            {/* Task Card */}
            <Card className="flex-1 flex flex-col justify-between shadow-sm">
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
                        <div className='text-sm mt  text-primary-foreground mb-3'>
                            {datasetData.description}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </div>

                <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {datasetData?.options?.map((option) => (
                        <Button
                            key={option}
                            onClick={() => handleVote(option)}
                            disabled={isAnimating}
                            variant="outline"
                            className="h-12 text-base hover:bg-primary/5 hover:border-primary active:scale-95 transition-all"
                        >
                            {option}
                        </Button>
                    ))}
                </CardFooter>
            </Card>
        </div>
    );
}
