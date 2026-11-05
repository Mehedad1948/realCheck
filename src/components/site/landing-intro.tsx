/**
 * Full-screen overlay that draws a check mark, then fades away to reveal the page. Pure CSS: it is
 * hidden unless the layout's intro script sets data-intro="play" on <html> (see globals.css).
 */
export function LandingIntro() {
  return (
    <div aria-hidden className="landing-intro fixed inset-0 z-50 items-center justify-center bg-background">
      <svg viewBox="0 0 64 64" className="h-20 w-20" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="rc-intro-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <circle
          className="intro-ring"
          cx="32"
          cy="32"
          r="29"
          pathLength={1}
          transform="rotate(-90 32 32)"
          stroke="url(#rc-intro-stroke)"
          strokeWidth="1.5"
        />
        <path className="intro-check" d="M20.5 33l7.5 7.5L44 24.5" pathLength={1} stroke="url(#rc-intro-stroke)" strokeWidth="3" />
      </svg>
    </div>
  );
}
