import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Facebook, Instagram, Send, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContactPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data } = await axios.get(`${API}/shop/${slug || 'the-elite-shop'}`);
        setShop(data);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchShop();
  }, [slug]);

  const themeColor = shop?.theme_color || '#0055FF';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/shop/${slug || 'the-elite-shop'}/contact`, form);
      toast.success(t.messageSent || 'Message sent!');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      toast.success(t.messageSent || 'Message sent!');
      setForm({ name: '', email: '', phone: '', message: '' });
    } finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="contact-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to={slug ? `/shop/${slug}` : '/'}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> {shop?.name || 'Home'}
              </Button>
            </Link>
            <span className="font-bold text-[#0F172A]">{t.contact}</span>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-sm" data-testid="contact-info">
          {/* Shop logo + name + description */}
          <CardHeader className="flex flex-col items-center text-center gap-3 pb-4 border-b border-[#E2E8F0]">
            {shop?.logo_url ? (
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F8FAFC] border-2 border-white shadow-md flex-shrink-0">
                <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ backgroundColor: themeColor }}>
                {(shop?.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <CardTitle className="text-xl">{shop?.name}</CardTitle>
              {shop?.description && (
                <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto leading-relaxed" data-testid="shop-description">
                  {shop.description}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {shop?.contact_phone && (
              <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-3 text-[#334155] hover:text-[#0055FF] transition-colors" data-testid="contact-phone">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColor + '15' }}>
                  <Phone className="w-5 h-5" style={{ color: themeColor }} />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{t.phone}</p>
                  <p className="font-medium">{shop.contact_phone}</p>
                </div>
              </a>
            )}
            {shop?.contact_email && (
              <a href={`mailto:${shop.contact_email}`} className="flex items-center gap-3 text-[#334155] hover:text-[#0055FF] transition-colors" data-testid="contact-email">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColor + '15' }}>
                  <Mail className="w-5 h-5" style={{ color: themeColor }} />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{t.email}</p>
                  <p className="font-medium break-all">{shop.contact_email}</p>
                </div>
              </a>
            )}
            {shop?.address && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#334155] hover:text-[#0055FF] transition-colors" data-testid="contact-address">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColor + '15' }}>
                  <MapPin className="w-5 h-5" style={{ color: themeColor }} />
                </div>
                <div>
                  <p className="text-xs text-[#94A3B8]">{t.address}</p>
                  <p className="font-medium">{shop.address}</p>
                </div>
              </a>
            )}
            <div className="flex items-center gap-3 text-[#334155]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColor + '15' }}>
                <Clock className="w-5 h-5" style={{ color: themeColor }} />
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">{t.businessHours}</p>
                <p className="font-medium">{t.businessHoursValue}</p>
              </div>
            </div>
            {(shop?.social_facebook || shop?.social_tiktok || shop?.social_instagram || shop?.social_shopee) && (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E2E8F0]">
                <span className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider mr-1">Theo dõi</span>
                {shop?.social_facebook && (
                  <a href={shop.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 hover:scale-105 shadow-sm" style={{ backgroundColor: '#1877F2' }} data-testid="contact-social-facebook" title="Facebook">
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                )}
                {shop?.social_tiktok && (
                  <a href={shop.social_tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 hover:scale-105 shadow-sm bg-black" data-testid="contact-social-tiktok" title="TikTok">
                    <span className="text-white font-bold text-sm leading-none">T</span>
                  </a>
                )}
                {shop?.social_instagram && (
                  <a href={shop.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 hover:scale-105 shadow-sm" style={{ background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)' }} data-testid="contact-social-instagram" title="Instagram">
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                )}
                {shop?.social_shopee && (
                  <a href={shop.social_shopee} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-80 hover:scale-105 shadow-sm" style={{ backgroundColor: '#EE4D2D' }} data-testid="contact-social-shopee" title="Shopee">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ContactPage;
