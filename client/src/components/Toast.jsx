import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const Toast = ({ message, type = 'info', onDismiss, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  const bgMap = {
    info: 'bg-primary/90 border-primary',
    success: 'bg-accent/90 border-accent',
    warning: 'bg-amber-500/90 border-amber-500',
    error: 'bg-red-500/90 border-red-500'
  };

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg border shadow-2xl backdrop-blur-sm text-white animate-slide-in ${bgMap[type] || bgMap.info}`}>
      <Sparkles className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); onDismiss?.(); }} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
