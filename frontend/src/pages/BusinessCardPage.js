import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Phone, Mail, MapPin, Facebook, Instagram, Globe, Download, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BusinessCardPage = () => {
  const { cardSlug } = useParams();
  const { t } = useLanguage();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCard();
  }, [cardSlug]);

  useEffect(() => {
    if (card?.display_name) {
      document.title = `${card.display_name} - ${card.shop_name || ''}`;
    }
    return () => { document.title = 'Ocean Pro Web'; };
  }, [card]);

  const fetchCard = async () => {
    try {
      const { data } = await axios.get(`${API}/card/${cardSlug}`);
      setCard(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Card not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVCF = () => {
    if (!card) return;
    const esc = (s) => s ? s.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;') : '';
    const lines = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `FN:${esc(card.display_name || '')}`,
      card.title ? `TITLE:${esc(card.title)}` : null,
      card.shop_name ? `ORG:${esc(card.shop_name)}` : null,
      card.phone ? `TEL;TYPE=WORK:${card.phone.replace(/\s/g, '')}` : null,
      card.email ? `EMAIL;TYPE=WORK:${card.email}` : null,
      card.address ? `ADR;TYPE=WORK:;;${esc(card.address)};;;;` : null,
      card.website ? `URL:${card.website}` : null,
      card.avatar_url ? `PHOTO;VALUE=URI:${card.avatar_url}` : (card.logo_url ? `PHOTO;VALUE=URI:${card.logo_url}` : null),
      card.social_facebook ? `X-SOCIALPROFILE;TYPE=facebook:${card.social_facebook}` : null,
      card.social_instagram ? `X-SOCIALPROFILE;TYPE=instagram:${card.social_instagram}` : null,
      `URL:${window.location.href}`,
      'END:VCARD',
    ].filter(Boolean);
    const vcard = lines.join('\r\n');
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${card.display_name || 'contact'}.vcf`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const ogUrl = `${process.env.REACT_APP_BACKEND_URL}/api/og/card/${cardSlug}`;
    if (navigator.share) {
      navigator.share({ title: card.display_name, text: `${card.display_name} - ${card.shop_name}`, url: ogUrl });
    } else {
      navigator.clipboard.writeText(ogUrl);
      toast.success(t.linkCopied || 'Link copied!');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]"><p className="text-[#64748B]">{error}</p></div>;
  if (!card) return null;

  const themeColor = card.theme_color || '#0055FF';
  const hasProducts = card.products && card.products.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center" data-testid="business-card-page">
      {/* Card Header */}
      <div className="w-full" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}>
        <div className="max-w-md mx-auto px-6 pt-10 pb-16 text-center text-white">
          {(card.avatar_url || card.logo_url) && (
            <img src={card.avatar_url || card.logo_url} alt="" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/30 shadow-lg" data-testid="card-avatar" />
          )}
          <h1 className="text-2xl font-bold mb-1" data-testid="card-name">{card.display_name}</h1>
          {card.title && <p className="text-white/80 text-sm mb-1" data-testid="card-title">{card.title}</p>}
          {card.shop_name && <p className="text-white/60 text-xs">{card.shop_name}</p>}
        </div>
      </div>

      {/* Contact Actions */}
      <div className="max-w-md mx-auto w-full px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-4 gap-2" data-testid="card-actions">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors" data-testid="card-call">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                <Phone className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] font-medium text-[#64748B]">{t.call || 'Gọi'}</span>
            </a>
          )}
          {card.phone && (
            <a href={`https://zalo.me/${card.phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors" data-testid="card-zalo">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                <MessageCircle className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] font-medium text-[#64748B]">Zalo</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors" data-testid="card-email">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                <Mail className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] font-medium text-[#64748B]">Email</span>
            </a>
          )}
          <button onClick={handleSaveVCF} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors" data-testid="card-save-contact">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
              <Download className="w-4 h-4" style={{ color: themeColor }} />
            </div>
            <span className="text-[10px] font-medium text-[#64748B]">{t.save || 'Lưu'}</span>
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="max-w-md mx-auto w-full px-6 mt-4 space-y-3">
        {card.phone && (
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <Phone className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <a href={`tel:${card.phone}`} className="text-sm text-[#334155] hover:underline">{card.phone}</a>
          </div>
        )}
        {card.email && (
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <Mail className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <a href={`mailto:${card.email}`} className="text-sm text-[#334155] hover:underline break-all">{card.email}</a>
          </div>
        )}
        {card.address && (
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <MapPin className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <span className="text-sm text-[#334155]">{card.address}</span>
          </div>
        )}
        {card.website && (
          <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <Globe className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#334155] hover:underline break-all">{card.website}</a>
          </div>
        )}

        {/* Social Links */}
        {(card.social_facebook || card.social_instagram || card.social_zalo) && (
          <div className="bg-white rounded-xl p-3 flex items-center gap-4 shadow-sm justify-center">
            {card.social_facebook && (
              <a href={card.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F1F5F9] transition-colors" data-testid="card-facebook">
                <Facebook className="w-5 h-5 text-[#1877F2]" />
              </a>
            )}
            {card.social_instagram && (
              <a href={card.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F1F5F9] transition-colors" data-testid="card-instagram">
                <Instagram className="w-5 h-5 text-[#E4405F]" />
              </a>
            )}
            {card.social_zalo && (
              <a href={`https://zalo.me/${card.social_zalo}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F1F5F9] transition-colors" data-testid="card-zalo-link">
                <MessageCircle className="w-5 h-5 text-[#0068FF]" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      {hasProducts && (
        <div className="max-w-md mx-auto w-full px-6 mt-6">
          <h2 className="text-base font-bold text-[#0F172A] mb-3">{t.products || 'San pham'}</h2>
          <div className="grid grid-cols-2 gap-3">
            {card.products.map(p => (
              <a key={p.id} href={`/shop/${card.shop_slug}?product=${p.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-testid={`card-product-${p.id}`}>
                <div className="aspect-square bg-[#F8FAFC]">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5 text-center">
                  <h3 className="text-xs font-medium text-[#0F172A] line-clamp-2 mb-0.5">{p.name}</h3>
                  <p className="text-sm font-bold" style={{ color: themeColor }}>{formatVND(p.price)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Share Button */}
      <div className="max-w-md mx-auto w-full px-6 mt-6 mb-8">
        <Button onClick={handleShare} variant="outline" className="w-full py-5 rounded-xl text-sm" data-testid="card-share-btn">
          <Share2 className="w-4 h-4 mr-2" /> {t.share || 'Chia se'}
        </Button>
      </div>
    </div>
  );
};

export default BusinessCardPage;
