import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Bell, Check, Trash2, ShoppingCart, X } from 'lucide-react';

const NotificationBell = ({ className = '' }) => {
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.justNow;
    if (mins < 60) return `${mins} ${t.minutesAgo}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t.hoursAgo}`;
    return `${Math.floor(hours / 24)} ${t.daysAgo}`;
  };

  return (
    <div className={`relative ${className}`} ref={ref} data-testid="notification-bell-wrapper">
      <Button
        variant="ghost"
        className="relative p-2 hover:bg-white/10 rounded-full"
        onClick={() => setOpen(!open)}
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse" data-testid="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] z-[100] overflow-hidden" data-testid="notification-dropdown">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="font-semibold text-[#0F172A] text-sm">{t.notifications}</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#0055FF] hover:underline px-2 py-1" data-testid="mark-all-read">
                  {t.markAllRead}
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 px-2 py-1" data-testid="clear-notifications">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-[#E2E8F0] mx-auto mb-2" />
                <p className="text-sm text-[#94A3B8]">{t.noNotifications}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                  data-testid={`notification-${notif.id}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'new_order' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <ShoppingCart className={`w-4 h-4 ${notif.type === 'new_order' ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-[#0F172A]' : 'text-[#64748B]'}`}>{notif.title}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{notif.message}</p>
                    <p className="text-[10px] text-[#CBD5E1] mt-1">{formatTime(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-[#0055FF] rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
