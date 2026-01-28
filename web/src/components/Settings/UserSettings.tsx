import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLLECTIONS } from '../../shared/firebase.config';
import { SUPPORTED_LANGUAGES } from '../../config/i18n';
import type { LanguageCode } from '../../config/i18n';

type SettingsTab = 'profile' | 'language' | 'notifications' | 'advanced';

const UserSettings: React.FC = () => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Profile data
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Health profile data (read-only display)
  const [healthProfile, setHealthProfile] = useState<any>(null);

  // Language settings
  const [interfaceLanguage, setInterfaceLanguage] = useState<LanguageCode>(currentLanguage);
  const [chatLanguage, setChatLanguage] = useState<LanguageCode>(currentLanguage);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    doctorResponses: true,
    healthReminders: true,
    promotionalEmails: false,
  });

  // Advanced settings
  const [advanced, setAdvanced] = useState({
    dataSharing: true,
    analytics: true,
    autoSaveChats: true,
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // Load user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            displayName: data.displayName || user.displayName || '',
            phone: data.phone || '',
            dateOfBirth: data.dateOfBirth || '',
            address: data.address || '',
            emergencyContact: data.emergencyContact || '',
            emergencyPhone: data.emergencyPhone || '',
          });
          if (data.chatLanguage) {
            setChatLanguage(data.chatLanguage);
          }
          if (data.notifications) {
            setNotifications(prev => ({ ...prev, ...data.notifications }));
          }
          if (data.advanced) {
            setAdvanced(prev => ({ ...prev, ...data.advanced }));
          }
        }

        // Load health profile
        const healthDoc = await getDoc(doc(db, COLLECTIONS.HEALTH_PROFILES, user.uid));
        if (healthDoc.exists()) {
          setHealthProfile(healthDoc.data());
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        emergencyContact: profile.emergencyContact,
        emergencyPhone: profile.emergencyPhone,
        updatedAt: new Date(),
      });
      setSaveMessage(t('settings.saved'));
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLanguage = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update interface language via context
      await setLanguage(interfaceLanguage);

      // Save chat language preference to Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        chatLanguage: chatLanguage,
        updatedAt: new Date(),
      });

      setSaveMessage(t('settings.saved'));
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving language settings:', err);
      setSaveMessage(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notifications,
        updatedAt: new Date(),
      });
      setSaveMessage(t('settings.saved'));
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving notifications:', err);
      setSaveMessage(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdvanced = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        advanced,
        updatedAt: new Date(),
      });
      setSaveMessage(t('settings.saved'));
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving advanced settings:', err);
      setSaveMessage(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: t('settings.tabs.profile'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'language',
      label: t('settings.tabs.language'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: t('settings.tabs.notifications'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'advanced',
      label: t('settings.tabs.advanced'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-green-100 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{t('settings.title')}</h1>
          </div>
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Account Info (Read-only) */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('settings.profile.accountInfo')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-500">{t('settings.profile.email')}</label>
                      <p className="text-gray-900 font-medium">{user?.email}</p>
                    </div>
                    {healthProfile && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                        <div>
                          <label className="block text-sm text-gray-500">{t('settings.profile.age')}</label>
                          <p className="text-gray-900">{healthProfile.age} years old</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500">{t('settings.profile.sex')}</label>
                          <p className="text-gray-900 capitalize">{healthProfile.sex}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable Profile Fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {t('settings.profile.personalInfo')}
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings.profile.displayName')}
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder={t('settings.profile.displayNamePlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings.profile.phone')}
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings.profile.dateOfBirth')}
                      </label>
                      <input
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings.profile.address')}
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder={t('settings.profile.addressPlaceholder')}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {t('settings.profile.emergencyContact')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings.profile.contactName')}
                      </label>
                      <input
                        type="text"
                        value={profile.emergencyContact}
                        onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder={t('settings.profile.contactNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings.profile.contactPhone')}
                      </label>
                      <input
                        type="tel"
                        value={profile.emergencyPhone}
                        onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? t('settings.saving') : t('settings.saveChanges')}
                </button>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                {/* Interface Language */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('settings.language.interfaceTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('settings.language.interfaceDescription')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setInterfaceLanguage(lang.code)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          interfaceLanguage === lang.code
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-lg font-medium">{lang.nativeName}</span>
                        <span className="block text-xs text-gray-500">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Language */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('settings.language.chatTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('settings.language.chatDescription')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setChatLanguage(lang.code)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          chatLanguage === lang.code
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="block text-lg font-medium">{lang.nativeName}</span>
                        <span className="block text-xs text-gray-500">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveLanguage}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? t('settings.saving') : t('settings.saveChanges')}
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: t('settings.notifications.email'), description: t('settings.notifications.emailDesc') },
                    { key: 'pushNotifications', label: t('settings.notifications.push'), description: t('settings.notifications.pushDesc') },
                    { key: 'doctorResponses', label: t('settings.notifications.doctorResponses'), description: t('settings.notifications.doctorResponsesDesc') },
                    { key: 'healthReminders', label: t('settings.notifications.healthReminders'), description: t('settings.notifications.healthRemindersDesc') },
                    { key: 'promotionalEmails', label: t('settings.notifications.promotional'), description: t('settings.notifications.promotionalDesc') },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications] ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            notifications[item.key as keyof typeof notifications] ? 'start-6' : 'start-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? t('settings.saving') : t('settings.saveChanges')}
                </button>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    { key: 'dataSharing', label: t('settings.advanced.dataSharing'), description: t('settings.advanced.dataSharingDesc') },
                    { key: 'analytics', label: t('settings.advanced.analytics'), description: t('settings.advanced.analyticsDesc') },
                    { key: 'autoSaveChats', label: t('settings.advanced.autoSave'), description: t('settings.advanced.autoSaveDesc') },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => setAdvanced({ ...advanced, [item.key]: !advanced[item.key as keyof typeof advanced] })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          advanced[item.key as keyof typeof advanced] ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            advanced[item.key as keyof typeof advanced] ? 'start-6' : 'start-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Health Profile Link */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('settings.advanced.healthProfile')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('settings.advanced.healthProfileDesc')}
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('settings.advanced.editHealthProfile')}
                  </button>
                </div>

                <button
                  onClick={handleSaveAdvanced}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? t('settings.saving') : t('settings.saveChanges')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
