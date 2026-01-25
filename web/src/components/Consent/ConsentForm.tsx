import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';

const ConsentForm: React.FC = () => {
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
      setError('You must agree to all consents to continue');
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
      setError('Failed to save consent. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen calm-gradient py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy & Consent</h1>
        <p className="text-gray-600 mb-8">
          Before we continue, please review and accept our privacy policies.
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
              <div className="ml-3">
                <label htmlFor="hipaa" className="font-semibold text-gray-900 cursor-pointer">
                  HIPAA Privacy Notice
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  I understand that my health information will be stored securely and encrypted in
                  compliance with HIPAA regulations. My data will only be used to provide me with
                  health guidance and will never be shared without my explicit consent.
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
              <div className="ml-3">
                <label htmlFor="gdpr" className="font-semibold text-gray-900 cursor-pointer">
                  GDPR Data Protection
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  I acknowledge my rights under GDPR, including the right to access, correct, and
                  delete my personal data at any time. I can withdraw this consent at any time by
                  deleting my account.
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
              <div className="ml-3">
                <label htmlFor="data" className="font-semibold text-gray-900 cursor-pointer">
                  Data Collection & Usage
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  I consent to HeyDoc collecting and processing my health information, including
                  symptoms, medical history, and chat conversations, solely for the purpose of
                  providing personalized health guidance and natural remedy recommendations.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-calm-50 border border-calm-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Your Privacy Matters:</strong> All your health data is encrypted end-to-end.
              We use bank-level security to protect your information. You can request to view,
              export, or delete your data at any time.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !hipaaConsent || !gdprConsent || !dataConsent}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'I Agree - Continue to Health Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConsentForm;
