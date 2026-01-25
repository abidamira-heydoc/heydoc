import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatform, PlatformProvider } from '../../contexts/PlatformContext';

// Icons
const OverviewIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const OrganizationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DoctorsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RevenueIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

interface NavItem {
  name: string;
  path: string;
  icon: React.FC;
  end?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/platform', icon: OverviewIcon, end: true },
  { name: 'Organizations', path: '/platform/organizations', icon: OrganizationsIcon },
  { name: 'Doctors', path: '/platform/doctors', icon: DoctorsIcon },
  { name: 'Revenue', path: '/platform/revenue', icon: RevenueIcon },
  { name: 'Settings', path: '/platform/settings', icon: SettingsIcon },
];

// Breadcrumb component
const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = pathParts.map((part, index) => {
    const path = '/' + pathParts.slice(0, index + 1).join('/');
    const name = part.charAt(0).toUpperCase() + part.slice(1);
    return { name, path };
  });

  return (
    <nav className="text-sm text-gray-500 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path}>
          {index > 0 && <span className="mx-2">/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.name}</span>
          ) : (
            <NavLink to={crumb.path} className="hover:text-blue-600">
              {crumb.name}
            </NavLink>
          )}
        </span>
      ))}
    </nav>
  );
};

// Inner layout component that uses platform context
const PlatformLayoutInner: React.FC = () => {
  const { signOut } = useAuth();
  const { platformUser, metrics, loading, error, clearError } = usePlatform();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading platform dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/heydoclogo.png" alt="HeyDoc" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-bold text-lg text-white">HeyDoc</span>
              <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Platform</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Platform Stats Mini */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-500">Organizations</p>
              <p className="text-white font-semibold">{metrics?.totalOrganizations || 0}</p>
            </div>
            <div>
              <p className="text-slate-500">Pending Doctors</p>
              <p className="text-white font-semibold">{metrics?.pendingDoctors || 0}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Back to App Link */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
          <a
            href="/chat"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <BackIcon />
            <span>Back to App</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <MenuIcon />
          </button>

          {/* Page title area */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">
              Platform Administration
            </h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Admin user info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {platformUser?.email}
                </p>
                <p className="text-xs text-blue-600 font-medium">Platform Admin</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium text-sm">
                  {platformUser?.email?.[0]?.toUpperCase() || 'P'}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogoutIcon />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 lg:mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Wrapper component that provides platform context
const PlatformLayout: React.FC = () => {
  return (
    <PlatformProvider>
      <PlatformLayoutInner />
    </PlatformProvider>
  );
};

export default PlatformLayout;
