import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomPage = () => {
  const { slug, pageSlug } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const [shopRes, pageRes] = await Promise.all([
          axios.get(`${API}/shop/${slug}`),
          axios.get(`${API}/shop/${slug}/page/${pageSlug}`)
        ]);
        setShop(shopRes.data);
        setPage(pageRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Page not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, pageSlug]);

  const themeColor = shop?.theme_color || '#0055FF';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">{error}</h1>
        <Button variant="outline" onClick={() => navigate(-1)} data-testid="page-back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}
        </Button>
      </div>
    );
  }

  const getYouTubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-white" data-testid="custom-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(`/shop/${slug}`)} data-testid="custom-page-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {shop?.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                  <span className="text-white font-bold text-xs">{shop?.name?.[0]}</span>
                </div>
              )}
              <span className="font-bold text-sm text-[#0F172A]">{page?.title}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-8" data-testid="custom-page-title">{page?.title}</h1>

        <div className="space-y-8">
          {(page?.sections || []).map((section, idx) => (
            <div key={idx} data-testid={`page-section-${idx}`}>
              {section.type === 'text' && (
                <div className="prose prose-sm sm:prose max-w-none text-[#334155] break-words [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:overflow-x-auto" data-testid={`section-text-${idx}`}>
                  <div dangerouslySetInnerHTML={{ __html: section.content || '' }} />
                </div>
              )}

              {section.type === 'image' && section.url && (
                <div className="rounded-[5px] overflow-hidden" data-testid={`section-image-${idx}`}>
                  <img src={section.url} alt={section.alt || ''} className="w-full h-auto max-h-[500px] object-cover rounded-[5px]" />
                  {section.caption && <p className="text-sm text-[#64748B] mt-2 text-center">{section.caption}</p>}
                </div>
              )}

              {section.type === 'link' && (
                <a href={section.url} target={section.url?.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: themeColor }}
                  data-testid={`section-link-${idx}`}>
                  {section.text || section.url}
                  {section.url?.startsWith('http') && <ExternalLink className="w-3.5 h-3.5" />}
                </a>
              )}

              {section.type === 'video' && section.url && (() => {
                const ytId = getYouTubeId(section.url);
                return ytId ? (
                  <div className="aspect-video rounded-[5px] overflow-hidden bg-black" data-testid={`section-video-${idx}`}>
                    <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
                  </div>
                ) : (
                  <a href={section.url} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: themeColor }}>{section.url}</a>
                );
              })()}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CustomPage;
