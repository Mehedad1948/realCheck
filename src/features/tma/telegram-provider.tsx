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
 * - `web`: the website's evaluator workspace (/earn), signed in with Telegram; the session cookie authenticates
 */
export type TelegramStatus = 'pending' | 'telegram' | 'dev' | 'browser' | 'web';

type TelegramContextValue = {
  status: TelegramStatus;
  webApp: WebApp | null;
  user: WebAppUser | null;
  /** True once API calls can be authenticated. */
  canAuthenticate: boolean;
  /** Where the evaluator screens live: /app in the Mini App, /earn on the website. */
  basePath: string;
};

const MINI_APP_PATH = '/app';

const TelegramContext = createContext<TelegramContextValue>({
  status: 'pending',
  webApp: null,
  user: null,
  canAuthenticate: false,
  basePath: MINI_APP_PATH,
});

const DEV_MOCK = process.env.NEXT_PUBLIC_TMA_DEV_MOCK === 'true' && process.env.NODE_ENV !== 'production';
const SCRIPT_WAIT_MS = 3000;

function setDarkClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function applyChrome(webApp: WebApp) {
  setDarkClass(webApp.colorScheme === 'dark');
  // Paint Telegram's header and bottom bar in the app's own page color (from globals.css), so the
  // brand canvas runs edge to edge. Older clients only take theme keywords for the header.
  const background = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() as `#${string}`;
  if (webApp.isVersionAtLeast('6.9')) webApp.setHeaderColor(background);
  else if (webApp.isVersionAtLeast('6.1')) webApp.setHeaderColor('bg_color');
  if (webApp.isVersionAtLeast('6.1')) webApp.setBackgroundColor(background);
  if (webApp.isVersionAtLeast('7.10')) webApp.setBottomBarColor(background);
}

/** Brand colors for Telegram's native bottom button, so it matches the in-app buttons. */
const MAIN_BUTTON_COLORS = { color: '#4f46e5', text_color: '#ffffff' } as const;

let handledStartParam = false;

export function TelegramProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [value, setValue] = useState<TelegramContextValue>({
    status: 'pending',
    webApp: null,
    user: null,
    canAuthenticate: false,
    basePath: MINI_APP_PATH,
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

        setValue({ status: 'telegram', webApp, user: webApp.initDataUnsafe.user ?? null, canAuthenticate: true, basePath: MINI_APP_PATH });

        const match = DATASET_START_PARAM.exec(webApp.initDataUnsafe.start_param ?? '');
        if (match && !handledStartParam) {
          handledStartParam = true;
          router.replace(`${MINI_APP_PATH}/tasks/${match[1]}`);
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
        setValue({ status: 'dev', webApp: null, user: null, canAuthenticate: true, basePath: MINI_APP_PATH });
      } else {
        setValue({ status: 'browser', webApp: null, user: null, canAuthenticate: false, basePath: MINI_APP_PATH });
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

const WEB_VALUE: TelegramContextValue = { status: 'web', webApp: null, user: null, canAuthenticate: true, basePath: '/earn' };

/**
 * Lets the Mini App's screens run on the website. The page is already signed in (the session cookie
 * goes with every API call), and Telegram's native controls fall back to in-page ones as they do in
 * a plain browser. The theme stays with the website's toggle.
 */
export function WebEvaluatorProvider({ children }: { children: ReactNode }) {
  return <TelegramContext.Provider value={WEB_VALUE}>{children}</TelegramContext.Provider>;
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

type MainButtonOptions = {
  text: string;
  onClick: () => void;
  visible?: boolean;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Drives Telegram's native bottom button while mounted. Returns true when it is in
 * use, so the page can hide its own fallback button.
 */
export function useMainButton({ text, onClick, visible = true, loading = false, disabled = false }: MainButtonOptions) {
  const { webApp } = useTelegram();
  const supported = Boolean(webApp?.isVersionAtLeast('6.1'));

  useEffect(() => {
    if (!supported || !webApp) return;
    const button = webApp.MainButton;
    button.onClick(onClick);
    return () => {
      button.offClick(onClick);
    };
  }, [supported, webApp, onClick]);

  useEffect(() => {
    if (!supported || !webApp) return;
    const button = webApp.MainButton;
    button.setParams({
      text,
      ...MAIN_BUTTON_COLORS,
      is_visible: visible,
      is_active: !disabled && !loading,
      ...(webApp.isVersionAtLeast('7.10') ? { has_shine_effect: visible && !disabled && !loading } : {}),
    });
    if (loading) button.showProgress(false);
    else button.hideProgress();
  }, [supported, webApp, text, visible, loading, disabled]);

  useEffect(() => {
    if (!supported || !webApp) return;
    return () => {
      webApp.MainButton.hideProgress();
      webApp.MainButton.hide();
    };
  }, [supported, webApp]);

  return supported && visible;
}

/** Haptic feedback that silently does nothing outside Telegram. */
export const haptics = {
  selection() {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.isVersionAtLeast('6.1')) webApp.HapticFeedback.selectionChanged();
  },
  impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.isVersionAtLeast('6.1')) webApp.HapticFeedback.impactOccurred(style);
  },
  notify(type: 'success' | 'error' | 'warning') {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.isVersionAtLeast('6.1')) webApp.HapticFeedback.notificationOccurred(type);
  },
};
