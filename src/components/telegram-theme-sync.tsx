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

  if (!tgData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Waiting for Telegram WebApp...
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Telegram Debug Info
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* General Info */}
        <div className="space-y-1 text-gray-700 dark:text-gray-300">
          <p><strong>Color Scheme:</strong> {tgData.colorScheme}</p>
          <p><strong>Platform:</strong> {tgData.platform}</p>
          <p><strong>Version:</strong> {tgData.version}</p>
          <p><strong>Expanded:</strong> {tgData.isExpanded ? "Yes" : "No"}</p>
        </div>

        {/* Theme Params */}
        <div>
          <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
            Theme Params
          </h3>
          <ul className="space-y-1">
            {tgData.themeParams && Object.entries(tgData.themeParams).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{key}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{value as string}</span>
                  <span 
                    className="w-3 h-3 rounded-full border border-gray-500"
                    style={{ backgroundColor: value as string }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Init Data */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="font-medium mb-1 text-gray-800 dark:text-gray-200">Init Data Payload:</h3>
        <code className="block text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded break-all text-gray-500">
          {tgData.initData || "No init data available"}
        </code>
      </div>
    </div>
  );
}
