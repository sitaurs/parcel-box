import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarProps {
  message: string;
  type?: SnackbarType;
  duration?: number;
  onClose: () => void;
}

export function Snackbar({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: SnackbarProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const Icon = icons[type];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div
        className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-md`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="hover:bg-white hover:bg-opacity-20 rounded p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
