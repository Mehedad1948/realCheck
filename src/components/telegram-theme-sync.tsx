"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function TelegramThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Ensure we are running in the browser
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // 1. Notify Telegram the app is ready
      tg.ready();
      tg.expand(); // Optional: Opens the app to full height

      // 2. Force the Next.js theme to match Telegram's color scheme (light/dark)
      if (tg.colorScheme) {
        setTheme(tg.colorScheme);
      }

      // 3. Set the Telegram Header Color to match your background
      // This removes the awkward bar at the top
      const bgColor = tg.themeParams.bg_color || "#ffffff";
      tg.setHeaderColor(bgColor);
      tg.setBackgroundColor(bgColor);

      // 4. Listen for theme changes (if user switches day/night mode inside app)
      tg.onEvent("themeChanged", () => {
        setTheme(tg.colorScheme);
        tg.setHeaderColor(tg.themeParams.bg_color || "#ffffff");
        tg.setBackgroundColor(tg.themeParams.bg_color || "#ffffff");
      });
    }
  }, [setTheme]);

  return null;
}
