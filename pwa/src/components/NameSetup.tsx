import { useState } from 'react';

interface NameSetupProps {
  onComplete: (name: string) => void;
}

export default function NameSetup({ onComplete }: NameSetupProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('⏳ Already submitting, ignoring duplicate click');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Nama minimal 2 karakter');
      return;
    }

    if (name.trim().length > 50) {
      setError('Nama maksimal 50 karakter');
      return;
    }

    setIsSubmitting(true);
    setError(''); // Clear previous errors
    
    try {
      console.log('💾 Submitting name:', name.trim());
      await onComplete(name.trim());
      console.log('✅ Name submitted successfully');
      // Don't reset isSubmitting - let parent component handle state change
    } catch (err: any) {
      console.error('❌ Name submission failed:', err);
      setError(err.message || 'Gagal menyimpan nama. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Selamat Datang! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Siapa nama Anda?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="card bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Masukkan nama Anda"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
              disabled={isSubmitting}
              maxLength={50}
            />
            {name.trim().length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {name.trim().length}/50 karakter
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-center text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={name.trim().length < 2 || isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                Lanjutkan
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Info Text */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Nama ini akan digunakan untuk personalisasi aplikasi
          </p>
        </form>
      </div>
    </div>
  );
}
