import { TelegramThemeSync } from "@/components/telegram-theme-sync";
import { ThemeProvider } from 'next-themes';
import "../globals.css"

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    /* 
      suppressHydrationWarning is needed because next-themes 
      modifies the HTML tag attributes 
    */
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Load the script early */}
        <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
      </head>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider  attribute="class" defaultTheme="system" enableSystem>
           
           {/* This component handles the logic */}
           <TelegramThemeSync /> 
           
           <main className="min-h-screen w-full">
             {children}
           </main>
        
        </ThemeProvider>
      </body>
    </html>
  );
}
