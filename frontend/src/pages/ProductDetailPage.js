import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, ShoppingCart, Share2, Play, Plus, Minus, Trash2, Calendar, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { safeShare } from '../utils/share';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const formatVND = (price) => {
  if (!price && price !== 0) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getVideoEmbed = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', embed: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return { type: 'tiktok', embed: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };
  return null;
};

const ProductDetailPage = () => {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, cartCount, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', preferred_datetime: '', note: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [shopRes, productsRes] = await Promise.all([
          axios.get(`${API}/shop/${slug}`),
          axios.get(`${API}/shop/${slug}/products`),
        ]);
        setShop(shopRes.data);
        const found = productsRes.data.find(p => p.id === productId);
        if (found) {
          setProduct(found);
          setRelatedProducts(productsRes.data.filter(p => p.category_id === found.category_id && p.id !== found.id).slice(0, 4));
          document.title = `${found.name} - ${shopRes.data.name}`;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [slug, productId]);

  const themeColor = shop?.theme_color || '#0055FF';

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto px-4 flex items-center h-14">
            <div className="h-5 w-20 bg-[#E2E8F0] rounded animate-pulse" />
            <div className="flex-1" />
            <div className="h-5 w-24 bg-[#E2E8F0] rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-[#F1F5F9] rounded-lg animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-[#E2E8F0] rounded animate-pulse" />
              <div className="h-10 w-1/3 bg-[#E2E8F0] rounded animate-pulse" />
              <div className="h-12 w-full bg-[#F1F5F9] rounded animate-pulse" />
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-4 bg-[#F1F5F9] rounded animate-pulse" />)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Sản phẩm không tồn tại</p>
          <Link to={`/shop/${slug}`}><Button>Quay lại cửa hàng</Button></Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image_url || '/product-fallback.png'];
  const allVideos = (() => {
    const seen = new Set();
    const out = [];
    const addFromUrl = (url) => {
      if (!url) return;
      const v = getVideoEmbed(url);
      if (!v) return;
      if (seen.has(v.embed)) return;
      seen.add(v.embed);
      out.push(v);
    };
    addFromUrl(product.video_url);
    (product.video_links || []).forEach(addFromUrl);
    return out;
  })();
  const activeVid = showVideo !== null ? allVideos[showVideo] : null;

  const handleShare = () => {
    const ogUrl = `${process.env.REACT_APP_BACKEND_URL}/api/og/shop/${slug}/product/${product.id}`;
    safeShare(
      { title: product.name, text: `${product.name} - ${formatVND(product.price)}`, url: ogUrl },
      { successMessage: t.linkCopied || 'Đã copy link!' }
    );
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.customer_name.trim() || !bookingForm.customer_phone.trim() || !bookingForm.preferred_datetime) {
      toast.error('Vui lòng điền đầy đủ Họ tên, SĐT và Thời gian mong muốn');
      return;
    }
    setBookingSubmitting(true);
    try {
      await axios.post(`${API}/shop/${slug}/bookings`, {
        service_id: product.id,
        customer_name: bookingForm.customer_name.trim(),
        customer_phone: bookingForm.customer_phone.trim(),
        customer_email: bookingForm.customer_email.trim(),
        preferred_datetime: bookingForm.preferred_datetime,
        note: bookingForm.note.trim(),
      });
      toast.success('Đã gửi yêu cầu đặt lịch! Chúng tôi sẽ liên hệ xác nhận sớm.');
      setShowBooking(false);
      setBookingForm({ customer_name: '', customer_phone: '', customer_email: '', preferred_datetime: '', note: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gửi yêu cầu thất bại');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const isService = product?.type === 'service';

  return (
    <div className="min-h-screen bg-white" data-testid="product-detail-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => {
                // Go back if we have internal history, otherwise fall back to shop home
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(`/shop/${slug}`);
                }
              }}
              className="flex items-center gap-2 text-base font-semibold text-[#0F172A] hover:opacity-70 transition-opacity px-3 py-2 -ml-3 rounded-lg"
              data-testid="product-back-btn">
              <ArrowLeft className="w-5 h-5" /> {t.back || 'Quay lại'}
            </button>
            <Link to={`/shop/${slug}`} className="font-bold text-[#0F172A] text-base truncate max-w-[200px] hover:opacity-70 transition-opacity">{shop.name}</Link>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowCart(true)} className="relative text-[#334155] hover:text-[#0F172A] transition-colors" data-testid="product-cart-btn" aria-label="Giỏ hàng">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: '#EF4444' }} data-testid="product-cart-count">
                    {cartCount}
                  </span>
                )}
              </button>
              <button onClick={handleShare} className="flex items-center text-[#334155] hover:text-[#0F172A] transition-colors" data-testid="product-share-btn">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col md:grid md:grid-cols-2 md:items-start gap-4 sm:gap-8">
          {/* Image Gallery — sticky on desktop so it stays visible while info scrolls */}
          <div className="flex flex-col w-full md:sticky md:top-20 md:self-start">
            <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden rounded-lg" data-testid="product-main-image">
              {activeVid ? (
                <iframe src={activeVid.embed} title="Product video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={activeVid.type === 'tiktok' ? { maxWidth: '325px', margin: '0 auto' } : {}} />
              ) : (
                <img src={images[activeImage]} alt={product.name} className="w-full h-full object-contain" loading="eager" />
              )}
            </div>
            {(images.length > 1 || allVideos.length > 0) && (
              <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 scrollbar-hide" data-testid="product-thumbnails">
                {images.map((img, idx) => (
                  <button key={`img-${idx}`} onClick={() => { setActiveImage(idx); setShowVideo(null); }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${showVideo === null && activeImage === idx ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                    style={showVideo === null && activeImage === idx ? { borderColor: themeColor } : {}}>
                    <img src={img} alt="" className="w-full h-full object-cover" loading="eager" />
                  </button>
                ))}
                {allVideos.map((vid, idx) => (
                  <button key={`vid-${idx}`} onClick={() => setShowVideo(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded flex-shrink-0 border-2 transition-all flex items-center justify-center bg-[#0F172A] ${showVideo === idx ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                    style={showVideo === idx ? { borderColor: themeColor } : {}}>
                    <Play className="w-5 h-5 text-white fill-white" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col min-w-0 overflow-hidden w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F172A] mb-2 sm:mb-3 break-words" data-testid="product-name">{product.name}</h1>
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }} data-testid="product-price">{formatVND(product.price)}</p>
              {product.out_of_stock && (
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white" data-testid="product-out-of-stock-badge">Hết hàng</span>
              )}
            </div>
            {product.sku && <p className="text-xs text-[#94A3B8] mb-2">SKU: {product.sku}</p>}
            {product.category && <p className="text-sm text-[#94A3B8] mb-4">{product.category}</p>}
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              {isService ? (
                <Button className="flex-1 hover:opacity-90 py-4 sm:py-6 text-sm sm:text-base rounded-[5px] disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                  disabled={!!product.out_of_stock}
                  onClick={() => setShowBooking(true)} data-testid="product-book-service">
                  <Calendar className="w-5 h-5 mr-2" /> {product.out_of_stock ? 'Tạm ngưng nhận đặt lịch' : 'Đặt lịch'}
                </Button>
              ) : (
                <Button className="flex-1 hover:opacity-90 py-4 sm:py-6 text-sm sm:text-base rounded-[5px] disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                  disabled={!!product.out_of_stock}
                  onClick={() => { if (product.out_of_stock) return; addToCart(product.id, product, 1); toast.success(t.addedToCart || 'Đã thêm vào giỏ'); }} data-testid="product-add-cart">
                  <ShoppingCart className="w-5 h-5 mr-2" /> {product.out_of_stock ? 'Hết hàng' : t.addToCart}
                </Button>
              )}
              <Button variant="outline" className="py-6 px-4 rounded-[5px]" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Affiliate links */}
            {Array.isArray(product.affiliate_links) && product.affiliate_links.length > 0 && (
              <div className="mb-4 sm:mb-6" data-testid="product-affiliate-links">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Mua trên nền tảng khác</p>
                <div className="flex flex-wrap gap-2">
                  {product.affiliate_links.map((link, idx) => {
                    const meta = {
                      shopee:  { name: 'Shopee',      bg: '#EE4D2D', fg: '#FFFFFF' },
                      tiktok:  { name: 'TikTok Shop', bg: '#000000', fg: '#FFFFFF' },
                      lazada:  { name: 'Lazada',      bg: '#0F136D', fg: '#FFFFFF' },
                      amazon:  { name: 'Amazon',      bg: '#FF9900', fg: '#111111' },
                      tiki:    { name: 'Tiki',        bg: '#1A94FF', fg: '#FFFFFF' },
                      sendo:   { name: 'Sendo',       bg: '#E4002B', fg: '#FFFFFF' },
                      other:   { name: 'Mua ngoài',   bg: '#475569', fg: '#FFFFFF' },
                    }[link.platform] || { name: link.platform || 'Mua ngoài', bg: '#475569', fg: '#FFFFFF' };
                    return (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] text-sm font-semibold shadow-sm hover:opacity-90 hover:scale-[1.02] transition-all"
                        style={{ backgroundColor: meta.bg, color: meta.fg }}
                        data-testid={`affiliate-link-${idx}`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{link.label || `Mua trên ${meta.name}`}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {product.description && (
              <div className="text-[#334155] text-base leading-relaxed mb-4 sm:mb-6 prose prose-base max-w-none break-words overflow-hidden [&_*]:text-base [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                data-testid="product-description" dangerouslySetInnerHTML={{ __html: product.description }} />
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 border-t border-[#E2E8F0] pt-8" data-testid="related-products-section">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4">{t.relatedProductsTitle}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
              {relatedProducts.map(rp => (
                <Link key={rp.id} to={`/shop/${slug}/product/${rp.id}`} className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all relative" data-testid={`related-product-${rp.id}`}>
                  {rp.out_of_stock ? (
                    <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white shadow">Hết hàng</span>
                  ) : rp.type === 'service' ? (
                    <Link to={`/shop/${slug}/product/${rp.id}`} onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md text-white opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                      style={{ backgroundColor: themeColor }} title="Đặt lịch">
                      <Calendar className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(rp.id, rp, 1); toast.success(t.addedToCart || 'Đã thêm vào giỏ'); }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md text-white opacity-80 hover:opacity-100 hover:scale-110 transition-all"
                      style={{ backgroundColor: themeColor }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                    <img src={rp.image_url || '/product-fallback.png'} alt={rp.name} onError={(e) => { e.target.src = '/product-fallback.png'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-medium text-[#0F172A] text-sm line-clamp-2 mb-1">{rp.name}</h3>
                    <p className="text-base font-bold" style={{ color: themeColor }}>{formatVND(rp.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md flex flex-col bg-white" data-testid="product-cart-drawer">
          <SheetHeader>
            <SheetTitle>{t.cart || 'Giỏ hàng'} ({cartCount})</SheetTitle>
            <SheetDescription>{t.cartItems || 'Các sản phẩm trong giỏ'}</SheetDescription>
          </SheetHeader>
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#64748B]">{t.cartEmpty || 'Giỏ hàng trống'}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex gap-4 p-3 bg-[#F8FAFC] rounded-xl" data-testid={`cart-item-${item.product_id}`}>
                      <img src={item.image_url || '/product-fallback.png'} alt={item.name} onError={(e) => { e.target.src = '/product-fallback.png'; }} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#0F172A] text-sm truncate">{item.name}</h4>
                        <p className="font-semibold text-sm" style={{ color: themeColor }}>{formatVND(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} data-testid={`cart-dec-${item.product_id}`}><Minus className="w-3 h-3" /></Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} data-testid={`cart-inc-${item.product_id}`}><Plus className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 ml-auto text-red-500" onClick={() => removeFromCart(item.product_id)} data-testid={`cart-remove-${item.product_id}`}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-[#64748B]">{t.total || 'Tổng'}:</span>
                  <span className="font-bold" style={{ color: themeColor }} data-testid="product-cart-total">{formatVND(cartTotal)}</span>
                </div>
                <Button className="w-full hover:opacity-90 py-6 rounded-[5px]" style={{ backgroundColor: themeColor }}
                  onClick={() => { setShowCart(false); navigate(`/shop/${slug}?checkout=1`); }} data-testid="product-checkout-btn">
                  {t.orderNow || 'Đặt hàng'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Booking Modal */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="booking-modal">
          <DialogHeader>
            <DialogTitle className="text-base">Đặt lịch dịch vụ</DialogTitle>
            <DialogDescription className="text-sm">{product.name} · {formatVND(product.price)}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitBooking} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">Họ tên *</label>
              <Input value={bookingForm.customer_name} onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                required className="text-sm" data-testid="booking-name-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">Số điện thoại *</label>
              <Input type="tel" value={bookingForm.customer_phone} onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                required className="text-sm" data-testid="booking-phone-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">Email (không bắt buộc)</label>
              <Input type="email" value={bookingForm.customer_email} onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                className="text-sm" data-testid="booking-email-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">Ngày & giờ mong muốn *</label>
              <Input type="datetime-local" value={bookingForm.preferred_datetime}
                onChange={(e) => setBookingForm({ ...bookingForm, preferred_datetime: e.target.value })}
                required className="text-sm" data-testid="booking-datetime-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#334155] mb-1">Ghi chú</label>
              <textarea value={bookingForm.note} onChange={(e) => setBookingForm({ ...bookingForm, note: e.target.value })}
                rows={3} className="w-full text-sm border border-[#E2E8F0] rounded-[5px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                placeholder="Yêu cầu đặc biệt (nếu có)" data-testid="booking-note-input" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBooking(false)} data-testid="booking-cancel-btn">Hủy</Button>
              <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: themeColor }}
                disabled={bookingSubmitting} data-testid="booking-submit-btn">
                {bookingSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailPage;
