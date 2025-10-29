import { useState } from 'react';
import { ChevronRight, Sun, Moon, Smartphone, Smile, Frown, Meh, Heart, Zap, Coffee } from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  name: string;
  mood: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    mood: '',
    theme: 'auto',
    notifications: true,
  });

  const moods = [
    { id: 'happy', label: 'Happy', icon: Smile, color: 'from-yellow-400 to-orange-400', position: 'top-4 right-4' },
    { id: 'energetic', label: 'Energetic', icon: Zap, color: 'from-blue-400 to-cyan-400', position: 'top-20 left-8' },
    { id: 'calm', label: 'Calm', icon: Heart, color: 'from-green-400 to-emerald-400', position: 'bottom-20 right-12' },
    { id: 'focused', label: 'Focused', icon: Coffee, color: 'from-purple-400 to-pink-400', position: 'bottom-8 left-4' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'from-gray-400 to-gray-500', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { id: 'stressed', label: 'Stressed', icon: Frown, color: 'from-red-400 to-orange-500', position: 'top-1/3 right-1/4' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('user_preferences', JSON.stringify(data));
      onComplete(data);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete(data);
  };

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center p-4 overflow-hidden backdrop-blur-sm">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

        <div className="relative z-10 text-center max-w-md w-full">
          {/* Playful Illustration */}
          <div className="mb-8 relative">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-[3rem] flex items-center justify-center shadow-2xl animate-bounce-slow">
              <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            {/* Floating Emoji-like Dots */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-float"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full animate-float animation-delay-2000"></div>
            <div className="absolute top-1/3 -right-8 w-4 h-4 bg-pink-400 rounded-full animate-float animation-delay-4000"></div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to<br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Smart Parcel
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
            Let's personalize your experience in just a few steps
          </p>

          <button
            onClick={handleNext}
            className="w-full max-w-xs mx-auto py-4 px-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkip}
            className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Name Input
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Step 1 of 3</span>
              <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Skip
              </button>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
                <span className="text-4xl">👋</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                What's your name?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We'd love to know what to call you
              </p>
            </div>

            <input
              type="text"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Enter your name"
              autoFocus
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg"
            />

            <button
              onClick={handleNext}
              disabled={!data.name.trim()}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Mood Selector
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-300">Step 2 of 3</span>
              <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-200">
                Skip
              </button>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: '66%' }}></div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-[2rem] shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                How do you feel<br />now?
              </h2>
              <p className="text-gray-400">
                Choose which way you are feeling at the moment
              </p>
            </div>

            {/* Mood Selector - Blob Style Layout */}
            <div className="relative h-80 mb-6">
              {moods.map((mood) => {
                const Icon = mood.icon;
                const isSelected = data.mood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setData({ ...data, mood: mood.id })}
                    className={`absolute ${mood.position} transform transition-all duration-300 ${
                      isSelected ? 'scale-110' : 'scale-100 hover:scale-105'
                    }`}
                  >
                    <div
                      className={`w-24 h-24 rounded-full bg-gradient-to-br ${mood.color} flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-all ${
                        isSelected ? 'ring-4 ring-white' : ''
                      }`}
                    >
                      <Icon className="w-8 h-8 text-white mb-1" />
                      <span className="text-white text-xs font-medium">{mood.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!data.mood}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Theme Selector
  if (step === 3) {
    const themes = [
      { id: 'light' as const, label: 'Light', icon: Sun, gradient: 'from-yellow-400 to-orange-400', bg: 'bg-white' },
      { id: 'dark' as const, label: 'Dark', icon: Moon, gradient: 'from-indigo-500 to-purple-600', bg: 'bg-gray-900' },
      { id: 'auto' as const, label: 'Auto', icon: Smartphone, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-gradient-to-br from-white to-gray-900' },
    ];

    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Step 3 of 3</span>
              <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Skip
              </button>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Choose your theme
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Pick a theme that suits your style
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {themes.map((theme) => {
                const Icon = theme.icon;
                const isSelected = data.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setData({ ...data, theme: theme.id })}
                    className={`w-full p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{theme.label}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {theme.id === 'auto' ? 'Matches system' : `${theme.label} mode`}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Complete Setup
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
