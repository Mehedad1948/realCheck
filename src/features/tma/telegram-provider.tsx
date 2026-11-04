'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WebApp, WebAppUser } from 'telegram-web-app';
import { setApiAuthorization } from '@/lib/api/client';
import { DATASET_START_PARAM } from '@/lib/telegram';

/**
 * - `pending`: waiting for telegram-web-app.js
 * - `telegram`: running inside Telegram with signed launch data
 * - `dev`: plain browser with NEXT_PUBLIC_TMA_DEV_MOCK=true (the server accepts a mock user)
 * - `browser`: plain browser; only public content works
 */
export type TelegramStatus = 'pending' | 'telegram' | 'dev' | 'browser';

type TelegramContextValue = {
  status: TelegramStatus;
  webApp: WebApp | null;
  user: WebAppUser | null;
  /** True once API calls can be authenticated. */
  canAuthenticate: boolean;
};

const TelegramContext = createContext<TelegramContextValue>({
  status: 'pending',
  webApp: null,
  user: null,
  canAuthenticate: false,
});

const DEV_MOCK = process.env.NEXT_PUBLIC_TMA_DEV_MOCK === 'true' && process.env.NODE_ENV !== 'production';
const SCRIPT_WAIT_MS = 3000;

function setDarkClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function applyChrome(webApp: WebApp) {
  setDarkClass(webApp.colorScheme === 'dark');
  if (webApp.isVersionAtLeast('6.1')) {
    webApp.setHeaderColor('bg_color');
    webApp.setBackgroundColor('bg_color');
  }
  if (webApp.isVersionAtLeast('7.10')) webApp.setBottomBarColor('bg_color');
}

let handledStartParam = false;

export function TelegramProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [value, setValue] = useState<TelegramContextValue>({
    status: 'pending',
    webApp: null,
    user: null,
    canAuthenticate: false,
  });

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    const startedAt = Date.now();

    const init = () => {
      if (cancelled) return;
      const webApp = window.Telegram?.WebApp;
      // The script loads before hydration but doesn't block it, so it may be a beat late.
      if (!webApp && Date.now() - startedAt < SCRIPT_WAIT_MS) {
        setTimeout(init, 50);
        return;
      }

      if (webApp?.initData) {
        setApiAuthorization(() => `tma ${webApp.initData}`);
        webApp.ready();
        webApp.expand();
        // Stops a vertical swipe on the task card from closing the app.
        if (webApp.isVersionAtLeast('7.7')) webApp.disableVerticalSwipes();
        applyChrome(webApp);
        const onTheme = () => applyChrome(webApp);
        webApp.onEvent('themeChanged', onTheme);
        cleanup = () => webApp.offEvent('themeChanged', onTheme);

        setValue({ status: 'telegram', webApp, user: webApp.initDataUnsafe.user ?? null, canAuthenticate: true });

        const match = DATASET_START_PARAM.exec(webApp.initDataUnsafe.start_param ?? '');
        if (match && !handledStartParam) {
          handledStartParam = true;
          router.replace(`/app/tasks/${match[1]}`);
        }
        return;
      }

      // Not inside Telegram: follow the OS theme.
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkClass(media.matches);
      const onChange = (event: MediaQueryListEvent) => setDarkClass(event.matches);
      media.addEventListener('change', onChange);
      cleanup = () => media.removeEventListener('change', onChange);

      if (DEV_MOCK) {
        setApiAuthorization(() => 'tma dev');
        setValue({ status: 'dev', webApp: null, user: null, canAuthenticate: true });
      } else {
        setValue({ status: 'browser', webApp: null, user: null, canAuthenticate: false });
      }
    };

    init();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [router]);

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram() {
  return useContext(TelegramContext);
}

/** Shows Telegram's native back button while mounted. */
export function useBackButton(onBack: () => void) {
  const { webApp } = useTelegram();
  useEffect(() => {
    if (!webApp?.isVersionAtLeast('6.1')) return;
    webApp.BackButton.onClick(onBack);
    webApp.BackButton.show();
    return () => {
      webApp.BackButton.offClick(onBack);
      webApp.BackButton.hide();
    };
  }, [webApp, onBack]);
}

/** Haptic feedback that silently does nothing outside Telegram. */
export const haptics = {
  impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.isVersionAtLeast('6.1')) webApp.HapticFeedback.impactOccurred(style);
  },
  notify(type: 'success' | 'error' | 'warning') {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.isVersionAtLeast('6.1')) webApp.HapticFeedback.notificationOccurred(type);
  },
};
