import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import { useTranslation } from 'react-i18next';

const ConsentForm: React.FC = () => {
  const { t } = useTranslation('consent');
  const [hipaaConsent, setHipaaConsent] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hipaaConsent || !gdprConsent || !dataConsent) {
      setError(t('errors.mustAgree'));
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Save consent to Firestore
      await setDoc(doc(db, COLLECTIONS.CONSENTS, user.uid), {
        userId: user.uid,
        hipaaConsent,
        gdprConsent,
        dataCollectionConsent: dataConsent,
        consentDate: new Date(),
      });

      // Redirect to intake form
      navigate('/intake');
    } catch (err: any) {
      setError(t('errors.saveFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen calm-gradient py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 mb-8">
          {t('subtitle')}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HIPAA Consent */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="hipaa"
                checked={hipaaConsent}
                onChange={(e) => setHipaaConsent(e.target.checked)}
                className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="ms-3">
                <label htmlFor="hipaa" className="font-semibold text-gray-900 cursor-pointer">
                  {t('hipaa.title')}
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  {t('hipaa.description')}
                </p>
              </div>
            </div>
          </div>

          {/* GDPR Consent */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="gdpr"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="ms-3">
                <label htmlFor="gdpr" className="font-semibold text-gray-900 cursor-pointer">
                  {t('gdpr.title')}
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  {t('gdpr.description')}
                </p>
              </div>
            </div>
          </div>

          {/* Data Collection Consent */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="data"
                checked={dataConsent}
                onChange={(e) => setDataConsent(e.target.checked)}
                className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="ms-3">
                <label htmlFor="data" className="font-semibold text-gray-900 cursor-pointer">
                  {t('dataCollection.title')}
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  {t('dataCollection.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-calm-50 border border-calm-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>{t('privacyNotice.title')}</strong> {t('privacyNotice.description')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !hipaaConsent || !gdprConsent || !dataConsent}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('saving') : t('button')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConsentForm;
