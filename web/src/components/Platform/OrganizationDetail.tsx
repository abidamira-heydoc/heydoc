import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

interface OrgUser {
  id: string;
  email: string;
  role: string;
  createdAt: string | null;
  lastActive: string | null;
}

interface OrgDetails {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  maxUsers: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface OrgStats {
  totalUsers: number;
  totalConversations: number;
  activeUsersLast30Days: number;
}

const OrganizationDetail: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  // State
  const [organization, setOrganization] = useState<OrgDetails | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

  // Users tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Settings tab state
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    type: 'company',
    maxUsers: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showRemoveUserModal, setShowRemoveUserModal] = useState<OrgUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const orgTypes = [
    { value: 'company', label: 'Company' },
    { value: 'school', label: 'School' },
    { value: 'shelter', label: 'Shelter' },
    { value: 'refugee_camp', label: 'Refugee Camp' },
    { value: 'prison', label: 'Prison' },
    { value: 'nonprofit', label: 'Nonprofit' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch organization details
  const fetchDetails = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    try {
      const getOrganizationDetails = httpsCallable(functions, 'getOrganizationDetails');
      const result = await getOrganizationDetails({ orgId });
      const data = result.data as {
        organization: OrgDetails;
        users: OrgUser[];
        stats: OrgStats;
      };

      setOrganization(data.organization);
      setUsers(data.users);
      setStats(data.stats);

      // Initialize edit form
      setEditForm({
        name: data.organization.name,
        code: data.organization.code,
        type: data.organization.type,
        maxUsers: data.organization.maxUsers?.toString() || '',
      });
    } catch (err: any) {
      console.error('Error fetching organization details:', err);
      setError(err.message || 'Failed to load organization details');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle settings save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const updateOrganization = httpsCallable(functions, 'updateOrganization');
      await updateOrganization({
        orgId,
        name: editForm.name,
        code: editForm.code,
        type: editForm.type,
        maxUsers: editForm.maxUsers ? parseInt(editForm.maxUsers) : null,
      });

      await fetchDetails();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setError(err.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async () => {
    if (!orgId || !organization) return;

    setSaving(true);
    setError(null);

    try {
      const updateOrganization = httpsCallable(functions, 'updateOrganization');
      await updateOrganization({
        orgId,
        isActive: !organization.isActive,
      });

      await fetchDetails();
      setShowDeactivateModal(false);
    } catch (err: any) {
      console.error('Error toggling organization status:', err);
      setError(err.message || 'Failed to update organization status');
    } finally {
      setSaving(false);
    }
  };

  // Handle remove user
  const handleRemoveUser = async (user: OrgUser) => {
    if (!orgId) return;

    setRemovingUserId(user.id);
    setError(null);

    try {
      const removeUserFromOrg = httpsCallable(functions, 'removeUserFromOrg');
      await removeUserFromOrg({
        userId: user.id,
        orgId,
      });

      await fetchDetails();
      setShowRemoveUserModal(null);
    } catch (err: any) {
      console.error('Error removing user:', err);
      setError(err.message || 'Failed to remove user');
    } finally {
      setRemovingUserId(null);
    }
  };

  // Handle delete organization permanently
  const handleDeleteOrganization = async () => {
    if (!orgId || !organization) return;

    setDeleting(true);
    setError(null);

    try {
      const deleteOrganizationAdmin = httpsCallable(functions, 'deleteOrganizationAdmin');
      await deleteOrganizationAdmin({
        orgId,
        confirmName: deleteConfirmName,
      });

      // Navigate back to organizations list after successful deletion
      navigate('/platform/organizations');
    } catch (err: any) {
      console.error('Error deleting organization:', err);
      setError(err.message || 'Failed to delete organization');
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="space-y-6">
        <Link
          to="/platform/organizations"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Organizations
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchDetails}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/platform" className="text-gray-500 hover:text-gray-700">
            Platform
          </Link>
          <span className="text-gray-400">/</span>
          <Link to="/platform/organizations" className="text-gray-500 hover:text-gray-700">
            Organizations
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{organization.name}</span>
        </div>
        <button
          onClick={() => navigate('/platform/organizations')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>Code: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{organization.code}</code></span>
                <span className="text-gray-300">|</span>
                <span className="capitalize">{organization.type.replace('_', ' ')}</span>
                <span className="text-gray-300">|</span>
                {organization.isActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className={`px-4 py-2 rounded-lg transition ${
                organization.isActive
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {organization.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
            <button
              onClick={() => {
                setDeleteConfirmName('');
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats?.totalUsers || 0}</p>
          {organization.maxUsers && (
            <p className="text-xs text-gray-400 mt-1">Max: {organization.maxUsers}</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.totalConversations || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active (30d)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats?.activeUsersLast30Days || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-lg font-semibold text-gray-700 mt-1">
            {formatDate(organization.createdAt)}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="org_admin">Org Admin</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'org_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role === 'org_admin' ? 'Org Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(user.lastActive)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setShowRemoveUserModal(user)}
                          disabled={removingUserId === user.id}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          {removingUserId === user.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {users.length === 0 ? 'No users in this organization' : 'No matching users found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <form onSubmit={handleSaveSettings} className="max-w-lg space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Users will enter this code to join the organization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {orgTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Users
                </label>
                <input
                  type="number"
                  value={editForm.maxUsers}
                  onChange={(e) => setEditForm({ ...editForm, maxUsers: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Settings saved successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Deactivate/Reactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {organization.isActive ? 'Deactivate Organization' : 'Reactivate Organization'}
            </h2>
            <p className="text-gray-600 mb-6">
              {organization.isActive
                ? `Are you sure you want to deactivate "${organization.name}"? Users will not be able to access the platform with this organization's code.`
                : `Are you sure you want to reactivate "${organization.name}"? Users will be able to access the platform again.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleActive}
                disabled={saving}
                className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                  organization.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {saving
                  ? 'Processing...'
                  : organization.isActive
                  ? 'Deactivate'
                  : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Modal */}
      {showRemoveUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Remove User</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{showRemoveUserModal.email}</strong> from this
              organization? They will lose access to the organization's resources.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveUserModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveUser(showRemoveUserModal)}
                disabled={removingUserId === showRemoveUserModal.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {removingUserId === showRemoveUserModal.id ? 'Removing...' : 'Remove User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Organization Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Organization</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm font-medium">This action cannot be undone!</p>
              <p className="text-red-700 text-sm mt-1">
                Deleting this organization will permanently remove it and all {stats?.totalUsers || 0} users will lose their organization association.
              </p>
            </div>
            <p className="text-gray-600 mb-4">
              To confirm deletion, please type the organization name: <strong>{organization.name}</strong>
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Type organization name to confirm"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrganization}
                disabled={deleting || deleteConfirmName !== organization.name}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetail;
