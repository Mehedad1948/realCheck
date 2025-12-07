'use client';

import { useCallback, useEffect, useState } from 'react';

type ParamValue = string | number | boolean | null | undefined;
type InputType = Record<string, ParamValue>;

export function useHashParams() {
  const [hashParams, setHashParamsState] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Helper: Parse the current hash into a simple object
  const getHashSearchParams = useCallback((): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    
    const hashString = window.location.hash.slice(1); 
    const params = new URLSearchParams(hashString);
    
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }, []);

  // 1. Subscribe to changes
  useEffect(() => {
    setIsMounted(true);
    
    // Set initial state
    setHashParamsState(getHashSearchParams());

    const handleHashChange = () => {
      setHashParamsState(getHashSearchParams());
    };

    // Listen for native browser navigation (Back/Forward buttons)
    window.addEventListener('hashchange', handleHashChange);
    
    // Listen for CUSTOM events dispatched by our hook (Programmatic changes)
    window.addEventListener('hash-params-changed', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('hash-params-changed', handleHashChange);
    };
  }, [getHashSearchParams]);

  /**
   * Updates the hash parameters and notifies all other hook instances.
   */
  const setHashParams = useCallback((newParams: InputType) => {
    if (typeof window === 'undefined') return;

    const currentParams = new URLSearchParams(window.location.hash.slice(1));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(value));
      }
    });

    const newHash = currentParams.toString();
    const newUrl = `${window.location.pathname}${window.location.search}${newHash ? `#${newHash}` : ''}`;

    // 1. Update URL
    window.history.replaceState(null, '', newUrl);

    // 2. IMPORTANT: Dispatch a custom event to notify other components (like the Modal)
    window.dispatchEvent(new Event('hash-params-changed'));
    
  }, []);

  const clearHashParams = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new Event('hash-params-changed')); // Notify others
  }, []);

  return { 
    hashParams: isMounted ? hashParams : {}, 
    setHashParams, 
    clearHashParams 
  };
}
