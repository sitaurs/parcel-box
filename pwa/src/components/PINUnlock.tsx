import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PINUnlockProps {
  onSuccess: () => void;
}

export default function PINUnlock({ onSuccess }: PINUnlockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const { unlockWithPin } = useAuth();

  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockTimer, isLocked]);

  const handleNumberClick = (num: string) => {
    if (isLocked) return;
    
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');

      // Auto verify when 6 digits complete
      if (newPin.length === 6) {
        setTimeout(() => verifyPin(newPin), 300);
      }
    }
  };

  const verifyPin = (pinToVerify: string) => {
    const isValid = unlockWithPin(pinToVerify);
    
    if (isValid) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('PIN salah');
      setPin('');

      // Lock after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockTimer(30); // 30 seconds lockout
        setError('Terlalu banyak percobaan. Coba lagi dalam 30 detik');
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Selamat Datang Kembali
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isLocked ? `Coba lagi dalam ${lockTimer} detik` : 'Masukkan PIN Anda'}
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                i < pin.length
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 scale-110'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
              } ${error && i < pin.length ? 'animate-shake' : ''}`}
            >
              {i < pin.length && (
                <div className="w-3 h-3 rounded-full bg-white" />
              )}
            </div>
          ))}
        </div>

        {/* Error/Status Message */}
        {error && (
          <div className={`mb-4 p-3 rounded-xl text-center text-sm animate-shake ${
            isLocked 
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {error}
          </div>
        )}

        {attempts > 0 && attempts < 5 && !isLocked && (
          <div className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Percobaan tersisa: {5 - attempts}
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={isLocked}
              className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 text-xl font-semibold text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {num}
            </button>
          ))}
          <div className="h-16" /> {/* Empty space */}
          <button
            onClick={() => handleNumberClick('0')}
            disabled={isLocked}
            className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 text-xl font-semibold text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isLocked || pin.length === 0}
            className="h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg className="w-6 h-6 mx-auto text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
