'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const ERRORS: Record<string, string> = {
  expired: 'That sign-in link expired. Please try again.',
  invalid: 'We couldn’t verify your Telegram sign-in. Please try again.',
  'not-evaluator': 'This Telegram account belongs to a team account and can’t label tasks.',
  unavailable: 'Telegram sign-in isn’t set up on this server yet.',
  server: 'Something went wrong. Please try again.',
};

/**
 * Telegram's Login Widget. Its script draws the button where it is inserted, so it is added by hand
 * rather than rendered. After the evaluator confirms in Telegram, the widget sends them to
 * /api/auth/telegram with the signed profile.
 */
export function TelegramLogin({ botUsername }: { botUsername: string | undefined }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const error = useSearchParams().get('error');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !botUsername) return;
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.dataset.telegramLogin = botUsername.replace(/^@/, '');
    script.dataset.size = 'large';
    script.dataset.radius = '999';
    script.dataset.authUrl = `${window.location.origin}/api/auth/telegram`;
    script.dataset.requestAccess = 'write';
    container.appendChild(script);
    return () => container.replaceChildren();
  }, [botUsername]);

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERRORS[error] ?? ERRORS.server}
        </p>
      )}
      {botUsername ? (
        // Reserves the widget's height so the page doesn't jump when it loads.
        <div ref={containerRef} className="flex min-h-10 justify-center" />
      ) : (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{ERRORS.unavailable}</p>
      )}
    </div>
  );
}
