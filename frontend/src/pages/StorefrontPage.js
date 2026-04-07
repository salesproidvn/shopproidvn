import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import PriceFilter from '../components/PriceFilter';
import { 
  Search, ShoppingCart, Phone, Mail, MapPin, Facebook, Instagram, 
  Plus, Minus, Trash2, ArrowLeft, LayoutDashboard, X, AlertTriangle, Play,
  MessageCircle, Map, FolderOpen, ChevronLeft, ChevronRight, FileText, Calendar, Share2,
  Home, Store, Grid3X3, BookOpen, PhoneCall, Menu as MenuIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { emitNotification } from '../context/NotificationContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PRODUCTS_PER_CATEGORY = 10;

const StorefrontPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState({ id: 'all', min: 0, max: Infinity });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '', customer_address: '', note: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [postCarouselIndex, setPostCarouselIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { fetchShopData(); }, [slug]);

  // Auto-slide banner
  useEffect(() => {
    const banners = shop?.banners || [];
    if (banners.length <= 1 || !shop?.banner_enabled) return;
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [shop]);

  // Auto-open product from query param (e.g., from blog attached product link)
  useEffect(() => {
    const productParam = searchParams.get('product');
    if (productParam && products.length > 0) {
      const found = products.find(p => p.id === productParam);
      if (found) { setSelectedProduct(found); setActiveImage(0); setShowVideo(false); }
    }
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.length > 0) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, products, categories]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const [shopRes, productsRes, categoriesRes, postsRes] = await Promise.all([
        axios.get(`${API}/shop/${slug}`),
        axios.get(`${API}/shop/${slug}/products`),
        axios.get(`${API}/shop/${slug}/categories`),
        axios.get(`${API}/shop/${slug}/posts`)
      ]);
      setShop(shopRes.data);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setPosts(postsRes.data || []);
      if (shopRes.data.expiry_date) {
        const expiry = new Date(shopRes.data.expiry_date);
        if (expiry < new Date()) setIsExpired(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || t.shopNotFound);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...products];
    if (selectedCategory && selectedCategory !== 'all') {
      // Include sub-category products when parent is selected
      const subCatIds = categories.filter(c => c.parent_id === selectedCategory).map(c => c.id);
      const matchIds = [selectedCategory, ...subCatIds];
      result = result.filter(p => matchIds.includes(p.category_id));
    }
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(p => p.name.toLowerCase().includes(q)); }
    if (priceFilter.id !== 'all') result = result.filter(p => p.price >= priceFilter.min && p.price <= priceFilter.max);
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, priceFilter, products]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: 1 }]);
    }
    toast.success(t.addedToCart);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => { setCart(cart.filter(item => item.product_id !== productId)); };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const themeColor = shop?.theme_color || '#0055FF';

  const layoutSections = shop?.layout_sections || [
    { id: 'banner', enabled: true },
    { id: 'blog', enabled: true },
    { id: 'featured', enabled: true },
    { id: 'products', enabled: true }
  ];

  const isSectionEnabled = (id) => {
    const section = layoutSections.find(s => s.id === id);
    return section ? section.enabled : true;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const orderData = { ...checkoutForm, items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })) };
      const { data } = await axios.post(`${API}/shop/${slug}/orders`, orderData);
      emitNotification({ type: 'new_order', title: t.newOrder, message: `${checkoutForm.customer_name} - ${formatVND(data.total_amount)}`, order_id: data.id, shop_slug: slug });
      setCart([]); setShowCheckout(false); setShowCart(false);
      setCheckoutForm({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '', note: '' });
      navigate(`/shop/${slug}/thank-you`, { state: { order: data } });
    } catch { toast.error(t.orderFailed); }
  };

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const scrollToCategory = (catId) => {
    setShowCategoryMenu(false);
    setSelectedCategory('all');
    setTimeout(() => {
      const el = document.getElementById(`cat-section-${catId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">{t.shopNotFound}</h1>
        <p className="text-[#64748B] mb-6">{error}</p>
        <Link to="/"><Button className="hover:opacity-90" style={{ backgroundColor: themeColor }}><ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}</Button></Link>
      </div>
    );
  }

  // Banner Slider Component
  const BannerSlider = () => {
    const banners = shop?.banners || [];
    if (!banners.length || !shop?.banner_enabled) return null;
    return (
      <div className="mb-8" data-testid="banner-slider">
        <div className="relative max-w-4xl mx-auto overflow-hidden rounded-[5px]">
          <div className="relative aspect-[3/1] bg-[#F8FAFC]">
            {banners.map((url, idx) => (
              <img key={idx} src={url} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === bannerIndex ? 'opacity-100' : 'opacity-0'}`} />
            ))}
          </div>
          {banners.length > 1 && (
            <>
              <button onClick={() => setBannerIndex((bannerIndex - 1 + banners.length) % banners.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors" data-testid="banner-prev">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setBannerIndex((bannerIndex + 1) % banners.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors" data-testid="banner-next">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, idx) => (
                  <button key={idx} onClick={() => setBannerIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === bannerIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Post Slider Component (single post at a time with arrows)
  const PostCarousel = () => {
    if (!posts.length || shop?.blog_enabled === false) return null;
    return (
      <div className="mb-8" data-testid="post-carousel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{t.latestPosts}</h3>
          <Link to={`/shop/${slug}/posts`}><Button variant="ghost" size="sm" className="text-sm rounded-[5px]" style={{ color: themeColor }}>{t.readMore} &rarr;</Button></Link>
        </div>
        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${postCarouselIndex * 100}%)` }}>
              {posts.map(post => (
                <div key={post.id} className="w-full flex-shrink-0 px-1">
                  <Link to={`/shop/${slug}/posts/${post.id}`} className="flex bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all group" data-testid={`carousel-post-${post.id}`}>
                    {post.thumbnail && (
                      <div className="w-1/3 sm:w-1/4 flex-shrink-0 overflow-hidden">
                        <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform min-h-[120px]" />
                      </div>
                    )}
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <p className="text-[10px] text-[#94A3B8] mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString('vi-VN')}</p>
                      <h4 className="font-semibold text-sm sm:text-base text-[#0F172A] line-clamp-2 mb-1">{post.title}</h4>
                      <p className="text-xs text-[#64748B] line-clamp-2 hidden sm:block" dangerouslySetInnerHTML={{ __html: post.description.replace(/<[^>]+>/g, '') }} />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          {posts.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-[5px]" disabled={postCarouselIndex === 0} onClick={() => setPostCarouselIndex(prev => Math.max(0, prev - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-1">
                {posts.map((_, idx) => (
                  <button key={idx} onClick={() => setPostCarouselIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === postCarouselIndex ? 'w-4' : ''}`}
                    style={{ backgroundColor: idx === postCarouselIndex ? themeColor : '#E2E8F0' }} />
                ))}
              </div>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-[5px]" disabled={postCarouselIndex >= posts.length - 1} onClick={() => setPostCarouselIndex(prev => Math.min(posts.length - 1, prev + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Product Card
  const ProductCard = ({ product }) => (
    <div className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      onClick={() => { setSelectedProduct(product); setActiveImage(0); setShowVideo(false); }} data-testid={`product-${product.id}`}>
      <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div className="p-3 sm:p-4 text-center">
        <h3 className="font-medium text-[#0F172A] text-sm sm:text-base line-clamp-2 mb-1">{product.name}</h3>
        {product.sku && <p className="text-[10px] text-[#94A3B8] mb-1">SKU: {product.sku}</p>}
        <p className="text-base sm:text-lg font-bold mb-2" style={{ color: themeColor }}>{formatVND(product.price)}</p>
        <Button className="w-full hover:opacity-90 text-white text-xs sm:text-sm h-9 sm:h-10 rounded-[5px]"
          style={{ backgroundColor: themeColor }}
          onClick={(e) => { e.stopPropagation(); addToCart(product); }} data-testid={`add-cart-${product.id}`}>
          {t.addToCart}
        </Button>
      </div>
    </div>
  );

  // Featured Products Section
  const FeaturedProducts = () => {
    if (!isSectionEnabled('featured')) return null;
    const featured = products.filter(p => p.is_featured);
    if (!featured.length) return null;
    return (
      <div className="mb-8" data-testid="featured-products">
        <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-4">{t.featuredProducts}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-5">
          {featured.map((product) => (<ProductCard key={product.id} product={product} />))}
        </div>
      </div>
    );
  };

  // Products Section
  const ProductsSection = () => {
    if (!isSectionEnabled('products')) return null;
    return (
      <>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24"><p className="text-[#64748B] text-lg">{t.noProducts}</p></div>
        ) : selectedCategory === 'all' && !searchQuery && priceFilter.id === 'all' ? (
          <div className="space-y-10" data-testid="grouped-product-view">
            {categories.filter(c => !c.parent_id).map(cat => {
              const subCatIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
              const catProducts = filteredProducts.filter(p => p.category_id === cat.id || subCatIds.includes(p.category_id)).sort((a, b) => (a.position || 0) - (b.position || 0));
              if (catProducts.length === 0) return null;
              const isExpanded = expandedCategories[cat.id];
              const visibleProducts = isExpanded ? catProducts : catProducts.slice(0, PRODUCTS_PER_CATEGORY);
              const subs = categories.filter(c => c.parent_id === cat.id);
              return (
                <div key={cat.id} id={`cat-section-${cat.id}`} data-testid={`category-section-${cat.id}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{cat.name}</h3>
                    <div className="flex-1 h-px bg-[#E2E8F0]" />
                    <span className="text-sm text-[#94A3B8]">{catProducts.length}</span>
                  </div>
                  {subs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4" data-testid={`subcats-${cat.id}`}>
                      {subs.map(sub => (
                        <button key={sub.id} onClick={() => setSelectedCategory(sub.id)}
                          className="text-xs px-2.5 py-1 rounded-full border border-[#E2E8F0] text-[#64748B] hover:border-current transition-colors"
                          style={{ '--tw-border-opacity': 1 }}
                          data-testid={`subcat-chip-${sub.id}`}>
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-5">
                    {visibleProducts.map((product) => (<ProductCard key={product.id} product={product} />))}
                  </div>
                  {catProducts.length > PRODUCTS_PER_CATEGORY && (
                    <div className="text-center mt-4">
                      <Button variant="outline" onClick={() => toggleCategoryExpand(cat.id)} className="text-sm px-6 rounded-[5px]" style={{ borderColor: themeColor, color: themeColor }} data-testid={`load-more-${cat.id}`}>
                        {isExpanded ? t.close : `${t.loadMore} (${catProducts.length - PRODUCTS_PER_CATEGORY})`}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-5" data-testid="product-grid">
            {filteredProducts.map((product) => (<ProductCard key={product.id} product={product} />))}
          </div>
        )}
      </>
    );
  };

  // Section renderer based on layout order
  const renderSection = (section) => {
    if (!section.enabled) return null;
    switch (section.id) {
      case 'banner': return <BannerSlider key="banner" />;
      case 'blog': return <PostCarousel key="blog" />;
      case 'featured': return <FeaturedProducts key="featured" />;
      case 'products': return null; // products rendered separately below filters
      default: return null;
    }
  };

  // Helper: Get embed URL from YouTube or TikTok links
  const getVideoEmbed = (url) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'youtube', embed: `https://www.youtube.com/embed/${ytMatch[1]}` };
    // TikTok
    const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (ttMatch) return { type: 'tiktok', embed: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };
    return null;
  };

  // Full-page product view
  if (selectedProduct) {
    const images = selectedProduct.images?.length > 0 ? selectedProduct.images : [selectedProduct.image_url];
    const ytMatch = selectedProduct.video_url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : (selectedProduct.video_url || null);
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto" data-testid="product-fullpage">
        <button onClick={() => { setSelectedProduct(null); setActiveImage(0); setShowVideo(false); }}
          className="fixed top-4 right-4 z-[60] w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          data-testid="product-close-btn">
          <X className="w-5 h-5" />
        </button>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden" data-testid="product-main-image">
                {showVideo && embedUrl ? (
                  <iframe src={embedUrl} title="Product video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <img src={images[activeImage]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                )}
              </div>
              {(images.length > 1 || embedUrl) && (
                <div className="flex gap-2 mt-3 overflow-x-auto" data-testid="product-thumbnails">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => { setActiveImage(idx); setShowVideo(false); }}
                      className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${!showVideo && activeImage === idx ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                      style={!showVideo && activeImage === idx ? { borderColor: themeColor, '--tw-ring-color': themeColor } : {}}
                      data-testid={`thumb-${idx}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {embedUrl && (
                    <button onClick={() => setShowVideo(true)}
                      className={`w-16 h-16 rounded flex-shrink-0 border-2 transition-all flex items-center justify-center bg-[#0F172A] ${showVideo ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                      style={showVideo ? { borderColor: themeColor, '--tw-ring-color': themeColor } : {}}
                      data-testid="thumb-video">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </button>
                  )}
                </div>
              )}
              {/* Video Grid - below product images */}
              {(() => {
                const videoLinks = (selectedProduct.video_links || []).filter(v => v && getVideoEmbed(v));
                if (videoLinks.length === 0) return null;
                return (
                  <div className="mt-4" data-testid="product-video-grid">
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-2">{t.productVideos}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {videoLinks.map((vl, idx) => {
                        const embed = getVideoEmbed(vl);
                        if (!embed) return null;
                        return (
                          <div key={idx} className="aspect-[9/16] sm:aspect-video rounded-[5px] overflow-hidden bg-black" data-testid={`product-video-${idx}`}>
                            <iframe src={embed.embed} title={`Video ${idx + 1}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3" data-testid="product-name">{selectedProduct.name}</h1>
              <p className="text-3xl font-bold mb-2" style={{ color: themeColor }} data-testid="product-price">{formatVND(selectedProduct.price)}</p>
              {selectedProduct.sku && <p className="text-xs text-[#94A3B8] mb-2" data-testid="product-sku">SKU: {selectedProduct.sku}</p>}
              {selectedProduct.category && <p className="text-sm text-[#94A3B8] mb-4">{selectedProduct.category}</p>}
              {selectedProduct.description && <div className="text-[#64748B] leading-relaxed mb-6 prose prose-sm max-w-none" data-testid="product-description" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />}
              <div className="flex gap-3 mt-auto">
                <Button className="flex-1 hover:opacity-90 py-6 text-base rounded-[5px]"
                  style={{ backgroundColor: themeColor }}
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setActiveImage(0); setShowVideo(false); }} data-testid="product-add-cart">
                  <ShoppingCart className="w-5 h-5 mr-2" /> {t.addToCart}
                </Button>
                <Button variant="outline" className="py-6 px-4 rounded-[5px]"
                  onClick={() => {
                    const url = `${window.location.origin}/shop/${slug}?product=${selectedProduct.id}`;
                    if (navigator.share) {
                      navigator.share({ title: selectedProduct.name, text: `${selectedProduct.name} - ${formatVND(selectedProduct.price)}`, url });
                    } else {
                      navigator.clipboard.writeText(url);
                      toast.success(t.linkCopied || 'Link copied!');
                    }
                  }} data-testid="product-share-btn">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          {/* Related Products */}
          {(() => {
            const related = products.filter(p => p.category_id === selectedProduct.category_id && p.id !== selectedProduct.id).slice(0, 4);
            if (related.length === 0) return null;
            return (
              <div className="mt-10 border-t border-[#E2E8F0] pt-8" data-testid="related-products-section">
                <h2 className="text-xl font-bold text-[#0F172A] mb-4">{t.relatedProductsTitle}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
                  {related.map(rp => (
                    <div key={rp.id} className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => { setSelectedProduct(rp); setActiveImage(0); setShowVideo(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      data-testid={`related-product-${rp.id}`}>
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
    );
  }

  return (
    <div className="min-h-screen bg-white pb-14" data-testid="storefront-page" style={{ '--tc': themeColor }}>
      {/* Expired Overlay */}
      {isExpired && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" data-testid="shop-expired-overlay">
          <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-3">{t.shopExpired}</h2>
            <p className="text-[#64748B] mb-8">{t.shopExpiredMsg}</p>
            <Link to="/"><Button className="hover:opacity-90 rounded-full px-8 py-6" style={{ backgroundColor: themeColor }}><ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}</Button></Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                  <span className="text-white font-bold text-sm">{shop.name[0]}</span>
                </div>
              )}
              <span className="font-bold text-base text-[#0F172A] hidden sm:block">{shop.name}</span>
            </div>

            {/* Desktop Menu - Dynamic */}
            <nav className="hidden md:flex items-center gap-1" data-testid="storefront-menu-bar">
              {(shop.menu_items || []).filter(mi => mi.enabled).sort((a, b) => a.position - b.position).map((mi, idx) => (
                mi.type === 'scroll_shop' ? (
                  <Button key={mi.id} variant="ghost" size="sm" className="text-sm" onClick={() => { setSelectedCategory('all'); window.scrollTo({ top: 400, behavior: 'smooth' }); }} data-testid={`menu-item-${idx}`}>
                    {mi.label}
                  </Button>
                ) : mi.type === 'external' ? (
                  <a key={mi.id} href={mi.url} target="_blank" rel="noopener noreferrer" data-testid={`menu-item-${idx}`}>
                    <Button variant="ghost" size="sm" className="text-sm">{mi.label}</Button>
                  </a>
                ) : (
                  <Link key={mi.id} to={mi.url} data-testid={`menu-item-${idx}`}>
                    <Button variant="ghost" size="sm" className="text-sm">{mi.label}</Button>
                  </Link>
                )
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex max-w-xs">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <Input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-full bg-[#F8FAFC] h-9 text-sm" data-testid="search-input" />
                </div>
              </div>
              {user && (user.role === 'shop_owner' || user.role === 'super_admin') && (
                <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} data-testid="storefront-dashboard-btn">
                  <Button variant="outline" size="sm" className="rounded-full text-xs hover:text-white" style={{ borderColor: themeColor, color: themeColor }} onMouseEnter={(e) => { e.target.style.backgroundColor = themeColor; e.target.style.color = 'white'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = themeColor; }}>
                    <LayoutDashboard className="w-3 h-3 mr-1" /> {t.dashboard}
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="relative rounded-full h-9 w-9 p-0" onClick={() => setShowCart(true)} data-testid="cart-button">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-white text-[10px] rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>{cartCount}</span>
                )}
              </Button>
              {/* Mobile menu toggle */}
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-toggle">
                <MenuIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Menu Dropdown - Dynamic */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-2 space-y-1" data-testid="mobile-menu-dropdown">
            {(shop.menu_items || []).filter(mi => mi.enabled).sort((a, b) => a.position - b.position).map((mi, idx) => (
              mi.type === 'scroll_shop' ? (
                <button key={mi.id} onClick={() => { setMobileMenuOpen(false); setSelectedCategory('all'); window.scrollTo({ top: 300, behavior: 'smooth' }); }} className="flex items-center gap-2 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] px-2 rounded-[5px] w-full text-left" data-testid={`mobile-menu-${idx}`}>
                  {mi.label}
                </button>
              ) : mi.type === 'external' ? (
                <a key={mi.id} href={mi.url} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] px-2 rounded-[5px]" data-testid={`mobile-menu-${idx}`}>
                  {mi.label}
                </a>
              ) : (
                <Link key={mi.id} to={mi.url} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] px-2 rounded-[5px]" data-testid={`mobile-menu-${idx}`}>
                  {mi.label}
                </Link>
              )
            ))}
          </div>
        )}
      </header>

      {/* Products */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dynamic sections (banner, blog, featured) in layout order */}
        {layoutSections.filter(s => s.id !== 'products').map(section => renderSection(section))}

        {/* Filters (always before products) */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input type="text" placeholder={t.searchShort} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm" data-testid="category-filter">
                <SelectValue placeholder={t.allCategories} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">{t.allCategories}</SelectItem>
                {categories.filter(c => !c.parent_id).map((cat) => (
                  <React.Fragment key={cat.id}>
                    <SelectItem value={cat.id}>{cat.name}</SelectItem>
                    {categories.filter(c => c.parent_id === cat.id).map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>&nbsp;&nbsp;└ {sub.name}</SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PriceFilter onFilter={setPriceFilter} activeFilter={priceFilter} />
        </div>

        {/* Products section */}
        <ProductsSection />
      </main>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12" data-testid="storefront-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Editable footer columns */}
          {shop.footer_columns && shop.footer_columns.length > 0 ? (
            <div className={`grid gap-8 ${shop.footer_columns.length === 1 ? 'grid-cols-1' : shop.footer_columns.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : shop.footer_columns.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
              {shop.footer_columns.map((col, idx) => (
                <div key={idx} data-testid={`footer-column-${idx}`}>
                  <h4 className="font-semibold text-base mb-3">{col.title}</h4>
                  <div className="space-y-1.5 text-[#94A3B8] text-sm">
                    {(col.items || []).map((item, itemIdx) => (
                      item.url ? (
                        <a key={itemIdx} href={item.url} target={item.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                          className="block hover:text-white transition-colors" data-testid={`footer-link-${idx}-${itemIdx}`}>
                          {item.text}
                        </a>
                      ) : (
                        <p key={itemIdx}>{item.text}</p>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-xl mb-4">{shop.name}</h3>
                {shop.description && <p className="text-[#94A3B8] mb-4">{shop.description}</p>}
                <div className="flex gap-4">
                  {shop.social_facebook && (<a href={shop.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#0055FF]"><Facebook className="w-6 h-6" /></a>)}
                  {shop.social_instagram && (<a href={shop.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#0055FF]"><Instagram className="w-6 h-6" /></a>)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t.contact}</h4>
                <div className="space-y-2 text-[#94A3B8]">
                  {shop.contact_phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {shop.contact_phone}</p>}
                  {shop.contact_email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {shop.contact_email}</p>}
                  {shop.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {shop.address}</p>}
                </div>
              </div>
            </div>
          )}
          {/* Social + Contact row always shown below */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                  <span className="text-white font-bold text-xs">{shop.name[0]}</span>
                </div>
              )}
              <span className="font-semibold text-sm">{shop.name}</span>
            </div>
            <div className="flex items-center gap-4">
              {shop.social_facebook && (<a href={shop.social_facebook} target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>)}
              {shop.social_instagram && (<a href={shop.social_instagram} target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>)}
              {shop.contact_phone && (<a href={`tel:${shop.contact_phone}`} className="text-[#94A3B8] hover:text-white transition-colors"><Phone className="w-5 h-5" /></a>)}
              {shop.contact_email && (<a href={`mailto:${shop.contact_email}`} className="text-[#94A3B8] hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>)}
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-lg" data-testid="bottom-bar">
        <div className="max-w-7xl mx-auto flex items-center justify-around h-12">
          {shop.contact_phone && (
            <a href={`tel:${shop.contact_phone}`} className="flex flex-col items-center gap-0.5 text-[#64748B] hover:text-green-600 transition-colors" data-testid="bottom-call">
              <Phone className="w-4 h-4" />
              <span className="text-[10px]">{t.call}</span>
            </a>
          )}
          {shop.contact_phone && (
            <a href={`sms:${shop.contact_phone}`} className="flex flex-col items-center gap-0.5 text-[#64748B] hover:text-blue-600 transition-colors" data-testid="bottom-message">
              <MessageCircle className="w-4 h-4" />
              <span className="text-[10px]">{t.message}</span>
            </a>
          )}
          {shop.address && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-[#64748B] hover:text-purple-600 transition-colors" data-testid="bottom-map">
              <Map className="w-4 h-4" />
              <span className="text-[10px]">{t.map}</span>
            </a>
          )}
          <button onClick={() => setShowCategoryMenu(!showCategoryMenu)} className="flex flex-col items-center gap-0.5 text-[#64748B] hover:text-[#0055FF] transition-colors relative" data-testid="bottom-categories">
            <FolderOpen className="w-4 h-4" />
            <span className="text-[10px]">{t.productCategories}</span>
          </button>
        </div>
      </div>

      {/* Category Menu Popup */}
      {showCategoryMenu && (
        <>
          <div className="fixed inset-0 z-[41]" onClick={() => setShowCategoryMenu(false)} />
          <div className="fixed bottom-14 left-0 right-0 z-[42] bg-white border-t border-[#E2E8F0] shadow-xl p-4 max-h-64 overflow-y-auto" data-testid="category-menu-popup">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => scrollToCategory(cat.id)} className="text-left p-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] rounded-lg transition-colors text-sm font-medium text-[#0F172A]" data-testid={`cat-menu-${cat.id}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cart Drawer */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md flex flex-col bg-white" data-testid="cart-drawer">
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
                          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateCartQuantity(item.product_id, -1)}><Minus className="w-3 h-3" /></Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => updateCartQuantity(item.product_id, 1)}><Plus className="w-3 h-3" /></Button>
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
                  onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="checkout-btn">
                  {t.orderNow}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Full-Screen Overlay */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] overflow-y-auto" data-testid="checkout-overlay">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setShowCheckout(false); setShowCart(true); }}><ArrowLeft className="w-5 h-5" /></Button>
              <h1 className="text-2xl font-bold text-[#0F172A]">{t.checkoutTitle}</h1>
            </div>
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg text-[#0F172A] mb-4">{t.shippingInfo}</h2>
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t.customerName} *</label>
                      <Input value={checkoutForm.customer_name} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })} required data-testid="checkout-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.phone} *</label>
                        <Input value={checkoutForm.customer_phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_phone: e.target.value })} required data-testid="checkout-phone" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.email}</label>
                        <Input type="email" value={checkoutForm.customer_email} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_email: e.target.value })} data-testid="checkout-email" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t.address} *</label>
                      <Input value={checkoutForm.customer_address} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_address: e.target.value })} required data-testid="checkout-address" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t.note}</label>
                      <Input value={checkoutForm.note} onChange={(e) => setCheckoutForm({ ...checkoutForm, note: e.target.value })} placeholder={t.noteMore} data-testid="checkout-note" />
                    </div>
                  </form>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
                  <h2 className="font-semibold text-lg text-[#0F172A] mb-4">{t.orderSummary}</h2>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex gap-3">
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{item.name}</p>
                          <p className="text-xs text-[#64748B]">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#0F172A]">{formatVND(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">{t.subtotal}</span>
                      <span className="text-[#0F172A]">{formatVND(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">{t.shipping}</span>
                      <span className="text-green-500 font-medium">{t.freeShipping}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span className="text-[#0F172A]">{t.total}</span>
                      <span style={{ color: themeColor }}>{formatVND(cartTotal)}</span>
                    </div>
                  </div>
                  <Button form="checkout-form" type="submit" className="w-full hover:opacity-90 rounded-[5px] py-6 mt-6 text-base" style={{ backgroundColor: themeColor }} data-testid="place-order-btn">
                    {t.placeOrder}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontPage;
