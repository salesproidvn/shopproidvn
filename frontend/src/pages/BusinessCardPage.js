import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Phone, Mail, MapPin, Facebook, Instagram, Globe, Download, MessageCircle, Share2, X, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BusinessCardPage = () => {
  const { cardSlug } = useParams();
  const { t } = useLanguage();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => { fetchCard(); }, [cardSlug]);

  useEffect(() => {
    if (card?.display_name) document.title = `${card.display_name} - ${card.shop_name || ''}`;
    return () => { document.title = 'Ocean Pro Web'; };
  }, [card]);

  const fetchCard = async () => {
    try {
      const { data } = await axios.get(`${API}/card/${cardSlug}`);
      setCard(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Card not found');
    } finally { setLoading(false); }
  };

  const cardPermalink = `${window.location.origin}/card/${cardSlug}`;

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
      `URL:${cardPermalink}`,
      'END:VCARD',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
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
      navigator.clipboard?.writeText(ogUrl)?.then(() => toast.success('Link copied!'))?.catch(() => {
        const ta = document.createElement('textarea'); ta.value = ogUrl; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        toast.success('Link copied!');
      });
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

      {/* Two Prominent Buttons: Save Contact + QR Code */}
      <div className="max-w-md mx-auto w-full px-6 -mt-7 relative z-20">
        <div className="flex gap-3">
          <button
            onClick={handleSaveVCF}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: themeColor }}
            data-testid="card-save-contact-btn"
          >
            <Download className="w-5 h-5" />
            {t.saveContact || 'Lưu danh bạ'}
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm shadow-lg border-2 hover:opacity-90 transition-opacity bg-white"
            style={{ borderColor: themeColor, color: themeColor }}
            data-testid="card-qr-btn"
          >
            <QrCode className="w-5 h-5" />
            {t.scanQR || 'Quét mã QR'}
          </button>
        </div>
      </div>

      {/* Contact Actions Row */}
      <div className="max-w-md mx-auto w-full px-6 mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-3 flex justify-center gap-1" data-testid="card-actions">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors flex-1" data-testid="card-call">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '12' }}>
                <Phone className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] font-medium text-[#64748B]">{t.call || 'Gọi điện'}</span>
            </a>
          )}
          {card.phone && (
            <a href={`https://zalo.me/${card.phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors flex-1" data-testid="card-zalo">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '12' }}>
                <MessageCircle className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] font-medium text-[#64748B]">Zalo</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors flex-1" data-testid="card-email">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '12' }}>
                <Mail className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] font-medium text-[#64748B]">Email</span>
            </a>
          )}
          <button onClick={handleShare} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors flex-1" data-testid="card-share-action">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '12' }}>
              <Share2 className="w-4 h-4" style={{ color: themeColor }} />
            </div>
            <span className="text-[10px] font-medium text-[#64748B]">{t.share || 'Chia sẻ'}</span>
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
          <h2 className="text-base font-bold text-[#0F172A] mb-3">{t.products || 'Sản phẩm'}</h2>
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

      <div className="h-8" />

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowQR(false)} data-testid="qr-modal">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F172A]">{t.scanQR || 'Quét mã QR'}</h3>
              <button onClick={() => setShowQR(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F1F5F9]">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl border-2" style={{ borderColor: themeColor + '30' }}>
                <QRCodeSVG
                  value={cardPermalink}
                  size={220}
                  level="H"
                  fgColor={themeColor}
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-[#94A3B8] mt-3 text-center">{card.display_name}</p>
              <p className="text-[10px] text-[#CBD5E1] mt-0.5 text-center break-all">{cardPermalink}</p>
              <button
                onClick={handleSaveVCF}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: themeColor }}
                data-testid="qr-save-contact"
              >
                <Download className="w-4 h-4" />
                {t.saveContact || 'Lưu danh bạ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCardPage;
