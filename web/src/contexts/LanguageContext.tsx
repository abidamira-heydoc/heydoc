import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../shared/firebase.config';
import { useAuth } from './AuthContext';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  isRTLLanguage,
  getLanguageConfig,
} from '../config/i18n';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  isRTL: boolean;
  hasSelectedLanguage: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  loading: boolean;
}

const LANGUAGE_STORAGE_KEY = 'heydoc-language';
const LANGUAGE_SELECTED_KEY = 'heydoc-language-selected';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  // Initialize from localStorage or i18n detected language
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && getLanguageConfig(stored)) {
      return stored as LanguageCode;
    }
    return (i18n.language?.split('-')[0] as LanguageCode) || 'en';
  });

  // Check if user has previously selected a language
  useEffect(() => {
    const selected = localStorage.getItem(LANGUAGE_SELECTED_KEY);
    setHasSelectedLanguage(selected === 'true');
    setLoading(false);
  }, []);

  // Apply RTL direction to document
  useEffect(() => {
    const isRTL = isRTLLanguage(currentLanguage);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // Sync with i18n
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    // Validate language code
    if (!getLanguageConfig(code)) {
      console.error(`Unsupported language code: ${code}`);
      return;
    }

    // Update state
    setCurrentLanguage(code);

    // Update localStorage
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    localStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
    setHasSelectedLanguage(true);

    // Update i18n
    await i18n.changeLanguage(code);

    // Update Firestore if user is logged in
    if (user) {
      try {
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        await updateDoc(userRef, {
          preferredLanguage: code,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to save language preference to Firestore:', error);
        // Don't throw - local storage still works
      }
    }
  }, [user, i18n]);

  const isRTL = isRTLLanguage(currentLanguage);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isRTL,
    hasSelectedLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    loading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
