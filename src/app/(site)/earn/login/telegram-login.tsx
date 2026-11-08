'use client';

import { Loader2, Send } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Cta } from '@/components/site/cta';

const ERRORS: Record<string, string> = {
  expired: 'That sign-in link expired. Please try again.',
  invalid: 'We couldn’t verify your Telegram sign-in. Please try again.',
  'not-evaluator': 'This Telegram account belongs to a team account and can’t label tasks.',
  unavailable: 'Telegram sign-in isn’t set up on this server yet.',
  server: 'Something went wrong. Please try again.',
  script: 'Couldn’t reach Telegram. Check your connection and reload the page.',
};

const WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22';

type AuthData = Record<string, string | number>;
type TelegramLoginApi = {
  auth(options: { bot_id: string; request_access?: 'write' }, callback: (data: AuthData | false) => void): void;
  init(options: { bot_id: string; request_access?: 'write' }, callback: (data: AuthData | false) => void): void;
};

// window.Telegram is already typed for the Mini App, which knows nothing of the login API.
function loginApi() {
  return (window as unknown as { Telegram?: { Login?: TelegramLoginApi } }).Telegram?.Login;
}

/**
 * Sign in with Telegram, drawn as our own button. Telegram's widget script still runs the flow: it
 * opens Telegram's confirmation popup and hands back the signed profile, which goes to
 * /api/auth/telegram as query parameters, exactly as the widget's own button would send it.
 */
export function TelegramLogin({ botId }: { botId: string | undefined }) {
  const error = useSearchParams().get('error');
  const [status, setStatus] = useState<'loading' | 'ready' | 'waiting' | 'failed'>('loading');

  // The popup must open within the click, so the script is loaded ahead of time.
  useEffect(() => {
    if (!botId) return;
    const ready = () => {
      setStatus('ready');
      // A phone browser may run the popup as a full-page redirect; pick up its #tgAuthResult.
      loginApi()?.init({ bot_id: botId, request_access: 'write' }, (data) => data && signIn(data));
    };
    if (loginApi()) return ready();
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = ready;
    script.onerror = () => setStatus('failed');
    document.head.appendChild(script);
  }, [botId]);

  function open() {
    const login = loginApi();
    if (!botId || !login) return;
    setStatus('waiting');
    login.auth({ bot_id: botId, request_access: 'write' }, (data) => {
      if (data) signIn(data);
      else setStatus('ready');
    });
  }

  if (!botId) {
    return <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{ERRORS.unavailable}</p>;
  }

  const message = status === 'failed' ? ERRORS.script : error && (ERRORS[error] ?? ERRORS.server);
  return (
    <div className="space-y-5">
      {message && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      )}
      {/* Not disabled while waiting: if the browser blocked the popup, clicking again retries. */}
      <Cta
        tone="telegram"
        className="w-full"
        badge={<Send />}
        icon={status === 'waiting' ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : undefined}
        disabled={status === 'loading' || status === 'failed'}
        onClick={open}
      >
        Continue with Telegram
      </Cta>
    </div>
  );
}

function signIn(data: AuthData) {
  const params = new URLSearchParams(Object.entries(data).map(([key, value]) => [key, String(value)]));
  // A full page load, not router.push: the route handler sets the session cookie and redirects.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/api/auth/telegram?${params}`);
}
