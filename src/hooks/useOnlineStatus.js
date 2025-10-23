import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook to detect online/offline status
 * Listens to browser online/offline events and shows notifications
 *
 * @returns {boolean} isOnline - Current online status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restablecida', {
        description: 'Tu conexión a internet ha sido restablecida',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión a internet', {
        description: 'Verifica tu conexión de red',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
