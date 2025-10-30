import { useState, useEffect } from 'react';
import { ChevronRight, Moon, Sun, Smartphone, Check, Lock, Key } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Snackbar } from '../components/Snackbar';
import PINSetup from '../components/PINSetup';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

interface SettingsData {
  appearance: {
    theme: 'light' | 'dark' | 'auto';
  };
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { updatePin } = useAuth();
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 animate-fade-in-down">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your preferences
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Change Password Card */}
        <button
          onClick={() => setShowChangePassword(true)}
          className="w-full p-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Change Password</p>
                <p className="text-sm text-white/80">
                  Update your account password
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        {/* PIN Security Card - Only show on mobile */}
        {isMobile && (
          <button
            onClick={() => setShowPINSetup(true)}
            className="w-full p-4 bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{hasPIN ? 'Change PIN' : 'Setup PIN'}</p>
                  <p className="text-sm text-white/80">
                    {hasPIN ? 'Update your security PIN' : 'Quick unlock with PIN'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}

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
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
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
        <PINSetup
          onComplete={(_pin) => {
            setShowPINSetup(false);
            setSnackbar({ message: 'PIN berhasil diubah!', type: 'success' });
          }}
          onSkip={() => {
            setShowPINSetup(false);
          }}
        />
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
