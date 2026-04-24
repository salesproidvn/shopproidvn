import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  ArrowLeft, Image as ImageIcon, Plus, X, Youtube,
  Package, Tag, DollarSign, FileText, Eye, Loader2, TrendingUp, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import MediaLibrary from '../components/MediaLibrary';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const countWords = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Extract YouTube & TikTok URLs out of the `video_links` array into dedicated fields
const splitVideoLinks = (arr = []) => {
  let youtube = '';
  let tiktok = '';
  const rest = [];
  (arr || []).forEach((link) => {
    if (!link) return;
    const lower = link.toLowerCase();
    if (!youtube && (lower.includes('youtube.com') || lower.includes('youtu.be'))) {
      youtube = link;
    } else if (!tiktok && lower.includes('tiktok.com')) {
      tiktok = link;
    } else {
      rest.push(link);
    }
  });
  return { youtube, tiktok, rest };
};

export default function ProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const isNew = !productId || productId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaOptions, setMediaOptions] = useState({ multiple: false, maxSelect: 1 });
  const [mediaTarget, setMediaTarget] = useState(null); // 'thumbnail' | 'gallery'

  const [form, setForm] = useState({
    name: '',
    type: 'product',
    sku: '',
    category_id: 'none',
    price: '',
    out_of_stock: false,
    is_hidden: false,
    is_featured: false,
    description: '',
    images: [],
    image_url: '',
    youtube_url: '',
    tiktok_url: '',
    position: 0,
  });

  const themeColor = shop?.theme_color || '#0055FF';

  // Load shop, categories, and product (if editing)
  useEffect(() => {
    if (!user || user.role !== 'shop_owner') {
      navigate('/');
      return;
    }
    const load = async () => {
      try {
        const [shopRes, catsRes] = await Promise.all([
          axios.get(`${API}/dashboard/shop`),
          axios.get(`${API}/dashboard/categories`),
        ]);
        setShop(shopRes.data);
        setCategories(catsRes.data || []);
        if (!isNew) {
          const prodsRes = await axios.get(`${API}/dashboard/products`);
          const found = (prodsRes.data || []).find((p) => p.id === productId);
          if (!found) {
            toast.error('Không tìm thấy sản phẩm');
            navigate('/dashboard?tab=products');
            return;
          }
          const { youtube, tiktok, rest } = splitVideoLinks(found.video_links || []);
          setForm({
            name: found.name || '',
            type: found.type || 'product',
            sku: found.sku || '',
            category_id: found.category_id || 'none',
            price: (found.price ?? '').toString(),
            out_of_stock: !!found.out_of_stock,
            is_hidden: !!found.is_hidden,
            is_featured: !!found.is_featured,
            description: found.description || '',
            images: found.images || (found.image_url ? [found.image_url] : []),
            image_url: found.image_url || '',
            youtube_url: youtube || found.video_url || '',
            tiktok_url: tiktok || '',
            position: found.position || 0,
            _extra_videos: rest,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Không tải được dữ liệu sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, authLoading, user]);

  const wordCount = useMemo(() => countWords(form.description), [form.description]);

  const openMediaLibrary = (target) => {
    setMediaTarget(target);
    setMediaOptions(
      target === 'gallery'
        ? { multiple: true, maxSelect: Math.max(1, 8 - (form.images || []).length) }
        : { multiple: false, maxSelect: 1 }
    );
    setMediaOpen(true);
  };

  const handleMediaSelect = (urls) => {
    const newOnes = Array.isArray(urls) ? urls : [urls];
    if (mediaTarget === 'thumbnail') {
      const current = form.images || [];
      // put chosen at the front, dedup
      const combined = [newOnes[0], ...current.filter((u) => u !== newOnes[0])].slice(0, 8);
      setForm({ ...form, images: combined, image_url: combined[0] });
    } else {
      const combined = [...(form.images || []), ...newOnes].slice(0, 8);
      setForm({ ...form, images: combined, image_url: combined[0] || form.image_url });
    }
    setMediaOpen(false);
  };

  const removeImage = (idx) => {
    const imgs = [...(form.images || [])];
    imgs.splice(idx, 1);
    setForm({ ...form, images: imgs, image_url: imgs[0] || '' });
  };

  const setAsThumbnail = (idx) => {
    if (idx === 0) return;
    const imgs = [...form.images];
    const [moved] = imgs.splice(idx, 1);
    imgs.unshift(moved);
    setForm({ ...form, images: imgs, image_url: imgs[0] });
  };

  const buildPayload = () => {
    const videoLinks = [];
    const pushUnique = (v) => { const s = (v || '').trim(); if (s && !videoLinks.includes(s)) videoLinks.push(s); };
    pushUnique(form.youtube_url);
    pushUnique(form.tiktok_url);
    (form._extra_videos || []).forEach(pushUnique);
    return {
      name: form.name.trim(),
      type: form.type,
      sku: form.sku.trim(),
      category_id: form.category_id === 'none' ? null : form.category_id,
      price: parseInt(form.price, 10) || 0,
      out_of_stock: !!form.out_of_stock,
      is_hidden: !!form.is_hidden,
      is_featured: !!form.is_featured,
      description: form.description,
      images: form.images || [],
      image_url: (form.images && form.images[0]) || form.image_url || '',
      video_url: form.youtube_url?.trim() || form.tiktok_url?.trim() || '',
      video_links: videoLinks,
      position: parseInt(form.position, 10) || 0,
    };
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return; }
    if (!form.price || parseInt(form.price, 10) <= 0) { toast.error('Vui lòng nhập giá hợp lệ'); return; }
    if (wordCount > 1000) { toast.error('Mô tả vượt quá 1000 từ'); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isNew) {
        await axios.post(`${API}/dashboard/products`, payload);
        toast.success('Đã tạo sản phẩm');
      } else {
        await axios.put(`${API}/dashboard/products/${productId}`, payload);
        toast.success('Đã lưu sản phẩm');
      }
      navigate('/dashboard?tab=products');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#64748B]" />
      </div>
    );
  }

  const thumbnail = form.images && form.images[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0]" data-testid="product-edit-header">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard?tab=products')} className="text-sm" data-testid="edit-product-back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.backToProducts || 'Back'}
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[#0F172A] text-base sm:text-lg truncate" data-testid="edit-product-title">
              {isNew ? (t.addProduct || 'Add Product') : (t.editProduct || 'Edit Product')}
            </h1>
            {shop && <p className="text-xs text-[#64748B] truncate">{shop.name}</p>}
          </div>
          {!isNew && shop?.slug && (
            <Button asChild variant="outline" size="sm" className="text-xs hidden sm:inline-flex" data-testid="edit-product-view-storefront">
              <Link to={`/shop/${shop.slug}/product/${productId}`} target="_blank" rel="noreferrer">
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Link>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="text-sm" style={{ backgroundColor: themeColor }} data-testid="edit-product-save-btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {t.saveProduct || 'Save'}
          </Button>
        </div>
      </header>

      <form onSubmit={handleSave} className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ========== LEFT COLUMN: Media ========== */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-5 bg-white" data-testid="section-media">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>2</span>
                <h2 className="font-semibold text-[#0F172A] text-sm">{t.mediaGallery || 'Media Gallery'}</h2>
              </div>

              {/* Main Thumbnail */}
              <label className="block text-xs font-medium text-[#475569] mb-2">{t.mainThumbnail || 'Main Thumbnail'}</label>
              <button
                type="button"
                onClick={() => openMediaLibrary('thumbnail')}
                className="w-full aspect-square rounded-[8px] border-2 border-dashed border-[#E2E8F0] hover:border-[#94A3B8] bg-[#F8FAFC] flex items-center justify-center overflow-hidden transition-colors mb-4 group"
                data-testid="edit-product-thumbnail"
              >
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#94A3B8] group-hover:text-[#475569]">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-xs font-medium">{t.clickToUpload || 'Click to upload'}</span>
                  </div>
                )}
              </button>

              {/* Gallery Grid */}
              <label className="block text-xs font-medium text-[#475569] mb-2">
                {t.productImages || 'Product Images'} ({(form.images || []).length}/8)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {(form.images || []).map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-[6px] overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] group" data-testid={`edit-product-image-${idx}`}>
                    <img src={img} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setAsThumbnail(idx)} title={idx === 0 ? '' : (t.setAsThumbnail || 'Set as thumbnail')} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`edit-product-remove-image-${idx}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-[#0055FF]/85 text-white text-[8px] text-center py-0.5 font-semibold">
                        Thumbnail
                      </span>
                    )}
                  </div>
                ))}
                {(form.images || []).length < 8 && (
                  <button
                    type="button"
                    onClick={() => openMediaLibrary('gallery')}
                    className="aspect-square rounded-[6px] border-2 border-dashed border-[#E2E8F0] hover:border-[#94A3B8] bg-white flex items-center justify-center transition-colors"
                    data-testid="edit-product-add-image"
                  >
                    <Plus className="w-5 h-5 text-[#94A3B8]" />
                  </button>
                )}
              </div>

              {/* Video URLs */}
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" /> {t.youtubeUrl || 'YouTube URL'}
                  </label>
                  <Input
                    value={form.youtube_url}
                    onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="text-sm"
                    data-testid="edit-product-youtube-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1 flex items-center gap-1.5">
                    <span className="inline-block w-3.5 h-3.5 bg-black rounded-sm flex items-center justify-center text-white text-[8px] font-bold">T</span>
                    {t.tiktokUrl || 'TikTok URL'}
                  </label>
                  <Input
                    value={form.tiktok_url}
                    onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                    placeholder="https://tiktok.com/@user/video/..."
                    className="text-sm"
                    data-testid="edit-product-tiktok-input"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* ========== RIGHT SECTION ========== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Type & Identification */}
            <Card className="p-5 bg-white" data-testid="section-type">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>1</span>
                <h2 className="font-semibold text-[#0F172A] text-sm">{t.typeAndId || 'Type & Identification'}</h2>
              </div>

              {/* Type radios */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { value: 'product', label: 'Sản phẩm' },
                  { value: 'service', label: 'Dịch vụ' },
                ].map((opt) => {
                  const selected = form.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: opt.value })}
                      className={`py-3 rounded-[6px] border text-sm font-medium transition-colors ${selected ? 'text-white border-transparent' : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'}`}
                      style={selected ? { backgroundColor: themeColor } : {}}
                      data-testid={`edit-product-type-${opt.value}`}
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 mr-2 align-middle"
                        style={{ borderColor: selected ? '#fff' : '#CBD5E1', backgroundColor: selected ? 'transparent' : '#fff' }}>
                        {selected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> {t.productName || 'Product/Service Name'} *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="text-sm"
                    data-testid="edit-product-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> SKU
                  </label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. WH-001"
                    className="text-sm"
                    data-testid="edit-product-sku-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#475569] mb-1">{t.category || 'Category'}</label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger className="text-sm" data-testid="edit-product-category-select">
                      <SelectValue placeholder={t.selectCategory} />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-64">
                      <SelectItem value="none">{t.none || 'None'}</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.parent_id ? `└ ${c.name}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Section 3: Pricing & Logistics */}
            <Card className="p-5 bg-white" data-testid="section-pricing">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>3</span>
                <h2 className="font-semibold text-[#0F172A] text-sm">{t.pricingLogistics || 'Pricing & Logistics'}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> {t.productPrice || 'Price'} *
                  </label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="text-sm"
                    data-testid="edit-product-price-input"
                  />
                </div>
                <ToggleRow
                  checked={form.out_of_stock}
                  onChange={(v) => setForm({ ...form, out_of_stock: v })}
                  label={t.outOfStock || 'Out of Stock'}
                  desc={t.outOfStockDesc}
                  themeColor={themeColor}
                  testId="edit-product-out-of-stock-toggle"
                />
              </div>
            </Card>

            {/* Section 4: Detailed Information */}
            <Card className="p-5 bg-white" data-testid="section-description">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>4</span>
                <h2 className="font-semibold text-[#0F172A] text-sm flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> {t.detailedInformation || 'Detailed Information'}
                </h2>
                <span className="ml-auto text-[10px] text-[#94A3B8]">
                  <span className={wordCount > 1000 ? 'text-red-500 font-semibold' : ''} data-testid="edit-product-word-count">{wordCount}</span>/1000 {t.wordCount || 'từ'}
                </span>
              </div>
              <ReactQuill
                theme="snow"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                modules={quillModules}
                className="bg-white [&_.ql-container]:min-h-[180px]"
              />
            </Card>

            {/* Section 5: Visibility & Promotion */}
            <Card className="p-5 bg-white" data-testid="section-visibility">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>5</span>
                <h2 className="font-semibold text-[#0F172A] text-sm">{t.visibilityPromotion || 'Visibility & Promotion'}</h2>
              </div>
              <div className="space-y-3">
                <ToggleRow
                  checked={form.is_featured}
                  onChange={(v) => setForm({ ...form, is_featured: v })}
                  label={<span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {t.featuredProducts || 'Feature Product'}</span>}
                  desc={t.featuredProductDesc}
                  themeColor={themeColor}
                  testId="edit-product-featured-toggle"
                />
                <ToggleRow
                  checked={form.is_hidden}
                  onChange={(v) => setForm({ ...form, is_hidden: v })}
                  label={t.isHidden || 'Hidden from Listing'}
                  desc={t.isHiddenDesc}
                  themeColor={themeColor}
                  testId="edit-product-is-hidden-toggle"
                />
              </div>
            </Card>

            {/* Mobile save bar */}
            <div className="lg:hidden sticky bottom-4">
              <Button type="submit" disabled={saving} className="w-full text-sm" style={{ backgroundColor: themeColor }} data-testid="edit-product-save-btn-mobile">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {t.saveProduct || 'Save product'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <MediaLibrary
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleMediaSelect}
        multiple={mediaOptions.multiple}
        maxSelect={mediaOptions.maxSelect}
      />
    </div>
  );
}

function ToggleRow({ checked, onChange, label, desc, themeColor, testId }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#F8FAFC] rounded-[6px] border border-[#E2E8F0]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#0F172A]">{label}</p>
        {desc && <p className="text-[11px] text-[#64748B] mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-[54px] h-7 rounded-full transition-all relative overflow-hidden flex-shrink-0 ${checked ? '' : 'bg-[#E2E8F0]'}`}
        style={checked ? { backgroundColor: themeColor } : {}}
        data-testid={testId}
        aria-pressed={checked}
      >
        <span className={`absolute top-[2.5px] w-[22px] h-[22px] bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[29px]' : 'translate-x-[3px]'}`} />
      </button>
    </div>
  );
}
