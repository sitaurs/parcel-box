import { useState, useEffect } from 'react';
import { ChevronRight, Moon, Sun, Smartphone, Check, Lock, Key, Sparkles, Shield, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useGlassTheme } from '../contexts/GlassThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Snackbar } from '../components/Snackbar';
import PINSetup from '../components/PINSetup';
import { ChangePINFlow } from '../components/ChangePINFlow';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

interface SettingsData {
  appearance: {
    theme: 'light' | 'dark' | 'auto';
  };
}

export function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { glassTheme, setGlassTheme } = useGlassTheme();
  const { updatePin, user } = useAuth();
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    appearance: { theme: theme as 'light' | 'dark' | 'auto' }
  });
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const hasPIN = !!localStorage.getItem('userPin');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const stored = localStorage.getItem('settings');
      if (stored) {
        const data = JSON.parse(stored);
        setSettings({ ...settings, ...data });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function handleSave() {
    try {
      localStorage.setItem('settings', JSON.stringify(settings));
      
      // Update theme
      if (settings.appearance.theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(isDark ? 'dark' : 'light');
      } else {
        setTheme(settings.appearance.theme);
      }

      setSnackbar({ message: 'Settings saved!', type: 'success' });
      setTimeout(() => setSnackbar(null), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ message: 'Failed to save settings', type: 'error' });
    }
  }

  function updateSetting<K extends keyof SettingsData>(category: K, key: keyof SettingsData[K], value: any) {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }

  function toggleSection(section: string) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  const getThemeIcon = () => {
    switch (settings.appearance.theme) {
      case 'light': return <Sun className="w-5 h-5" />;
      case 'dark': return <Moon className="w-5 h-5" />;
      default: return <Smartphone className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Clean Header */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-slide-in-left">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 animate-fade-in">
          Configure your preferences
        </p>
      </div>

      <div className="px-4 pb-6 space-y-4">
        {/* Quick Actions - Admin & WhatsApp */}
        <div className="grid grid-cols-2 gap-3">
          {/* Admin Panel - Only for Admins */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl shadow-lg hover:shadow-2xl active:scale-95 transition-all text-white animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-sm">Admin</p>
                  <p className="text-xs text-white/80">Manage Users</p>
                </div>
              </div>
            </button>
          )}
          
          {/* WhatsApp */}
          <button
            onClick={() => navigate('/whatsapp')}
            className={`p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl shadow-lg hover:shadow-2xl active:scale-95 transition-all text-white animate-fade-in ${isAdmin ? '' : 'col-span-2'}`}
            style={{ animationDelay: isAdmin ? '200ms' : '100ms' }}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm">WhatsApp</p>
                <p className="text-xs text-white/80">Notifications</p>
              </div>
            </div>
          </button>
        </div>

        {/* Theme Toggle - Quick Access */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
          {[
            { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
            { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
            { value: 'auto', label: 'Auto', icon: <Smartphone className="w-5 h-5" /> }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => {
                updateSetting('appearance', 'theme', option.value);
                handleSave();
              }}
              className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                settings.appearance.theme === option.value
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                {option.icon}
                <span className="text-xs font-semibold">{option.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Security Settings */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
        {/* Change Password Card */}
        <button
          onClick={() => setShowChangePassword(true)}
          className="w-full p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-lg active:scale-95 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Change Password</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update your account password
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        {/* PIN Security Card - Only show on mobile */}
        {isMobile && (
          <button
            onClick={() => setShowPINSetup(true)}
            className="w-full p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-lg active:scale-95 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">{hasPIN ? 'Change PIN' : 'Setup PIN'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {hasPIN ? 'Update your security PIN' : 'Quick unlock with PIN'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        )}
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => toggleSection('appearance')}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                {getThemeIcon()}
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 dark:text-white">Appearance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{settings.appearance.theme} mode</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === 'appearance' ? 'rotate-90' : ''}`} />
          </button>
          
          {expandedSection === 'appearance' && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
              {/* Theme Selection */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Color Theme</p>
                <div className="space-y-2">
                  {[
                    { value: 'light', label: 'Light', icon: '☀️' },
                    { value: 'dark', label: 'Dark', icon: '🌙' },
                    { value: 'auto', label: 'Auto', icon: '🔄' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateSetting('appearance', 'theme', option.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        settings.appearance.theme === option.value
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                      </div>
                      {settings.appearance.theme === option.value && (
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Effect Selection */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Glassmorphism Effect</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Optional frosted glass visual effect</p>
                <div className="space-y-2">
                  {[
                    { value: 'off', label: 'Off (Clean)', icon: '🚫', desc: 'Default solid backgrounds' },
                    { value: 'subtle', label: 'Subtle', icon: '✨', desc: 'Light frosted glass effect' },
                    { value: 'strong', label: 'Strong', icon: '💎', desc: 'Full glassmorphism mode' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setGlassTheme(option.value as any)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        glassTheme === option.value
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{option.icon}</span>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</p>
                        </div>
                      </div>
                      {glassTheme === option.value && (
                        <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button - Floating */}
      <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-auto z-40">
        <button
          onClick={handleSave}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform active:scale-95 flex items-center justify-center space-x-2"
        >
          <Check className="w-5 h-5" />
          <span>Save Changes</span>
        </button>
      </div>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar(null)}
        />
      )}

      {/* PIN Setup Modal */}
      {showPINSetup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {hasPIN ? 'Change PIN' : 'Setup PIN'}
            </h3>
            
            {hasPIN ? (
              // Change PIN flow
              <ChangePINFlow
                onComplete={async (oldPin, newPin) => {
                  const success = await updatePin(oldPin, newPin);
                  if (success) {
                    setShowPINSetup(false);
                    setSnackbar({ message: 'PIN berhasil diubah!', type: 'success' });
                  } else {
                    setSnackbar({ message: 'PIN lama salah!', type: 'error' });
                  }
                }}
                onCancel={() => setShowPINSetup(false)}
              />
            ) : (
              // Setup new PIN
              <PINSetup
                onComplete={(_pin) => {
                  setShowPINSetup(false);
                  setSnackbar({ message: 'PIN berhasil dibuat!', type: 'success' });
                }}
                onSkip={() => {
                  setShowPINSetup(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setSnackbar({ message: 'Password berhasil diubah!', type: 'success' });
          }}
        />
      )}
    </div>
  );
}

export default Settings;
