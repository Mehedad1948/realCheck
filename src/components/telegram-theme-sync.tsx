"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function TelegramThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Check if running inside Telegram
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // 1. Signal Telegram we are ready
      tg.ready();
      tg.expand(); // Optional: expands to full height

      // 2. Set initial theme based on Telegram
      setTheme(tg.colorScheme); // 'light' or 'dark'

      // 3. Set the Header Color to match the background (immersiveness)
      // This makes the top status bar blend in perfectly
      tg.setHeaderColor(tg.themeParams.bg_color || "#ffffff");
      tg.setBackgroundColor(tg.themeParams.bg_color || "#ffffff");

      // 4. Listen for dynamic changes (if user changes theme while app is open)
      tg.onEvent("themeChanged", () => {
        setTheme(tg.colorScheme);
        tg.setHeaderColor(tg.themeParams.bg_color || "#ffffff");
        tg.setBackgroundColor(tg.themeParams.bg_color || "#ffffff");
      });
    }
  }, [setTheme]);

  return null; // This component renders nothing visually
}
