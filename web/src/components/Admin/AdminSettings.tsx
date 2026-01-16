import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const AdminSettings: React.FC = () => {
  const { organization, adminUser } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization settings</p>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={organization?.name || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">Contact support to change organization name</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
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
                    alert('Invite code copied to clipboard!');
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Copy invite code"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Type
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
              Status
            </label>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${organization?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-500">{organization?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
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
              Role
            </label>
            <input
              type="text"
              value="Administrator"
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-not-allowed opacity-60">
            <div>
              <p className="font-medium text-gray-900">Emergency Alerts</p>
              <p className="text-sm text-gray-500">Receive email when emergency is detected</p>
            </div>
            <input
              type="checkbox"
              disabled
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-not-allowed opacity-60">
            <div>
              <p className="font-medium text-gray-900">Weekly Reports</p>
              <p className="text-sm text-gray-500">Receive weekly usage summary via email</p>
            </div>
            <input
              type="checkbox"
              disabled
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-not-allowed opacity-60">
            <div>
              <p className="font-medium text-gray-900">New User Notifications</p>
              <p className="text-sm text-gray-500">Get notified when new users join</p>
            </div>
            <input
              type="checkbox"
              disabled
              className="w-5 h-5 text-primary-600 rounded"
            />
          </label>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          Notification settings will be available in a future update.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Export All Data</p>
              <p className="text-sm text-red-700">Download all organization data as JSON</p>
            </div>
            <button
              disabled
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Delete Organization</p>
              <p className="text-sm text-red-700">Permanently delete organization and all data</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm text-red-400">
          These actions require contacting HeyDoc support.
        </p>
      </div>

      {/* Implementation Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Settings Implementation</p>
            <p className="text-sm text-blue-700 mt-1">
              Most settings are read-only in this MVP. Editable settings (notifications, data export)
              will be implemented in future phases as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
