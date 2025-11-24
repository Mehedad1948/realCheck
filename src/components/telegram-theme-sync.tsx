"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// 1. تعریف Interfaceها برای ThemeParams و TelegramWebAppInfo
interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  // اگر پارامترهای دیگری دارید، اینجا اضافه کنید
}

interface TelegramWebAppInfo {
  colorScheme?: string;
  themeParams?: ThemeParams; // themeParams می‌تواند undefined باشد
  initData?: string;
  version?: string;
  platform?: string;
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isClosingConfirmationEnabled?: boolean;
  // سایر خصوصیات مرتبط با Telegram.WebApp
}

export function TelegramThemeSync() {
  const { setTheme } = useTheme();
  // 2. استفاده از Interface در useState
  const [tgData, setTgData] = useState<TelegramWebAppInfo | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      const updateTgData = () => {
        // ساخت یک شیء ThemeParams با تایپ مشخص
        // اطمینان حاصل می‌کنیم که themeParams همیشه یک شیء معتبر باشد
        const currentThemeParams: ThemeParams = {
          bg_color: tg.themeParams?.bg_color,
          text_color: tg.themeParams?.text_color,
          hint_color: tg.themeParams?.hint_color,
          link_color: tg.themeParams?.link_color,
          button_color: tg.themeParams?.button_color,
          button_text_color: tg.themeParams?.button_text_color,
          secondary_bg_color: tg.themeParams?.secondary_bg_color,
        };

        setTgData({
          colorScheme: tg.colorScheme,
          themeParams: currentThemeParams, // انتساب شیء تایپ‌شده
          initData: tg.initData,
          version: tg.version,
          platform: tg.platform,
          isExpanded: tg.isExpanded,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
          isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
        });

        // setTheme(tg.colorScheme || 'light'); // می‌توانید یک مقدار پیش‌فرض هم بدهید
        if (tg.colorScheme) {
          setTheme(tg.colorScheme);
        }

        const bgColor = tg.themeParams?.bg_color || "#ffffff"; // استفاده از ?. برای ایمنی
        tg.setHeaderColor(bgColor);
        tg.setBackgroundColor(bgColor);
      };

      updateTgData();

      tg.onEvent("themeChanged", () => {
        updateTgData();
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
          <p><strong>Color Scheme:</strong> {tgData.colorScheme || "نامشخص"}</p>
          <p><strong>Platform:</strong> {tgData.platform || "نامشخص"}</p>
          <p><strong>Version:</strong> {tgData.version || "نامشخص"}</p>
          <p><strong>Expanded:</strong> {tgData.isExpanded ? "بله" : "خیر"}</p>
          <p><strong>Viewport Height:</strong> {tgData.viewportHeight?.toFixed(2) || "نامشخص"}px</p>
          <p><strong>Viewport Stable Height:</strong> {tgData.viewportStableHeight?.toFixed(2) || "نامشخص"}px</p>
          <p><strong>Closing Confirmation:</strong> {tgData.isClosingConfirmationEnabled ? "فعال" : "غیرفعال"}</p>
        </div>
        <div>
          <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">پارامترهای تم (Theme Params):</h3>
          {/* اطمینان حاصل کنید که tgData.themeParams undefined نیست */}
          {tgData.themeParams && (
            <ul className="list-disc list-inside space-y-1">
              {/* حل مشکل TypeScript با استفاده از Object.keys و Type Assertion */}
              {(Object.keys(tgData.themeParams) as Array<keyof ThemeParams>).map((key) => {
                const value = tgData.themeParams?.[key]; // استفاده از ?. برای ایمنی در برابر undefined

                // فقط نمایش دادن پارامترهایی که مقدار دارند
                if (value === undefined) {
                  return null;
                }

                return (
                  <li key={key}>
                    {key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}:{" "}
                    <span style={{ color: value }}>{value}</span>{" "}
                    <span
                      className="inline-block w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 align-middle ml-1"
                      style={{ backgroundColor: value }}
                    ></span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">داده‌های اولیه (Init Data):</h3>
        <p className="text-sm break-all text-gray-600 dark:text-gray-400">
          {tgData.initData ? tgData.initData.substring(0, 200) + "..." : "موجود نیست"}
        </p>
      </div>
    </div>
  );
}
