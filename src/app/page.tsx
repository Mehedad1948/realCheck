// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Coins } from "lucide-react"; // Icon library
import Link from 'next/link';

// REPLACE WITH YOUR NGROK URL
const BACKEND_URL = "https://YOUR-NGROK-URL.ngrok-free.app";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Simulate Telegram loading
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // Mock user ID for browser testing if not in Telegram
      setUserId(tg.initDataUnsafe?.user?.id || 99999);
    }

    // fetchTask();
  }, []);

  const fetchTask = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/task`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  };

  const submitAnswer = async (answer: string) => {
    if (!task || !userId) return;
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, taskId: task.id, answer }),
      });
      const data = await res.json();

      // Show success feedback (You could use a Toast here)
      alert(`Earned! New Balance: ${data.newBalance}`);

      // In a real app, you'd fetch the NEXT task here instead of closing
      window.Telegram.WebApp.close();
    } catch (e) {
      alert("Error submitting");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 p-4">

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-blue-600" />
          RealCheck
        </h1>
        <Badge variant="secondary" className="flex gap-1">
          <Coins className="w-3 h-3" />
          Earn TON
        </Badge>
      </div>

      {/* Task Card */}
      <div className="w-full max-w-md space-y-4">
        {loading ? (
          // Loading State (Skeleton)
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ) : (
          // Active Task State
          <Card className="shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Task #{task.id}</CardTitle>
              <CardDescription>
                Read the text below and select the best label.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                <p className="text-slate-800 font-medium text-lg leading-relaxed">
                  "{task.content}"
                </p>
              </div>
              <p className="text-sm text-slate-500 font-medium text-center">
                {task.question}
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              {task.options.map((opt: string) => (
                <Button
                  key={opt}
                  onClick={() => submitAnswer(opt)}
                  className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 transition-all"
                >
                  {opt}
                </Button>
              ))}
            </CardFooter>
          </Card>
        )}
      </div>

      <div className=' mt-4 w-full max-w-md mx-auto'>
        <Link className='w-full' href={'/app'}>
          <Button variant={'secondary'} className='w-full'>
            App
          </Button>
        </Link>
      </div>
    </main>
  );
}
