/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function TelegramThemeSync() {
  const { setTheme } = useTheme();

  // Use 'WebApp' type from the global namespace provided by the package
  // or just 'any' if you want to be lazy, but strictly:
  const [tgData, setTgData] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      const updateTgData = () => {
        // Save the whole WebApp object to state
        // (You usually don't need to copy params manually, just store the ref)
        setTgData({ ...tg }); // Create a shallow copy to trigger re-render

        // 1. Sync Next-Themes
        if (tg.colorScheme) {
          setTheme(tg.colorScheme);
        }

        console.log('❌❌', tg);
        

        // 2. Sync Telegram Header & Background
        const bgColor = tg.themeParams?.bg_color || "#ffffff";
        tg.setHeaderColor(bgColor);
        tg.setBackgroundColor(bgColor);
      };

      // Initial Run
      updateTgData();

      // Event Listener (Using correct camelCase)
      tg.onEvent("themeChanged", updateTgData);

      // Cleanup function to remove listener (Good practice)
      return () => {
        tg.offEvent("themeChanged", updateTgData);
      };
    }
  }, [setTheme]);


  return null
}
