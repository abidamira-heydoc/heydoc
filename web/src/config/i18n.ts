import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Supported language codes
export type LanguageCode = 'en' | 'es' | 'ar' | 'zh' | 'hi' | 'ur' | 'fr' | 'pt' | 'vi' | 'ko';

// Language configuration with native names and direction
export interface LanguageConfig {
  code: LanguageCode;
  name: string;        // English name
  nativeName: string;  // Native name
  dir: 'ltr' | 'rtl';  // Text direction
}

// All supported languages
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
];

// RTL language codes
export const RTL_LANGUAGES: LanguageCode[] = ['ar', 'ur'];

// Helper to check if a language is RTL
export const isRTLLanguage = (code: string): boolean => {
  return RTL_LANGUAGES.includes(code as LanguageCode);
};

// Get language config by code
export const getLanguageConfig = (code: string): LanguageConfig | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

// Translation namespaces
export const NAMESPACES = [
  'common',    // Buttons, navigation, general UI
  'chat',      // Chat interface
  'intake',    // Health intake form
  'auth',      // Login/signup
  'emergency', // Critical safety messages
  'admin',     // Admin portal
  'doctor',    // Doctor portal
] as const;

export type Namespace = typeof NAMESPACES[number];

// Default namespace
export const DEFAULT_NS: Namespace = 'common';

// Initialize i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
    defaultNS: DEFAULT_NS,
    ns: [...NAMESPACES],

    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Detection configuration
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'heydoc-language',
    },

    // React configuration
    react: {
      useSuspense: true,
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
  });

export default i18n;
