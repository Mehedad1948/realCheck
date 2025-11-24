/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function TelegramThemeSync() {
  const { setTheme } = useTheme();
  const [tgData, setTgData] = useState<any>(null); // State to hold Telegram WebApp data

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      // Function to extract and set relevant Telegram WebApp data
      const updateTgData = () => {
        setTgData({
          colorScheme: tg.colorScheme,
          themeParams: {
            bg_color: tg.themeParams.bg_color,
            text_color: tg.themeParams.text_color,
            hint_color: tg.themeParams.hint_color,
            link_color: tg.themeParams.link_color,
            button_color: tg.themeParams.button_color,
            button_text_color: tg.themeParams.button_text_color,
            secondary_bg_color: tg.themeParams.secondary_bg_color,
          },
          initData: tg.initData,
          version: tg.version,
          platform: tg.platform,
          isExpanded: tg.isExpanded,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
          isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
          // Add any other properties you find useful from tg object
        });

        // Force the Next.js theme to match Telegram's color scheme
        setTheme(tg.colorScheme);

        // Set the Telegram Header Color to match your background
        const bgColor = tg.themeParams.bg_color || "#ffffff";
        tg.setHeaderColor(bgColor);
        tg.setBackgroundColor(bgColor);
      };

      // Initial data fetch and theme sync
      updateTgData();

      // Listen for theme changes and update data
      tg.onEvent("themeChanged", () => {
        updateTgData(); // Re-run update to get latest themeParams
      });
    }
  }, [setTheme]);

  if (!tgData) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        در انتظار بارگیری داده‌های Telegram WebApp... (اگر در WebApp تلگرام نیستید، این پیام باقی می‌ماند.)
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">اطلاعات Telegram WebApp</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
        <div>
          <p><strong>Color Scheme:</strong> {tgData.colorScheme}</p>
          <p><strong>Platform:</strong> {tgData.platform}</p>
          <p><strong>Version:</strong> {tgData.version}</p>
          <p><strong>Expanded:</strong> {tgData.isExpanded ? "بله" : "خیر"}</p>
          <p><strong>Viewport Height:</strong> {tgData.viewportHeight?.toFixed(2)}px</p>
          <p><strong>Viewport Stable Height:</strong> {tgData.viewportStableHeight?.toFixed(2)}px</p>
          <p><strong>Closing Confirmation:</strong> {tgData.isClosingConfirmationEnabled ? "فعال" : "غیرفعال"}</p>
        </div>
        <div>
          <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">پارامترهای تم (Theme Params):</h3>
          {tgData.themeParams && (
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(tgData.themeParams).map(([key, value]) => (
                <li key={key}>
                  {key.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase())}:{" "}
                  <span style={{ color: value }}>{value}</span>{" "}
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 align-middle ml-1"
                    style={{ backgroundColor: value }}
                  ></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* You might want to display initData in a more controlled way due to its length and sensitivity */}
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">داده‌های اولیه (Init Data):</h3>
        <p className="text-sm break-all text-gray-600 dark:text-gray-400">
          {tgData.initData ? tgData.initData.substring(0, 200) + '...' : 'موجود نیست'} {/* Show truncated initData */}
        </p>
      </div>
    </div>
  );
}
