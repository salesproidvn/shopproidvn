import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Phone, MessageCircle, Info, X } from 'lucide-react';

const FloatingActions = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Extract slug if on a storefront page
  const slugMatch = location.pathname.match(/^\/shop\/([^/]+)/);
  const slug = slugMatch ? slugMatch[1] : null;

  const actions = [
    { id: 'call', icon: Phone, label: t.call || 'Call', color: 'bg-green-500 hover:bg-green-600', href: 'tel:+84912345678' },
    { id: 'message', icon: MessageCircle, label: t.message || 'Message', color: 'bg-blue-500 hover:bg-blue-600', href: 'mailto:hello@theeliteshop.com' },
    { id: 'info', icon: Info, label: t.info || 'Info', color: 'bg-amber-500 hover:bg-amber-600', href: null, action: () => navigate(slug ? `/shop/${slug}/contact` : '/contact') },
  ];

  // Hide on dashboard/admin pages
  if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none" data-testid="floating-actions">
      {/* Expanded action buttons */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${expanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {actions.map((action) => (
          <div key={action.id} className="flex items-center gap-2 pointer-events-auto">
            <span className="bg-white text-[#0F172A] text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              {action.label}
            </span>
            {action.href ? (
              <a href={action.href} data-testid={`floating-${action.id}`}
                className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110`}>
                <action.icon className="w-5 h-5" />
              </a>
            ) : (
              <button onClick={action.action} data-testid={`floating-${action.id}`}
                className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110`}>
                <action.icon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 pointer-events-auto ${expanded ? 'bg-[#0F172A] rotate-0' : 'bg-[#0055FF] rotate-0'} hover:scale-110`}
        data-testid="floating-toggle"
      >
        {expanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
};

export default FloatingActions;
