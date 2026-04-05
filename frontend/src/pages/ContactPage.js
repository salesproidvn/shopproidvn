import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Phone, Mail, MapPin, Clock, Send, ArrowLeft, Facebook, Instagram, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { mockShops } from '../utils/mockData';

const ContactPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const shop = mockShops.find(s => s.slug === slug) || mockShops[0];

  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(t.messageSent);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="contact-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to={slug ? `/shop/${slug}` : '/'}>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-btn">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-[#0055FF] rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{shop.name[0]}</span>
              </div>
              <span className="font-bold text-lg text-[#0F172A]">{shop.name}</span>
            </div>
            {user && (user.role === 'shop_owner' || user.role === 'super_admin') && (
              <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} data-testid="contact-dashboard-btn">
                <Button variant="outline" className="rounded-full px-4 text-sm border-[#0055FF] text-[#0055FF] hover:bg-[#0055FF] hover:text-white">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t.dashboard}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-3">{t.contactUs}</h1>
          <p className="text-[#64748B] text-lg">{t.contactDesc}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A] text-lg mb-4">{t.contactInfo}</h3>
              <div className="space-y-4">
                {shop.contact_phone && (
                  <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-4 group" data-testid="contact-phone">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">{t.phone}</p>
                      <p className="font-medium text-[#0F172A]">{shop.contact_phone}</p>
                    </div>
                  </a>
                )}
                {shop.contact_email && (
                  <a href={`mailto:${shop.contact_email}`} className="flex items-center gap-4 group" data-testid="contact-email">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">{t.email}</p>
                      <p className="font-medium text-[#0F172A]">{shop.contact_email}</p>
                    </div>
                  </a>
                )}
                {shop.address && (
                  <div className="flex items-center gap-4" data-testid="contact-address">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">{t.address}</p>
                      <p className="font-medium text-[#0F172A]">{shop.address}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4" data-testid="contact-hours">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">{t.businessHours}</p>
                    <p className="font-medium text-[#0F172A]">{t.businessHoursValue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#0F172A] mb-4">{t.quickLinks}</h3>
              <div className="flex gap-3">
                {shop.social_facebook && (
                  <a href={shop.social_facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2]/10 text-[#1877F2] rounded-xl font-medium text-sm hover:bg-[#1877F2]/20 transition-colors" data-testid="contact-facebook">
                    <Facebook className="w-5 h-5" /> Facebook
                  </a>
                )}
                {shop.social_instagram && (
                  <a href={shop.social_instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#E4405F]/10 text-[#E4405F] rounded-xl font-medium text-sm hover:bg-[#E4405F]/20 transition-colors" data-testid="contact-instagram">
                    <Instagram className="w-5 h-5" /> Instagram
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]">
            <h3 className="font-semibold text-[#0F172A] text-lg mb-4">{t.sendMessage}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.yourName}</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="contact-name-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.yourEmail}</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="contact-email-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.yourMessage}</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5}
                  className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] resize-none"
                  data-testid="contact-message-input" />
              </div>
              <Button type="submit" className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-xl py-6" data-testid="contact-submit">
                <Send className="w-4 h-4 mr-2" /> {t.sendMessage}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
