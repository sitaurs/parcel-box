import { useState } from 'react';
import { Smile, Frown, Meh, Heart, Zap, Coffee, X } from 'lucide-react';

export function MoodWidget() {
  const [selectedMood, setSelectedMood] = useState<string | null>(
    localStorage.getItem('current_mood')
  );
  const [showSelector, setShowSelector] = useState(false);

  const moods = [
    { id: 'happy', label: 'Happy', icon: Smile, color: 'from-yellow-400 to-orange-400' },
    { id: 'energetic', label: 'Energetic', icon: Zap, color: 'from-blue-400 to-cyan-400' },
    { id: 'calm', label: 'Calm', icon: Heart, color: 'from-green-400 to-emerald-400' },
    { id: 'focused', label: 'Focused', icon: Coffee, color: 'from-purple-400 to-pink-400' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'from-gray-400 to-gray-500' },
    { id: 'stressed', label: 'Stressed', icon: Frown, color: 'from-red-400 to-orange-500' },
  ];

  const currentMoodData = moods.find(m => m.id === selectedMood);

  const handleSelectMood = (moodId: string) => {
    setSelectedMood(moodId);
    localStorage.setItem('current_mood', moodId);
    localStorage.setItem('mood_timestamp', new Date().toISOString());
    setShowSelector(false);
  };

  if (!showSelector && !selectedMood) {
    return (
      <button
        onClick={() => setShowSelector(true)}
        className="w-full p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Smile className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            How are you feeling?
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tap to track your mood
          </p>
        </div>
      </button>
    );
  }

  if (showSelector) {
    return (
      <div className="relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              How do you feel now?
            </h3>
            <button
              onClick={() => setShowSelector(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.id}
                  onClick={() => handleSelectMood(mood.id)}
                  className="p-4 rounded-xl hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className={`w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br ${mood.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                    {mood.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Display current mood
  if (currentMoodData) {
    const Icon = currentMoodData.icon;
    return (
      <button
        onClick={() => setShowSelector(true)}
        className="w-full p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentMoodData.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
              Current Mood
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Feeling {currentMoodData.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tap to update
            </p>
          </div>
        </div>
      </button>
    );
  }

  return null;
}
