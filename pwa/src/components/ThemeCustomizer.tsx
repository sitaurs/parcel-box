import { useState } from 'react';
import { Sun, Moon, Smartphone, Palette, Check } from 'lucide-react';

interface ThemeCustomizerProps {
  onClose: () => void;
}

export function ThemeCustomizer({ onClose }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(
    (localStorage.getItem('theme') as 'light' | 'dark' | 'auto') || 'auto'
  );
  const [accentColor, setAccentColor] = useState(
    localStorage.getItem('accent_color') || 'blue'
  );

  const themes = [
    { id: 'light' as const, label: 'Light', icon: Sun, desc: 'Bright and clean' },
    { id: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { id: 'auto' as const, label: 'Auto', icon: Smartphone, desc: 'Matches system' },
  ];

  const accentColors = [
    { id: 'blue', label: 'Ocean Blue', gradient: 'from-blue-500 to-cyan-500', primary: '#3b82f6' },
    { id: 'purple', label: 'Royal Purple', gradient: 'from-purple-500 to-pink-500', primary: '#a855f7' },
    { id: 'green', label: 'Forest Green', gradient: 'from-green-500 to-emerald-500', primary: '#10b981' },
    { id: 'orange', label: 'Sunset Orange', gradient: 'from-orange-500 to-red-500', primary: '#f97316' },
    { id: 'pink', label: 'Cherry Blossom', gradient: 'from-pink-500 to-rose-500', primary: '#ec4899' },
    { id: 'indigo', label: 'Midnight Indigo', gradient: 'from-indigo-500 to-blue-600', primary: '#6366f1' },
  ];

  const handleSave = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('accent_color', accentColor);
    
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Apply accent color (would need CSS variable implementation)
    document.documentElement.style.setProperty('--accent-color', accentColors.find(c => c.id === accentColor)?.primary || '#3b82f6');
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6">
          <div className="flex items-center gap-3 text-white">
            <Palette className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Theme Customizer</h2>
              <p className="text-white/80 text-sm">Personalize your experience</p>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Theme Mode Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${
                      isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Accent Color
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {accentColors.map((color) => {
                const isSelected = accentColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => setAccentColor(color.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.gradient} flex-shrink-0 flex items-center justify-center`}>
                        {isSelected && <Check className="w-6 h-6 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {color.label}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">PREVIEW</p>
            <div className={`p-4 bg-gradient-to-r ${accentColors.find(c => c.id === accentColor)?.gradient} rounded-xl`}>
              <p className="text-white font-semibold mb-1">Sample Card</p>
              <p className="text-white/80 text-sm">This is how your accent color will look</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
