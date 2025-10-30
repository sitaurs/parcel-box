import { useState } from 'react';

interface PINSetupProps {
  onComplete: (pin: string) => void;
  onSkip?: () => void;
}

export default function PINSetup({ onComplete, onSkip }: PINSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleNumberClick = (num: string) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    if (currentPin.length < 6) {
      if (step === 'create') {
        setPin(currentPin + num);
      } else {
        setConfirmPin(currentPin + num);
      }
      setError('');
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleContinue = async () => {
    if (step === 'create') {
      if (pin.length < 4) {
        setError('PIN minimal 4 digit');
        return;
      }
      setStep('confirm');
    } else {
      if (pin !== confirmPin) {
        setError('PIN tidak cocok, coba lagi');
        setConfirmPin('');
        return;
      }
      // Call onComplete with await if it's async
      await onComplete(pin);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setError('');
    }
  };

  const currentPin = step === 'create' ? pin : confirmPin;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'create' ? 'Buat PIN' : 'Konfirmasi PIN'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'create' 
              ? 'Buat PIN 4-6 digit untuk akses cepat' 
              : 'Masukkan PIN sekali lagi'}
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                i < currentPin.length
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 scale-110'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
              }`}
            >
              {i < currentPin.length && (
                <div className="w-3 h-3 rounded-full bg-white" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-center text-sm animate-shake">
            {error}
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 text-xl font-semibold text-gray-900 dark:text-white"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBack}
            disabled={step === 'create'}
            className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 mx-auto text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 text-xl font-semibold text-gray-900 dark:text-white"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6 mx-auto text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleContinue}
            disabled={currentPin.length < 4}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {step === 'create' ? 'Lanjut' : 'Selesai'}
          </button>
          
          {onSkip && step === 'create' && (
            <button
              onClick={onSkip}
              className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Lewati
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
