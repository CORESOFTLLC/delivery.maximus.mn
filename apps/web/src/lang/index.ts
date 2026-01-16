/**
 * Language/Translation System
 * Supports: mn (Mongolian), en (English), ko (Korean)
 */
import { mn } from './mn';
import { en } from './en';
import { ko } from './ko';

export type Locale = 'mn' | 'en' | 'ko';
export type TranslationKeys = typeof mn;

const translations: Record<Locale, TranslationKeys> = {
  mn,
  en,
  ko,
};

// Default locale
const DEFAULT_LOCALE: Locale = 'mn';
const LOCALE_STORAGE_KEY = 'sales-locale';

/**
 * Get current locale from localStorage
 */
export function getLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && (stored === 'mn' || stored === 'en' || stored === 'ko')) {
    return stored;
  }
  return DEFAULT_LOCALE;
}

/**
 * Set locale to localStorage
 */
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  // Dispatch event for reactivity
  window.dispatchEvent(new CustomEvent('locale-change', { detail: locale }));
}

/**
 * Get translations for a locale
 */
export function getTranslations(locale: Locale = getLocale()): TranslationKeys {
  return translations[locale];
}

/**
 * Get a specific translation with interpolation
 * @example t('products.showingCount', { count: 10 }) => "10 бараа"
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale?: Locale
): string {
  const trans = getTranslations(locale);
  
  // Navigate nested keys like "products.title"
  const keys = key.split('.');
  let value: unknown = trans;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation key is not a string: ${key}`);
    return key;
  }
  
  // Interpolate parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return String(params[paramKey] ?? `{${paramKey}}`);
    });
  }
  
  return value;
}

export { mn, en };
