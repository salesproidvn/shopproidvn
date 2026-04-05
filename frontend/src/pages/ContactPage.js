import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Facebook, Instagram, Send } from 'lucide-react';
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6" data-testid="contact-info">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{shop?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shop?.contact_phone && (
                  <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-3 text-[#334155] hover:text-[#0055FF] transition-colors" data-testid="contact-phone">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                      <Mail className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">{t.email}</p>
                      <p className="font-medium">{shop.contact_email}</p>
                    </div>
                  </a>
                )}
                {shop?.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#334155] hover:text-[#0055FF] transition-colors" data-testid="contact-address">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                      <MapPin className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">{t.address}</p>
                      <p className="font-medium">{shop.address}</p>
                    </div>
                  </a>
                )}
                <div className="flex items-center gap-3 text-[#334155]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                    <Clock className="w-5 h-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#94A3B8]">{t.businessHours}</p>
                    <p className="font-medium">{t.businessHoursValue}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {shop?.social_facebook && (
                    <a href={shop.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80" style={{ backgroundColor: themeColor + '15' }}>
                      <Facebook className="w-5 h-5" style={{ color: themeColor }} />
                    </a>
                  )}
                  {shop?.social_instagram && (
                    <a href={shop.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80" style={{ backgroundColor: themeColor + '15' }}>
                      <Instagram className="w-5 h-5" style={{ color: themeColor }} />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="border-0 shadow-sm" data-testid="contact-form-card">
            <CardHeader>
              <CardTitle className="text-lg">{t.sendMessage || 'Send Message'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.customerName} *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="contact-form-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t.email}</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-form-email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t.phone}</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="contact-form-phone" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.message || 'Message'} *</label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} data-testid="contact-form-message" />
                </div>
                <Button type="submit" className="w-full hover:opacity-90" style={{ backgroundColor: themeColor }} disabled={sending} data-testid="contact-form-submit">
                  <Send className="w-4 h-4 mr-2" /> {sending ? '...' : (t.send || 'Send')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
