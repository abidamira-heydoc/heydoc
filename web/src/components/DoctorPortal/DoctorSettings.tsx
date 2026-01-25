import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';

interface NotificationSettings {
  emailNewCase: boolean;
  emailCaseAssigned: boolean;
  emailPayoutSent: boolean;
  emailWeeklyDigest: boolean;
  pushNewCase: boolean;
  pushMessages: boolean;
}

const defaultSettings: NotificationSettings = {
  emailNewCase: true,
  emailCaseAssigned: true,
  emailPayoutSent: true,
  emailWeeklyDigest: true,
  pushNewCase: true,
  pushMessages: true,
};

const DoctorSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));
        if (doctorDoc.exists()) {
          const data = doctorDoc.data();
          if (data.notificationSettings) {
            setSettings({ ...defaultSettings, ...data.notificationSettings });
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateDoc(doc(db, COLLECTIONS.DOCTORS, user.uid), {
        notificationSettings: settings,
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/doctor/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your notification preferences and account</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700">Settings saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
            <p className="text-sm text-gray-500">Choose which emails you'd like to receive</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="font-medium text-gray-900">New Case Available</p>
              <p className="text-sm text-gray-500">Get notified when a new case is added to your queue</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('emailNewCase')}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.emailNewCase ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                settings.emailNewCase ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="font-medium text-gray-900">Case Assigned</p>
              <p className="text-sm text-gray-500">Notification when a priority case is assigned to you</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('emailCaseAssigned')}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.emailCaseAssigned ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                settings.emailCaseAssigned ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="font-medium text-gray-900">Payout Sent</p>
              <p className="text-sm text-gray-500">Confirmation when your weekly payout is processed</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('emailPayoutSent')}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.emailPayoutSent ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                settings.emailPayoutSent ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="font-medium text-gray-900">Weekly Digest</p>
              <p className="text-sm text-gray-500">Summary of your weekly cases and earnings</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('emailWeeklyDigest')}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.emailWeeklyDigest ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                settings.emailWeeklyDigest ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
            <p className="text-sm text-gray-500">Real-time alerts on your device</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="font-medium text-gray-900">New Cases</p>
              <p className="text-sm text-gray-500">Instant notification when cases become available</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('pushNewCase')}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.pushNewCase ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                settings.pushNewCase ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="font-medium text-gray-900">Patient Messages</p>
              <p className="text-sm text-gray-500">Alert when a patient sends you a message</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('pushMessages')}
              className={`relative w-12 h-6 rounded-full transition ${
                settings.pushMessages ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                settings.pushMessages ? 'left-7' : 'left-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>

        <div className="space-y-4">
          {/* Stripe Dashboard Link */}
          <a
            href="https://dashboard.stripe.com/express"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Stripe Dashboard</p>
                <p className="text-sm text-gray-500">Manage payouts, view 1099 forms</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Help & Support */}
          <a
            href="mailto:support@heydoccare.com"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Help & Support</p>
                <p className="text-sm text-gray-500">Contact us with questions or issues</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-red-700">Sign Out</p>
                <p className="text-sm text-red-500">Log out of your account</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out?</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSettings;
