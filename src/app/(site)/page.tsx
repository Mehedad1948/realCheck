import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 overflow-hidden font-sans">
      
      {/* --- Background Pattern --- */}
      {/* A subtle grid pattern that works in both light and dark mode */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      {/* --- Navigation --- */}
      <nav className="w-full px-6 py-8 flex justify-between items-center max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-2">
          {/* Minimal Logo Icon */}
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-lg">
            R
          </div>
          <span className="font-bold text-xl tracking-tight">RealCheck</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link 
            href="/login" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Log in
          </Link>
          <Link 
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center max-w-5xl mx-auto z-10">
        
        <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm mb-8">
          <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Consensus Engine v1.0 Live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Data Labeling, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
            Verified by Consensus.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          RealCheck leverages distributed human intelligence to validate datasets with cryptographic precision. Ensure quality before you train your models.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/dashboard"
            className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-all shadow-md hover:shadow-xl active:scale-95"
          >
            Start Labeling
          </Link>
          <Link 
            href="#features"
            className="px-8 py-4 rounded-lg border border-border bg-card hover:bg-muted/50 font-medium text-lg transition-colors"
          >
            Learn More
          </Link>
        </div>

      </main>

      {/* --- Feature Highlights (Minimal) --- */}
      <section id="features" className="w-full border-t border-border bg-card/30 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard 
            title="Consensus Validation"
            description="Tasks require multi-party agreement before being marked as valid. Trust the crowd, verified by code."
            icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
          />
          <FeatureCard 
            title="Instant Settlements"
            description="Workers are rewarded immediately upon reaching consensus. Reputation scores prevent bad actors."
            icon={<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>}
          />
          <FeatureCard 
            title="Dataset Integrity"
            description="Immutable records of every vote and validation action. Your data lineage is preserved."
            icon={<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>}
          />
        </div>
      </section>

      {/* --- Simple Footer --- */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border bg-background">
        <p>© 2025 RealCheck Inc. All rights reserved.</p>
      </footer>

    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="group p-6 rounded-2xl border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all duration-300">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
