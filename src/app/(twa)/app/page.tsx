"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wallet, 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  ShieldCheck,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  // MOCK DATA: In the future, these will come from your backend API
  const userStats = {
    balance: 4.25, // TON
    accuracy: 98,  // The "RealCheck" Score
    tasksDone: 142,
    rank: "Gold Validator"
  };

  return (
    <div className="p-4 space-y-6 pb-20 max-w-xl mx-auto">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">RealCheck</h1>
          <p className="text-sm text-muted-foreground">Global Data Validation</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 gap-1 border-primary/30">
          <ShieldCheck className="w-3 h-3 text-green-500" />
          {userStats.rank}
        </Badge>
      </header>

      {/* --- EARNINGS CARD (The "Hero") --- */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
        <CardContent className="px-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Current Balance</p>
              <h2 className="text-4xl font-bold mt-1 flex items-baseline gap-2">
                {userStats.balance} <span className="text-lg font-normal opacity-80">TON</span>
              </h2>
              <p className="text-blue-200 text-xs mt-1">≈ ${(userStats.balance * 5.4).toFixed(2)} USD</p>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
              Withdraw
            </Button>
            <Button variant="secondary" className="w-full bg-white text-blue-700 hover:bg-blue-50 border-none font-semibold">
              History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- QUALITY CONTROL (The "RealCheck" Core) --- */}
      {/* This is crucial for your business model. Users must maintain high accuracy. */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Accuracy Score
          </span>
          <span className={userStats.accuracy > 90 ? "text-green-500 font-bold" : "text-orange-500"}>
            {userStats.accuracy}%
          </span>
        </div>
        <Progress value={userStats.accuracy} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          Maintain {">"}95% to unlock higher pay.
        </p>
      </div>

      {/* --- ACTION AREA: AVAILABLE TASKS --- */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Available Tasks
        </h3>

        {/* Task Card 1: Image Labeling */}
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer active:scale-95 duration-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-xl">🖼️</span>
              </div>
              <div>
                <h4 className="font-semibold">Image Bounding Box</h4>
                <p className="text-xs text-muted-foreground">Draw boxes around cars</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">0.05 TON</div>
              <Badge variant="secondary" className="text-[10px] h-5 px-1">~2 min</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Task Card 2: Text Analysis */}
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer active:scale-95 duration-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h4 className="font-semibold">Sentiment Analysis</h4>
                <p className="text-xs text-muted-foreground">Is this comment happy?</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">0.02 TON</div>
              <Badge variant="secondary" className="text-[10px] h-5 px-1">~30 sec</Badge>
            </div>
          </CardContent>
        </Card>

      </section>

      {/* --- BOTTOM BIG CTA --- */}
      <Button size="lg" className="w-full h-14 text-lg shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-bottom-4">
        Start Earning Now <ArrowRight className="ml-2 w-5 h-5" />
      </Button>

    </div>
  );
}
