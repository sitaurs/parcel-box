import { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

interface ChangePINFlowProps {
  onComplete: (oldPin: string, newPin: string) => void;
  onCancel: () => void;
}

export function ChangePINFlow({ onComplete, onCancel }: ChangePINFlowProps) {
  const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleNumberClick = (num: string) => {
    let currentPin = '';
    let setter: (pin: string) => void = setOldPin;

    if (step === 'old') {
      currentPin = oldPin;
      setter = setOldPin;
    } else if (step === 'new') {
      currentPin = newPin;
      setter = setNewPin;
    } else {
      currentPin = confirmPin;
      setter = setConfirmPin;
    }

    if (currentPin.length < 6) {
      setter(currentPin + num);
      setError('');
    }
  };

  const handleDelete = () => {
    if (step === 'old') {
      setOldPin(oldPin.slice(0, -1));
    } else if (step === 'new') {
      setNewPin(newPin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleContinue = () => {
    if (step === 'old') {
      if (oldPin.length < 4) {
        setError('PIN minimal 4 digit');
        return;
      }
      setStep('new');
    } else if (step === 'new') {
      if (newPin.length < 4) {
        setError('PIN minimal 4 digit');
        return;
      }
      if (newPin === oldPin) {
        setError('PIN baru harus berbeda dengan PIN lama');
        return;
      }
      setStep('confirm');
    } else {
      if (newPin !== confirmPin) {
        setError('PIN tidak cocok, coba lagi');
        setConfirmPin('');
        return;
      }
      onComplete(oldPin, newPin);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'new') {
      setNewPin('');
      setStep('old');
    } else if (step === 'confirm') {
      setConfirmPin('');
      setStep('new');
    }
  };

  const getCurrentPin = () => {
    if (step === 'old') return oldPin;
    if (step === 'new') return newPin;
    return confirmPin;
  };

  const getTitle = () => {
    if (step === 'old') return 'Masukkan PIN Lama';
    if (step === 'new') return 'Buat PIN Baru';
    return 'Konfirmasi PIN Baru';
  };

  const getSubtitle = () => {
    if (step === 'old') return 'Verifikasi identitas Anda';
    if (step === 'new') return 'Minimal 4-6 digit';
    return 'Masukkan lagi PIN baru';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center">
          {step !== 'old' && (
            <button
              onClick={handleBack}
              className="absolute left-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getTitle()}</h2>
        <p className="text-gray-600 dark:text-gray-400">{getSubtitle()}</p>
      </div>

      {/* PIN Display */}
      <div className="flex justify-center space-x-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
              i < getCurrentPin().length
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {i < getCurrentPin().length && (
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-center text-red-500 text-sm font-medium animate-shake">
          {error}
        </div>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all text-2xl font-bold text-gray-900 dark:text-white"
          >
            {num}
          </button>
        ))}
        <button
          onClick={onCancel}
          className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          Batal
        </button>
        <button
          onClick={() => handleNumberClick('0')}
          className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all text-2xl font-bold text-gray-900 dark:text-white"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="aspect-square rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          ⌫
        </button>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={getCurrentPin().length < 4}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all active:scale-[0.98]"
      >
        {step === 'confirm' ? 'Selesai' : 'Lanjutkan'}
      </button>
    </div>
  );
}
