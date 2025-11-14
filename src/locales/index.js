import en from './en.json';
import es from './es.json';
import fr from './fr.json';

export const messages = {
  en,
  es,
  fr
};

export const availableLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

export const defaultLocale = 'en';
export const fallbackLocale = 'en';
