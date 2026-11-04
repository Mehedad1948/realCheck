'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

type ParamValue = string | number | boolean | null | undefined;

// Fired after programmatic changes, since replaceState doesn't emit `hashchange`.
const CHANGE_EVENT = 'hash-params-changed';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeHash(params: URLSearchParams) {
  const hash = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Reads and writes `#key=value` state in the URL, shared by every component using it. */
export function useHashParams() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => '',
  );

  const hashParams = useMemo(() => Object.fromEntries(new URLSearchParams(hash)), [hash]);

  const setHashParams = useCallback((next: Record<string, ParamValue>) => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === undefined || value === '' || value === false) params.delete(key);
      else params.set(key, String(value));
    }
    writeHash(params);
  }, []);

  const clearHashParams = useCallback(() => writeHash(new URLSearchParams()), []);

  return { hashParams, setHashParams, clearHashParams };
}
