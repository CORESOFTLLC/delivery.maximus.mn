/**
 * useTranslation hook
 * React hook for accessing translations with reactivity
 */
'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getLocale, setLocale, getTranslations, t, type Locale, type TranslationKeys } from '@/lang';

// Store for locale state
let currentLocale: Locale = 'mn';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentLocale;
}

function getServerSnapshot() {
  return 'mn' as Locale;
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

// Initialize on client
if (typeof window !== 'undefined') {
  currentLocale = getLocale();
  
  // Listen for locale changes
  window.addEventListener('locale-change', (e: Event) => {
    const customEvent = e as CustomEvent<Locale>;
    currentLocale = customEvent.detail;
    notifyListeners();
  });
}

/**
 * Hook for translations with automatic re-render on locale change
 */
export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const translations = getTranslations(locale);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return t(key, params, locale);
    },
    [locale]
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    currentLocale = newLocale;
    setLocale(newLocale);
    notifyListeners();
  }, []);

  return {
    t: translate,
    locale,
    setLocale: changeLocale,
    translations,
  };
}

/**
 * Hook for locale only (lighter weight)
 */
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const changeLocale = useCallback((newLocale: Locale) => {
    currentLocale = newLocale;
    setLocale(newLocale);
    notifyListeners();
  }, []);

  return {
    locale,
    setLocale: changeLocale,
    isMongolaian: locale === 'mn',
    isEnglish: locale === 'en',
  };
}
