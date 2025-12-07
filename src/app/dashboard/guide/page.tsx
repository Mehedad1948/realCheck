import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Layers,
  Zap,
  Download,
  MousePointerClick,
  Info
} from "lucide-react";
import Image from 'next/image';

export default function PlatformIntroductionPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">

      {/* 1. HEADER IMAGE PLACEHOLDER */}
      {/* This area is pre-styled for your future image. Currently a nice gradient. */}
      <div className="w-full aspect-video  bg-gradient-to-br from-muted to-muted/50 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden relative shadow-sm">
        <Image
          width={600}
          height={500}
          alt='RealCheck'
          className='w-full h-full object-cover'
          src={'/images/intro-image.png'}
        />
        {/* LATER: Replace the above content with <Image src="..." fill className="object-cover" /> */}
      </div>

      {/* 2. MISSION STATEMENT (High Level) */}
      <section className="space-y-4 max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight">Purpose & Philosophy</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          We bridge the gap between raw, chaotic data and high-quality machine learning models.
          By distributing verification tasks to a global workforce, we ensure that every data point
          in your set is vetted by human intelligence before it ever touches your training pipeline.
        </p>
      </section>

      <Separator />

      {/* 3. CORE VALUES (Grid Layout) */}
      <section>
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          What We Deliver
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <ValueCard
            title="Consensus Accuracy"
            description="We don't trust a single vote. We use a multi-voter consensus mechanism to ensure statistical accuracy for every task."
          />
          <ValueCard
            title="Parallel Speed"
            description="Your dataset is split into micro-tasks and processed simultaneously by hundreds of workers, reducing weeks of work to hours."
          />
          <ValueCard
            title="Transparent Pricing"
            description="No subscriptions. Your balance is consumed only when a task is successfully completed and verified."
          />
        </div>
      </section>

      {/* 4. HOW IT WORKS (The "Native App" Feel) */}
      <section className="bg-muted/30 rounded-2xl p-8 border border-border/50">
        <h3 className="text-xl font-semibold mb-8">Operational Workflow</h3>

        <div className="space-y-8 relative">
          {/* Vertical Line for timeline effect */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border hidden md:block"></div>

          <StepItem
            icon={<Layers className="h-5 w-5 text-primary" />}
            title="1. Dataset Ingestion"
            content="Upload your images or text. Define the 'Question' you want answered (e.g., 'Is this a cat?'). We automatically chunk this into micro-tasks."
          />

          <StepItem
            icon={<MousePointerClick className="h-5 w-5 text-primary" />}
            title="2. Distributed Voting"
            content="Workers access the tasks via their specialized view. They vote independently. You can monitor the 'Active' and 'Completed' counts in real-time on your dashboard."
          />

          <StepItem
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            title="3. Validation & Lock"
            content="Once a task reaches your 'Required Votes' threshold, it locks. The majority vote is calculated and stamped as the final truth."
          />

          <StepItem
            icon={<Download className="h-5 w-5 text-primary" />}
            title="4. Export"
            content="Download your results as a flat CSV (for analysis) or structured JSON (for direct model ingestion)."
          />
        </div>
      </section>

      {/* 5. PRO TIP / EMPHASIS BOX */}
      {/* This uses the 'Light Primary Background' style you asked for */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 flex gap-4 items-start">
        <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-semibold text-foreground">Ready to start?</h4>
          <p className="text-sm text-muted-foreground">
            Head over to the <strong>New Dataset</strong> tab in the sidebar. Make sure your wallet is funded via the top-up widget to activate your tasks immediately.
          </p>
        </div>
      </div>

    </div>
  );
}

// --- SUB COMPONENTS ---

function ValueCard({ title, description }: { title: string, description: string }) {
  return (
    <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function StepItem({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <div className="relative flex gap-6 md:pl-8">
      {/* Icon Bubble */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background border shadow-sm flex items-center justify-center z-10">
        {icon}
      </div>
      <div className="pt-2 space-y-2">
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-muted-foreground max-w-2xl">
          {content}
        </p>
      </div>
    </div>
  );
}
