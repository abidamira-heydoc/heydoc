import React from 'react';
import { useTranslation } from 'react-i18next';

const EmergencyBanner: React.FC = () => {
  const { t } = useTranslation('emergency');

  return (
    <div className="bg-emergency-600 text-white px-6 py-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ms-4 flex-1">
            <h3 className="text-xl font-bold mb-2">⚠️ {t('banner.title')}</h3>
            <p className="text-lg mb-3">
              {t('banner.subtitle')}
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
              <p className="font-semibold mb-2">{t('banner.actionTitle')}</p>
              <ul className="space-y-1 text-sm">
                <li>🚨 {t('banner.actions.call911')}</li>
                <li>📍 {t('banner.actions.goToER')}</li>
                <li>👥 {t('banner.actions.stayWithSomeone')}</li>
                <li>💊 {t('banner.actions.noSelfTreat')}</li>
              </ul>
            </div>
            <p className="text-sm opacity-90">
              {t('banner.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;
