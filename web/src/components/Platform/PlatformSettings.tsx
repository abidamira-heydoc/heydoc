import React, { useState } from 'react';
import { usePlatform } from '../../contexts/PlatformContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

const PlatformSettings: React.FC = () => {
  const { platformUser } = usePlatform();
  const [activeSection, setActiveSection] = useState<'general' | 'admins' | 'billing'>('general');

  // New admin form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminOrgId, setNewAdminOrgId] = useState('');
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const handleAssignOrgAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigningAdmin(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const assignOrgAdmin = httpsCallable(functions, 'assignOrgAdmin');
      await assignOrgAdmin({
        email: newAdminEmail,
        organizationId: newAdminOrgId,
      });
      setAdminSuccess(`Successfully assigned ${newAdminEmail} as org admin`);
      setNewAdminEmail('');
      setNewAdminOrgId('');
    } catch (err: any) {
      console.error('Error assigning org admin:', err);
      setAdminError(err.message || 'Failed to assign org admin');
    } finally {
      setAssigningAdmin(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'admins', label: 'Admin Management', icon: UsersIcon },
    { id: 'billing', label: 'Billing & Pricing', icon: BillingIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <section.icon />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'general' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

              {/* Platform Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform Admin Email
                  </label>
                  <input
                    type="email"
                    value={platformUser?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Created
                  </label>
                  <input
                    type="text"
                    value={platformUser?.createdAt?.toLocaleDateString() || 'N/A'}
                    disabled
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Platform Configuration</h3>
                <p className="text-sm text-gray-500">
                  Platform-wide configuration options will be available here. Contact the development team
                  to modify core platform settings.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'admins' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Admin Management</h2>

              {/* Assign Org Admin */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Assign Organization Admin</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Promote a user to organization admin role. The user must already have an account.
                </p>

                {adminError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {adminError}
                  </div>
                )}

                {adminSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {adminSuccess}
                  </div>
                )}

                <form onSubmit={handleAssignOrgAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Email
                    </label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      required
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization ID
                    </label>
                    <input
                      type="text"
                      value={newAdminOrgId}
                      onChange={(e) => setNewAdminOrgId(e.target.value)}
                      required
                      placeholder="org_xxxxx"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Find organization IDs in the Organizations page
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={assigningAdmin}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {assigningAdmin ? 'Assigning...' : 'Assign as Org Admin'}
                  </button>
                </form>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Role Hierarchy</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>Platform Admin:</strong> Full access to all organizations and platform settings</li>
                  <li><strong>Org Admin:</strong> Manages users and data within their organization only</li>
                  <li><strong>User:</strong> Regular user with access to health chat features</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Billing & Pricing</h2>

              {/* Current Pricing */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Consultation Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Standard Consultation</p>
                    <p className="text-2xl font-bold text-gray-900">$25</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Platform fee: $5 (20%)</p>
                      <p>Doctor payout: $20 (80%)</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Priority Consultation</p>
                    <p className="text-2xl font-bold text-amber-700">$45</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Platform fee: $9 (20%)</p>
                      <p>Doctor payout: $36 (80%)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stripe Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Processing</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Payments are processed through Stripe. Doctors use Stripe Connect for payouts.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Processing:</strong> Stripe (2.9% + $0.30 per transaction)
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Payouts:</strong> Stripe Connect Express
                  </p>
                </div>
              </div>

              {/* Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  To modify pricing or payment settings, please contact the development team.
                  Changes require code updates and testing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Icon components
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BillingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export default PlatformSettings;
