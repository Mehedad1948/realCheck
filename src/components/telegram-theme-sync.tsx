"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function TelegramThemeSync() {
  const { setTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tgData, setTgData] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      const syncData = () => {
        setTgData({ ...tg });

        // 1. Sync Theme
        if (tg.colorScheme) {
          setTheme(tg.colorScheme);
        }

        // 2. Sync Header Colors
        const bgColor = tg.themeParams?.bg_color || "#ffffff";
        tg.setHeaderColor(bgColor);
        tg.setBackgroundColor(bgColor);

        // ============================================================
        // 3. SECURITY: SET COOKIE FOR SERVER SIDE ACCESS
        // ============================================================
        // We store the raw 'initData' string. 
        // This string contains the hash we need to verify on the server.
        if (tg.initData) {
          // Set cookie: name=tg_init_data, path=/, expires in 24h
          const expires = new Date(Date.now() + 86400 * 1000).toUTCString();
          document.cookie = `tg_init_data=${tg.initData}; path=/; expires=${expires}; SameSite=Strict; Secure`;
        }
      };

      // Initial Run
      syncData();

      // Listeners
      tg.onEvent("themeChanged", syncData);
      return () => {
        tg.offEvent("themeChanged", syncData);
      };
    }
  }, [setTheme]);

  return null
}
