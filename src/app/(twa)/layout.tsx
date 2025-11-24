// app/(twa)/layout.tsx
import { TelegramThemeSync } from "@/components/telegram-theme-sync"; // <--- Import this
import { ThemeProvider } from 'next-themes';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      </head>
      <body className="bg-background text-foreground">
        {/* 
           The ThemeProvider must wrap the Sync component 
           so useTheme() has context to work with.
        */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           
           <TelegramThemeSync /> {/* <--- PLACE IT HERE */}
           
           {children}
        
        </ThemeProvider>
      </body>
    </html>
  );
}
