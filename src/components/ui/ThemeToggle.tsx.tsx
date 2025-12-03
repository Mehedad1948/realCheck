'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  // The state still represents if we are in dark mode. 
  // It will now default to `true`.
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // The new logic: The theme is only light if explicitly set in localStorage.
    // Otherwise, it's dark by default.
    const isLightMode = localStorage.getItem('theme') === 'light';

    if (isLightMode) {
      // If it's light mode, apply the .light class and update the state
      setIsDark(false);
      document.documentElement.classList.add('light');
    } else {
      // If it's dark mode (or not set), ensure the .light class is removed
      // and the state is correct.
      setIsDark(true);
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;

    // We are now toggling the 'light' class, not the 'dark' class.
    if (isDark) {
      // If current theme is Dark, switch to Light
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      // If current theme is Light, switch to Dark
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark'); // Or you can remove the item
      setIsDark(true);
    }
  };

  // Prevent hydration mismatch (renders empty div until client loads)
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="
      fixed bottom-4 right-4
         flex items-center justify-center 
        w-9 h-9 rounded-full 
        border border-border/50
        bg-transparent text-foreground
        hover:bg-muted hover:border-border
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-primary/20
      "
    >
      {/* Sun Icon (Visible when NOT dark -> i.e., in Light Mode) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-4 h-4 absolute transition-all duration-500 ease-in-out ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>

      {/* Moon Icon (Visible in Dark Mode) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-4 h-4 absolute transition-all duration-500 ease-in-out ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
