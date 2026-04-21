import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { ArrowLeft, ShoppingCart, FolderOpen, Plus, Minus, Trash2, X, Share2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SingleCategoryPage = () => {
  const { slug, categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const subParam = searchParams.get('sub');
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addToCart, cart, cartCount, cartTotal, updateQuantity, removeFromCart } = useCart();
  const [shop, setShop] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [activeSubFilter, setActiveSubFilter] = useState(subParam || 'all');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [bookingProduct, setBookingProduct] = useState(null);
  const [bookingForm, setBookingForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', preferred_datetime: '', note: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => { fetchData(); window.scrollTo(0, 0); }, [slug, categoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/shop/${slug}`),
        axios.get(`${API}/shop/${slug}/products`),
        axios.get(`${API}/shop/${slug}/categories`)
      ]);
      setShop(shopRes.data);
      const cats = categoriesRes.data;
      setAllCategories(cats);
      const cat = cats.find(c => c.id === categoryId);
      setCategory(cat || null);
      const subs = cats.filter(c => c.parent_id === categoryId);
      setSubCategories(subs);
      const subIds = subs.map(s => s.id);
      const catProducts = productsRes.data.filter(
        p => p.category_id === categoryId || subIds.includes(p.category_id)
      ).sort((a, b) => (a.position || 0) - (b.position || 0));
      setProducts(catProducts);
    } catch {
      navigate(`/shop/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const themeColor = shop?.theme_color || '#0055FF';

  const filteredProducts = activeSubFilter === 'all'
    ? products
    : products.filter(p => p.category_id === activeSubFilter || p.category_id === categoryId);

  const handleAddToCart = (product) => {
    addToCart(product.id, product, 1);
    toast.success(`${product.name} ${t.addedToCart || 'added'}`);
  };

  const openBooking = (product) => {
    setBookingProduct(product);
    setBookingForm({ customer_name: '', customer_phone: '', customer_email: '', preferred_datetime: '', note: '' });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!bookingProduct) return;
    if (!bookingForm.customer_name.trim() || !bookingForm.customer_phone.trim() || !bookingForm.preferred_datetime) {
      toast.error('Vui lòng điền đầy đủ Họ tên, SĐT và Thời gian mong muốn');
      return;
    }
    setBookingSubmitting(true);
    try {
      const trackingCode = new URLSearchParams(window.location.search).get('ref') || localStorage.getItem(`agent_ref_${slug}`) || null;
      await axios.post(`${API}/shop/${slug}/bookings`, {
        service_id: bookingProduct.id,
        customer_name: bookingForm.customer_name.trim(),
        customer_phone: bookingForm.customer_phone.trim(),
        customer_email: bookingForm.customer_email.trim(),
        preferred_datetime: bookingForm.preferred_datetime,
        note: bookingForm.note.trim(),
        agent_tracking_code: trackingCode,
      });
      toast.success('Đã gửi yêu cầu đặt lịch! Chúng tôi sẽ liên hệ xác nhận sớm.');
      setBookingProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gửi yêu cầu thất bại');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <p className="text-lg text-[#64748B] mb-4">{t.categoryNotFound || 'Category not found'}</p>
        <Link to={`/shop/${slug}`}><Button style={{ backgroundColor: themeColor }}><ArrowLeft className="w-4 h-4 mr-2" /> {t.backToShop}</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="single-category-page">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0]" style={{ backgroundColor: themeColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20" onClick={() => navigate(`/shop/${slug}`)} data-testid="single-cat-back-btn">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                {shop?.logo_url ? (
                  <img src={shop.logo_url} alt={shop.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{shop?.name?.[0]}</span>
                  </div>
                )}
                <span className="font-semibold text-sm text-white">{shop?.name}</span>
              </div>
            </div>
            <button onClick={() => setShowCart(true)} className="text-white/80 hover:text-white relative" data-testid="cat-cart-button">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: '#EF4444' }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Hero */}
        <div className="flex items-center gap-4 mb-6" data-testid="category-hero">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 flex items-center justify-center shrink-0" style={{ borderColor: themeColor }}>
            {category.image_url ? (
              <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
            ) : (
              <FolderOpen className="w-7 h-7" style={{ color: themeColor }} />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]" data-testid="category-title">{category.name}</h1>
            {category.description && <p className="text-sm text-[#64748B] mt-0.5">{category.description}</p>}
            <p className="text-xs text-[#94A3B8] mt-1">{products.length} {t.productsCount}</p>
          </div>
        </div>

        {/* Sub-category filter chips */}
        {subCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6" data-testid="sub-category-filters">
            <button
              onClick={() => setActiveSubFilter('all')}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${activeSubFilter === 'all' ? 'text-white border-transparent' : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#94A3B8]'}`}
              style={activeSubFilter === 'all' ? { backgroundColor: themeColor } : {}}
              data-testid="sub-filter-all"
            >
              {t.all}
            </button>
            {subCategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubFilter(sub.id)}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${activeSubFilter === sub.id ? 'text-white border-transparent' : 'bg-white border-[#E2E8F0] text-[#475569] hover:border-[#94A3B8]'}`}
                style={activeSubFilter === sub.id ? { backgroundColor: themeColor } : {}}
                data-testid={`sub-filter-${sub.id}`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-[#94A3B8]" data-testid="no-products">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-5" data-testid="category-products-grid">
            {filteredProducts.map(product => {
              const isService = product.type === 'service';
              return (
              <div key={product.id} className="bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all group relative" data-testid={`cat-product-${product.id}`}>
                {isService && (
                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#0F172A] text-white">Dịch vụ</span>
                )}
                <div className="cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveImage(0); }}>
                  <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                    <img src={product.image_url || '/product-fallback.png'} alt={product.name} onError={(e) => { e.target.src = '/product-fallback.png'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveImage(0); }}>
                    <h3 className="font-medium text-[#0F172A] text-sm line-clamp-2 mb-1 hover:underline">{product.name}</h3>
                  </div>
                  <p className="text-base font-bold mb-2" style={{ color: themeColor }}>{formatVND(product.price)}</p>
                  {isService ? (
                    <Button
                      size="sm"
                      className="w-full text-xs hover:opacity-90 gap-1.5 text-white"
                      style={{ backgroundColor: themeColor }}
                      onClick={() => openBooking(product)}
                      data-testid={`book-service-${product.id}`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Đặt lịch
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs hover:opacity-90 gap-1.5"
                      style={{ backgroundColor: themeColor }}
                      onClick={() => handleAddToCart(product)}
                      data-testid={`add-cart-${product.id}`}
                    >
                      <Plus className="w-3.5 h-3.5" /> {t.addToCart}
                    </Button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto" data-testid="cat-product-fullpage">
          <header className="sticky top-0 z-[60] bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-between h-14">
                <button onClick={() => { setSelectedProduct(null); setActiveImage(0); }}
                  className="flex items-center gap-2 text-sm text-[#334155] hover:text-[#0F172A] transition-colors"
                  data-testid="cat-product-close-btn">
                  <ArrowLeft className="w-4 h-4" /> {t.back || 'Quay lại'}
                </button>
                <span className="font-semibold text-[#0F172A] text-sm truncate max-w-[200px]">{shop?.name}</span>
                <button onClick={() => {
                  const url = `${window.location.origin}/shop/${slug}?product=${selectedProduct.id}`;
                  if (navigator.share) {
                    navigator.share({ title: selectedProduct.name, text: `${selectedProduct.name} - ${formatVND(selectedProduct.price)}`, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    toast.success(t.linkCopied || 'Link copied!');
                  }
                }} className="flex items-center gap-2 text-sm text-[#334155] hover:text-[#0F172A] transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-8">
              <div className="flex flex-col w-full">
                <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden rounded-lg">
                  {(() => {
                    const imgs = selectedProduct.images?.length > 0 ? selectedProduct.images : [selectedProduct.image_url];
                    return (
                      <>
                        {imgs.length > 1 && imgs.map((img, idx) => idx !== activeImage && <link key={idx} rel="preload" as="image" href={img} />)}
                        <img src={imgs[activeImage]} alt={selectedProduct.name} className="w-full h-full object-contain" loading="eager" />
                      </>
                    );
                  })()}
                </div>
                {(() => {
                  const imgs = selectedProduct.images?.length > 0 ? selectedProduct.images : [selectedProduct.image_url];
                  if (imgs.length <= 1) return null;
                  return (
                    <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 scrollbar-hide">
                      {imgs.map((img, idx) => (
                        <button key={idx} onClick={() => setActiveImage(idx)}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === idx ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                          style={activeImage === idx ? { borderColor: themeColor, '--tw-ring-color': themeColor } : {}}>
                          <img src={img} alt="" className="w-full h-full object-cover" loading="eager" />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col min-w-0 overflow-hidden w-full">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F172A] mb-2 sm:mb-3 break-words">{selectedProduct.name}</h1>
                <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: themeColor }}>{formatVND(selectedProduct.price)}</p>
                {selectedProduct.sku && <p className="text-xs text-[#94A3B8] mb-2">SKU: {selectedProduct.sku}</p>}
                {category && <p className="text-sm text-[#94A3B8] mb-4">{category.name}</p>}
                {selectedProduct.description && <div className="text-[#64748B] text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 prose prose-sm max-w-none break-words overflow-hidden [&_img]:max-w-full [&_pre]:overflow-x-auto [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />}
                <div className="flex gap-2 sm:gap-3 mt-auto">
                  {selectedProduct.type === 'service' ? (
                    <Button className="flex-1 hover:opacity-90 py-4 sm:py-6 text-sm sm:text-base rounded-[5px] text-white"
                      style={{ backgroundColor: themeColor }}
                      onClick={() => { openBooking(selectedProduct); setSelectedProduct(null); }}
                      data-testid="cat-product-book-service">
                      <Calendar className="w-5 h-5 mr-2" /> Đặt lịch
                    </Button>
                  ) : (
                    <Button className="flex-1 hover:opacity-90 py-4 sm:py-6 text-sm sm:text-base rounded-[5px]"
                      style={{ backgroundColor: themeColor }}
                      onClick={() => { handleAddToCart(selectedProduct); }}
                      data-testid="cat-product-add-cart">
                      <ShoppingCart className="w-5 h-5 mr-2" /> {t.addToCart}
                    </Button>
                  )}
                  <Button variant="outline" className="py-6 px-4 rounded-[5px]"
                    onClick={() => {
                      const url = `${window.location.origin}/shop/${slug}?product=${selectedProduct.id}`;
                      if (navigator.share) {
                        navigator.share({ title: selectedProduct.name, text: `${selectedProduct.name} - ${formatVND(selectedProduct.price)}`, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success(t.linkCopied || 'Link copied!');
                      }
                    }}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Related Products */}
            {(() => {
              const related = filteredProducts.filter(p => p.id !== selectedProduct.id).slice(0, 4);
              if (related.length === 0) return null;
              return (
                <div className="mt-10 border-t border-[#E2E8F0] pt-8">
                  <h2 className="text-xl font-bold text-[#0F172A] mb-4">{t.relatedProductsTitle}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
                    {related.map(rp => (
                      <div key={rp.id} className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => { setSelectedProduct(rp); setActiveImage(0); document.querySelector('[data-testid="cat-product-fullpage"]')?.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                          <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-3 text-center">
                          <h3 className="font-medium text-[#0F172A] text-sm line-clamp-2 mb-1">{rp.name}</h3>
                          <p className="text-base font-bold" style={{ color: themeColor }}>{formatVND(rp.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md flex flex-col bg-white" data-testid="cat-cart-drawer">
          <SheetHeader>
            <SheetTitle>{t.cart} ({cartCount})</SheetTitle>
            <SheetDescription>{t.cartItems}</SheetDescription>
          </SheetHeader>
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center"><p className="text-[#64748B]">{t.cartEmpty}</p></div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex gap-4 p-3 bg-[#F8FAFC] rounded-xl">
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#0F172A] text-sm truncate">{item.name}</h4>
                        <p className="font-semibold text-sm" style={{ color: themeColor }}>{formatVND(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 ml-auto text-red-500" onClick={() => removeFromCart(item.product_id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-[#64748B]">{t.total}:</span>
                  <span className="font-bold" style={{ color: themeColor }}>{formatVND(cartTotal)}</span>
                </div>
                <Button className="w-full hover:opacity-90 py-6 rounded-[5px]" style={{ backgroundColor: themeColor }}
                  onClick={() => { setShowCart(false); navigate(`/shop/${slug}?checkout=1`); }} data-testid="cat-checkout-btn">
                  {t.orderNow}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Booking Modal */}
      <Dialog open={!!bookingProduct} onOpenChange={(v) => { if (!v) setBookingProduct(null); }}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="booking-modal">
          <DialogHeader>
            <DialogTitle className="text-base">Đặt lịch dịch vụ</DialogTitle>
            <DialogDescription className="text-sm">
              {bookingProduct ? `${bookingProduct.name} · ${formatVND(bookingProduct.price)}` : ''}
            </DialogDescription>
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setBookingProduct(null)} data-testid="booking-cancel-btn">Hủy</Button>
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

export default SingleCategoryPage;
