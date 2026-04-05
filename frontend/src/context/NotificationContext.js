import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { formatVND } from '../utils/format';
import { toast } from 'sonner';

const NotificationContext = createContext(null);

// Simple event bus for cross-component notification
const listeners = new Set();
export const emitNotification = (notification) => {
  listeners.forEach(fn => fn(notification));
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('app_notifications') || '[]');
    } catch { return []; }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Listen for new notifications
  useEffect(() => {
    const handler = (notification) => {
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...notification,
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
        localStorage.setItem('app_notifications', JSON.stringify(updated));
        return updated;
      });

      // Show toast
      if (notification.type === 'new_order') {
        toast.success(`🛒 ${notification.title}`, {
          description: notification.message,
          duration: 5000,
        });
      }
    };

    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.setItem('app_notifications', '[]');
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
