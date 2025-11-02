import { ReactNode, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ImageIcon, MessageCircle, Settings, LogOut, Menu, X, Wifi, WifiOff, Moon, Sun, Bell, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { logout, user } = useAuth();
  const { connected } = useSocket();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Single source of truth for navigation items
  const navItems = [
    { path: '/', icon: Home, label: 'Home', color: 'from-blue-500 to-cyan-500' },
    { path: '/packages', icon: Package, label: 'Packages', color: 'from-purple-500 to-pink-500' },
    { path: '/gallery', icon: ImageIcon, label: 'Gallery', color: 'from-green-500 to-emerald-500' },
    { path: '/notifications', icon: Bell, label: 'Alerts', color: 'from-indigo-500 to-purple-500' },
    { path: '/whatsapp', icon: MessageCircle, label: 'Chat', color: 'from-yellow-500 to-orange-500' },
  ];

  // Admin link only in sidebar, not bottom nav (too cramped)
  const sidebarItems = [
    ...navItems,
    ...(user?.role === 'admin' ? [{ path: '/admin/users', icon: Shield, label: 'Admin', color: 'from-red-500 to-orange-500' }] : []),
    { path: '/settings', icon: Settings, label: 'Settings', color: 'from-gray-500 to-slate-500' },
  ];

  const currentPage = navItems.find(item => item.path === location.pathname);

  // Reusable Navigation Link Component for Desktop/Mobile Sidebar
  const SidebarNavLink = ({ item, onClick }: { item: typeof navItems[0], onClick?: () => void }) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-105 hover-glow'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-102 hover:shadow-md'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'animate-bounce-slow' : 'group-hover:scale-110 group-hover:rotate-12'}`} />
          <span className="font-semibold">{item.label}</span>
        </>
      )}
    </NavLink>
  );

  // Reusable User Info Component
  const UserInfo = ({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) => (
    <div className={`${variant === 'mobile' ? 'px-6 py-4' : 'px-4 py-3'} ${variant === 'mobile' ? '' : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105'}`}>
      <div className="flex items-center space-x-3">
        <div className={`${variant === 'mobile' ? 'w-14 h-14 rounded-2xl' : 'w-11 h-11 rounded-xl'} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${variant === 'mobile' ? 'text-xl' : 'text-lg'} shadow-md animate-scale-in-center hover:animate-wiggle`}>
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {user?.username || 'User'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
            {user?.role || 'user'}
          </p>
          {variant === 'mobile' && (
            <p className={`text-xs font-medium mt-1 ${connected ? 'text-green-600 animate-pulse-glow' : 'text-red-600 animate-shake'}`}>
              {connected ? '● Online' : '● Offline'}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Reusable Action Buttons Component
  const ActionButtons = ({ variant = 'horizontal' }: { variant?: 'horizontal' | 'vertical' | 'icons' }) => (
    <div className={`flex ${variant === 'vertical' ? 'flex-col' : 'items-center'} ${variant === 'icons' ? 'space-x-2' : 'gap-2'}`}>
      <button
        onClick={toggleTheme}
        className={`${variant === 'vertical' ? 'w-full' : variant === 'icons' ? 'w-10 h-10' : 'flex-1'} flex items-center justify-center px-4 py-${variant === 'vertical' ? '3' : variant === 'icons' ? '0' : '2.5'} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg ripple`}
        title="Toggle theme"
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-5 h-5 animate-rotate-in" />
            {variant === 'vertical' && <span className="ml-2 font-medium">Light Mode</span>}
          </>
        ) : (
          <>
            <Moon className="w-5 h-5 animate-rotate-in" />
            {variant === 'vertical' && <span className="ml-2 font-medium">Dark Mode</span>}
          </>
        )}
      </button>
      <button
        onClick={handleLogout}
        className={`${variant === 'vertical' ? 'w-full' : variant === 'icons' ? 'w-10 h-10' : 'flex-1'} flex items-center justify-center px-4 py-${variant === 'vertical' ? '3' : variant === 'icons' ? '0' : '2.5'} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg ripple`}
        title="Logout"
      >
        <LogOut className="w-5 h-5 animate-rotate-in" />
        {variant === 'vertical' && <span className="ml-2 font-semibold">Logout</span>}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar - Only show on large screens (1024px+) - z-30 */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-30">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart Parcel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">IoT System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <SidebarNavLink key={item.path} item={item} />
            ))}
            {/* Admin Link for Desktop */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Shield className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    <span className="font-semibold">Admin</span>
                  </>
                )}
              </NavLink>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
              <span className={`flex items-center text-sm font-semibold ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {connected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
                {connected ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* User Info */}
            <UserInfo variant="desktop" />

            {/* Actions */}
            <ActionButtons variant="horizontal" />
          </div>
        </div>
      </aside>

      {/* Tablet Top Bar - Only show on medium screens (768px-1023px) - z-40 */}
      <div className="hidden md:flex lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between w-full px-6 py-4">
          <div className="flex items-center space-x-4 animate-fade-in-down">
            <div className={`w-12 h-12 bg-gradient-to-br ${currentPage?.color || 'from-blue-500 to-purple-600'} rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in hover:animate-wiggle`}>
              {currentPage ? <currentPage.icon className="w-6 h-6 text-white animate-pulse-glow" /> : <Package className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentPage?.label || 'Smart Parcel'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">IoT Delivery System</p>
            </div>
          </div>

          {/* Tablet Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center w-12 h-12 rounded-xl transition-all group animate-fade-in stagger-${index + 1} ${
                    isActive
                      ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-110 hover-glow'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 hover:shadow-md'
                  }`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <item.icon className={`w-6 h-6 transition-all duration-300 ${!isActive && 'group-hover:rotate-12'}`} />
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Menu - Using reusable ActionButtons component */}
          <div className="animate-slide-in-right">
            <ActionButtons variant="icons" />
          </div>
        </div>
      </div>

      {/* Mobile - NO HEADER, NO HAMBURGER - Pure App Experience */}
      
      {/* Main Content - Full height for mobile, with sidebar offset for desktop */}
      <main className="lg:pl-72">
        <div className="pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Only show on small/medium screens (<1024px) - z-50 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom shadow-2xl">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center space-y-0.5 transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] font-medium truncate px-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Admin & Settings FAB - Floating Action Buttons for Mobile */}
      {user?.role === 'admin' && (
        <div className="md:hidden fixed bottom-20 right-4 z-40 flex flex-col space-y-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <Shield className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* Logout & Theme FAB - Bottom Right */}
      <div className="md:hidden fixed bottom-20 left-4 z-40 flex flex-col space-y-3">
        <button
          onClick={toggleTheme}
          className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
