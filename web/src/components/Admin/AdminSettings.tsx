import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';

const AdminSettings: React.FC = () => {
  const { t } = useTranslation('admin');
  const { organization, adminUser } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.description')}</p>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.general.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.general.orgName')}
            </label>
            <input
              type="text"
              value={organization?.name || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">{t('settings.general.orgNameHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.general.inviteCode')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={organization?.code || ''}
                disabled
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 font-mono"
              />
              <button
                onClick={() => {
                  if (organization?.code) {
                    navigator.clipboard.writeText(organization.code);
                    alert(t('settings.general.inviteCodeCopied'));
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={t('settings.general.copyInviteCode')}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.general.orgType')}
            </label>
            <input
              type="text"
              value={organization?.type ? organization.type.charAt(0).toUpperCase() + organization.type.slice(1).replace('_', ' ') : ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.general.status')}
            </label>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${organization?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-500">{organization?.isActive ? t('settings.general.active') : t('settings.general.inactive')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.adminAccount.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.adminAccount.emailAddress')}
            </label>
            <input
              type="email"
              value={adminUser?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.adminAccount.role')}
            </label>
            <input
              type="text"
              value={t('settings.adminAccount.administrator')}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.notifications.title')}</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-not-allowed opacity-60">
            <div>
              <p className="font-medium text-gray-900">{t('settings.notifications.emergencyAlerts')}</p>
              <p className="text-sm text-gray-500">{t('settings.notifications.emergencyAlertsDesc')}</p>
            </div>
            <input
              type="checkbox"
              disabled
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-not-allowed opacity-60">
            <div>
              <p className="font-medium text-gray-900">{t('settings.notifications.weeklyReports')}</p>
              <p className="text-sm text-gray-500">{t('settings.notifications.weeklyReportsDesc')}</p>
            </div>
            <input
              type="checkbox"
              disabled
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-not-allowed opacity-60">
            <div>
              <p className="font-medium text-gray-900">{t('settings.notifications.newUserNotifications')}</p>
              <p className="text-sm text-gray-500">{t('settings.notifications.newUserNotificationsDesc')}</p>
            </div>
            <input
              type="checkbox"
              disabled
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          {t('settings.notifications.comingSoon')}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">{t('settings.dangerZone.title')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">{t('settings.dangerZone.exportData')}</p>
              <p className="text-sm text-red-700">{t('settings.dangerZone.exportDataDesc')}</p>
            </div>
            <button
              disabled
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('settings.dangerZone.export')}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">{t('settings.dangerZone.deleteOrg')}</p>
              <p className="text-sm text-red-700">{t('settings.dangerZone.deleteOrgDesc')}</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('settings.dangerZone.delete')}
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm text-red-400">
          {t('settings.dangerZone.contactSupport')}
        </p>
      </div>

      {/* Implementation Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">{t('settings.implementation.title')}</p>
            <p className="text-sm text-blue-700 mt-1">
              {t('settings.implementation.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
