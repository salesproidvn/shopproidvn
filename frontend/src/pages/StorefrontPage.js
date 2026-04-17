import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Search, ShoppingCart, Phone, Mail, MapPin, Facebook, Instagram, Download,
  Plus, Minus, Trash2, ArrowLeft, LayoutDashboard, X, AlertTriangle, Play,
  MessageCircle, Map, FolderOpen, ChevronLeft, ChevronRight, FileText, Calendar, Share2,
  Home, Store, Grid3X3, BookOpen, PhoneCall, Menu as MenuIcon, ChevronDown, Globe, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { emitNotification } from '../context/NotificationContext';
import MediaLibrary from '../components/MediaLibrary';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PRODUCTS_PER_CATEGORY = 10;

const StorefrontPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const { cart, addToCart: ctxAddToCart, updateQuantity, removeFromCart: ctxRemoveFromCart, clearCart, cartTotal, cartCount } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '', customer_address: '', note: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(null); // null = no video, number = index into allVideos array
  const scrollPosRef = useRef(0);
  const productFromUrl = useRef(false);
  const productFromMegaMenu = useRef(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Inline edit state (for shop owner editing from storefront)
  const [editProduct, setEditProduct] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMediaOpen, setEditMediaOpen] = useState(false);
  const [editMediaTarget, setEditMediaTarget] = useState(null); // 'product' or 'post'
  const isOwner = user?.shop_id === shop?.id;
  const [expandedCategories, setExpandedCategories] = useState({});
  const [bannerIndex, setBannerIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  useEffect(() => { fetchShopData(); }, [slug]);

  useEffect(() => {
    if (shop?.name) {
      document.title = shop.name;
    }
    return () => { document.title = 'Ocean Pro Web'; };
  }, [shop?.name]);
  // Save scroll position continuously & restore when returning
  useEffect(() => {
    if (loading) return;
    const savedPos = sessionStorage.getItem(`scroll-${slug}`);
    if (savedPos) {
      const pos = parseInt(savedPos);
      sessionStorage.removeItem(`scroll-${slug}`);
      setTimeout(() => window.scrollTo(0, pos), 200);
    }
    const handleScroll = () => sessionStorage.setItem(`scroll-${slug}`, window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, loading]);

  // Auto-slide banner
  useEffect(() => {
    const banners = shop?.banners || [];
    if (banners.length <= 1 || !shop?.banner_enabled) return;
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [shop]);

  // Auto-open product/checkout from query param
  useEffect(() => {
    const productParam = searchParams.get('product');
    if (productParam && products.length > 0) {
      const found = products.find(p => p.id === productParam);
      if (found) { productFromUrl.current = true; setSelectedProduct(found); setActiveImage(0); setShowVideo(null); }
    }
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.length > 0) {
      setSelectedCategory(categoryParam);
    }
    if (searchParams.get('checkout') === '1' && cart.length > 0) {
      setShowCheckout(true);
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
      // Find if selected is a subcategory
      const selectedCat = categories.find(c => c.id === selectedCategory);
      const isSubCategory = selectedCat && selectedCat.parent_id;
      
      if (isSubCategory) {
        // When subcategory selected: show products tagged with this sub OR with the parent
        const parentId = selectedCat.parent_id;
        const siblingSubIds = categories.filter(c => c.parent_id === parentId).map(c => c.id);
        result = result.filter(p => 
          p.category_id === selectedCategory || 
          (p.category_id === parentId)
        );
      } else {
        // When parent selected: include products from this parent AND all its subs
        const subCatIds = categories.filter(c => c.parent_id === selectedCategory).map(c => c.id);
        const matchIds = [selectedCategory, ...subCatIds];
        result = result.filter(p => matchIds.includes(p.category_id));
      }
    }
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(p => p.name.toLowerCase().includes(q)); }
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products, categories]);

  const addToCart = (product) => {
    ctxAddToCart(product.id, product, 1);
    toast.success(t.addedToCart);
  };

  const updateCartQuantity = (productId, delta) => {
    const item = cart.find(i => i.product_id === productId);
    if (item) updateQuantity(productId, item.quantity + delta);
  };

  const removeFromCart = (productId) => { ctxRemoveFromCart(productId); };

  const themeColor = shop?.theme_color || '#0055FF';

  const layoutSections = shop?.layout_sections?.length ? shop.layout_sections : [
    { id: 'banner', enabled: true },
    { id: 'categories', enabled: true },
    { id: 'blog', enabled: true },
    { id: 'featured', enabled: true },
    { id: 'products', enabled: true }
  ];

  const isSectionEnabled = (id) => {
    const section = layoutSections.find(s => s.id === id);
    return section ? section.enabled : true;
  };

  // Inline edit handlers
  const handleSaveProduct = async () => {
    if (!editProduct) return;
    setEditSaving(true);
    try {
      await axios.put(`${API}/dashboard/products/${editProduct.id}`, editProduct);
      toast.success('Đã cập nhật sản phẩm');
      setEditProduct(null);
      // Refresh products
      const { data } = await axios.get(`${API}/shop/${slug}/products`);
      setProducts(data);
    } catch { toast.error('Lỗi cập nhật'); }
    setEditSaving(false);
  };

  const handleSavePost = async () => {
    if (!editPost) return;
    setEditSaving(true);
    try {
      await axios.put(`${API}/dashboard/posts/${editPost.id}`, editPost);
      toast.success('Đã cập nhật bài viết');
      setEditPost(null);
      const { data } = await axios.get(`${API}/shop/${slug}/posts`);
      setPosts(data || []);
    } catch { toast.error('Lỗi cập nhật'); }
    setEditSaving(false);
  };


  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const orderData = { ...checkoutForm, items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })) };
      const { data } = await axios.post(`${API}/shop/${slug}/orders`, orderData);
      emitNotification({ type: 'new_order', title: t.newOrder, message: `${checkoutForm.customer_name} - ${formatVND(data.total_amount)}`, order_id: data.id, shop_slug: slug });
      clearCart(); setShowCheckout(false); setShowCart(false);
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
        <div className="relative w-full overflow-hidden rounded-[5px]">
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

  // Post Grid Component (grid listing like products)
  const PostCarousel = () => {
    if (!posts.length || shop?.blog_enabled === false) return null;
    return (
      <div className="mb-8" data-testid="post-carousel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{t.latestPosts}</h3>
          <Link to={`/shop/${slug}/posts`}><Button variant="ghost" size="sm" className="text-sm rounded-[5px]" style={{ color: themeColor }}>{t.readMore} &rarr;</Button></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-5" data-testid="post-grid">
          {posts.slice(0, 5).map(post => (
            <Link key={post.id} to={`/shop/${slug}/posts/${post.id}`}
              className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all relative"
              data-testid={`post-card-${post.id}`}>
              {isOwner && (
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditPost({...post}); }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`edit-post-storefront-${post.id}`}>
                  <Pencil className="w-3.5 h-3.5 text-[#475569]" />
                </button>
              )}
              <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                {post.thumbnail ? (
                  <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE]">
                    <FileText className="w-10 h-10 text-[#CBD5E1]" />
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-[10px] text-[#94A3B8] mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.created_at).toLocaleDateString('vi-VN')}
                </p>
                <h4 className="font-medium text-[#0F172A] text-sm sm:text-base line-clamp-2 mb-1">{post.title}</h4>
                <p className="text-xs text-[#64748B] line-clamp-2" dangerouslySetInnerHTML={{ __html: post.description?.replace(/<[^>]+>/g, '') || '' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Product Card
  const ProductCard = ({ product }) => (
    <div className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all cursor-pointer relative"
      onClick={() => { scrollPosRef.current = window.scrollY; setSelectedProduct(product); setActiveImage(0); setShowVideo(null); }} data-testid={`product-${product.id}`}>
      {isOwner && (
        <button type="button" onClick={(e) => { e.stopPropagation(); setEditProduct({...product}); }}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`edit-product-storefront-${product.id}`}>
          <Pencil className="w-3.5 h-3.5 text-[#475569]" />
        </button>
      )}
      <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div className="p-3 sm:p-4 text-center">
        <h3 className="font-medium text-[#0F172A] text-sm sm:text-base line-clamp-2 mb-1">{product.name}</h3>
        {product.sku && <p className="text-[10px] text-[#94A3B8] mb-1">SKU: {product.sku}</p>}
        <p className="text-base sm:text-lg font-bold mb-2" style={{ color: themeColor }}>{formatVND(product.price)}</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-5">
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
        ) : selectedCategory === 'all' && !searchQuery ? (
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
                    <Link to={`/shop/${slug}/category/${cat.id}`} className="hover:underline">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{cat.name}</h3>
                    </Link>
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

  // Category Grid Component
  const CategoryGrid = () => {
    const parentCats = categories.filter(c => !c.parent_id);
    if (!parentCats.length) return null;
    return (
      <div className="mb-8" data-testid="category-grid-section">
        <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-4">{t.productCategories}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4">
          {parentCats.map(cat => (
            <Link
              key={cat.id}
              to={`/shop/${slug}/category/${cat.id}`}
              className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all"
              data-testid={`cat-grid-${cat.id}`}
            >
              <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-10 h-10 text-[#CBD5E1]" />
                  </div>
                )}
              </div>
              <div className="p-2 text-center">
                <span className="text-xs font-medium text-[#334155] line-clamp-1">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Section renderer based on layout order
  const renderSection = (section) => {
    if (!section.enabled) return null;
    switch (section.id) {
      case 'banner': return <BannerSlider key="banner" />;
      case 'categories': return <CategoryGrid key="categories" />;
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
        <header className="sticky top-0 z-[60] bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button onClick={() => {
                  if (productFromUrl.current) {
                    productFromUrl.current = false;
                    navigate(-1);
                  } else if (productFromMegaMenu.current) {
                    productFromMegaMenu.current = false;
                    setSelectedProduct(null); setActiveImage(0); setShowVideo(null);
                    setMobileMenuOpen(true);
                  } else {
                    const pos = scrollPosRef.current; setSelectedProduct(null); setActiveImage(0); setShowVideo(null); if (searchParams.get('product')) { searchParams.delete('product'); setSearchParams(searchParams, { replace: true }); } setTimeout(() => window.scrollTo(0, pos), 0);
                  }
                }}
                className="flex items-center gap-2 text-base font-semibold text-[#0F172A] hover:opacity-70 transition-opacity px-3 py-2 -ml-3 rounded-lg"
                data-testid="product-close-btn">
                <ArrowLeft className="w-5 h-5" /> {t.back || 'Quay lại'}
              </button>
              <Link to={`/shop/${slug}`} className="font-bold text-[#0F172A] text-base truncate max-w-[200px] hover:opacity-70 transition-opacity" data-testid="product-header-shop-name">{shop?.name}</Link>
              <button onClick={() => {
                const ogUrl = `${process.env.REACT_APP_BACKEND_URL}/api/og/shop/${slug}/product/${selectedProduct.id}`;
                const directUrl = `${window.location.origin}/shop/${slug}?product=${selectedProduct.id}`;
                if (navigator.share) {
                  navigator.share({ title: selectedProduct.name, text: `${selectedProduct.name} - ${formatVND(selectedProduct.price)}`, url: ogUrl });
                } else {
                  navigator.clipboard.writeText(ogUrl);
                  toast.success(t.linkCopied || 'Link copied!');
                }
              }} className="flex items-center gap-2 text-sm text-[#334155] hover:text-[#0F172A] transition-colors" data-testid="product-share-top-btn">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-8">
            <div className="flex flex-col w-full">
              {(() => {
                const allVideos = [];
                if (embedUrl) allVideos.push({ embed: embedUrl, type: 'youtube' });
                (selectedProduct.video_links || []).forEach(vl => {
                  const parsed = getVideoEmbed(vl);
                  if (parsed) allVideos.push(parsed);
                });
                const activeVid = showVideo !== null ? allVideos[showVideo] : null;
                return (
                  <>
                    {/* Preload all images into browser cache */}
                    {images.length > 1 && images.map((img, idx) => idx !== activeImage && (
                      <link key={`preload-${idx}`} rel="preload" as="image" href={img} />
                    ))}
                    <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden rounded-lg" data-testid="product-main-image">
                      {activeVid ? (
                        <iframe src={activeVid.embed} title="Product video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                      ) : (
                        <img src={images[activeImage]} alt={selectedProduct.name} className="w-full h-full object-contain" loading="eager" />
                      )}
                    </div>
                    {(images.length > 1 || allVideos.length > 0) && (
                      <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 scrollbar-hide" data-testid="product-thumbnails">
                        {images.map((img, idx) => (
                          <button key={`img-${idx}`} onClick={() => { setActiveImage(idx); setShowVideo(null); }}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${showVideo === null && activeImage === idx ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                            style={showVideo === null && activeImage === idx ? { borderColor: themeColor, '--tw-ring-color': themeColor } : {}}
                            data-testid={`thumb-${idx}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" loading="eager" />
                          </button>
                        ))}
                        {allVideos.map((vid, idx) => (
                          <button key={`vid-${idx}`} onClick={() => setShowVideo(idx)}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded flex-shrink-0 border-2 transition-all flex items-center justify-center bg-[#0F172A] ${showVideo === idx ? 'ring-1' : 'border-transparent hover:border-[#E2E8F0]'}`}
                            style={showVideo === idx ? { borderColor: themeColor, '--tw-ring-color': themeColor } : {}}
                            data-testid={`thumb-video-${idx}`}>
                            <Play className="w-5 h-5 text-white fill-white" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden w-full">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F172A] mb-2 sm:mb-3 break-words" data-testid="product-name">{selectedProduct.name}</h1>
              <p className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: themeColor }} data-testid="product-price">{formatVND(selectedProduct.price)}</p>
              {selectedProduct.sku && <p className="text-xs text-[#94A3B8] mb-2" data-testid="product-sku">SKU: {selectedProduct.sku}</p>}
              {selectedProduct.category && <p className="text-sm text-[#94A3B8] mb-4">{selectedProduct.category}</p>}
              <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Button className="flex-1 hover:opacity-90 py-4 sm:py-6 text-sm sm:text-base rounded-[5px]"
                  style={{ backgroundColor: themeColor }}
                  onClick={() => { addToCart(selectedProduct); }} data-testid="product-add-cart">
                  <ShoppingCart className="w-5 h-5 mr-2" /> {t.addToCart}
                </Button>
                <Button variant="outline" className="py-6 px-4 rounded-[5px]"
                  onClick={() => {
                    const ogUrl = `${process.env.REACT_APP_BACKEND_URL}/api/og/shop/${slug}/product/${selectedProduct.id}`;
                    if (navigator.share) {
                      navigator.share({ title: selectedProduct.name, text: `${selectedProduct.name} - ${formatVND(selectedProduct.price)}`, url: ogUrl });
                    } else {
                      navigator.clipboard.writeText(ogUrl);
                      toast.success(t.linkCopied || 'Link copied!');
                    }
                  }} data-testid="product-share-btn">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
              {selectedProduct.description && <div className="text-[#334155] text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 prose prose-sm max-w-none break-words overflow-hidden [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" data-testid="product-description" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />}
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
                      onClick={() => { setSelectedProduct(rp); setActiveImage(0); setShowVideo(null); setTimeout(() => { document.querySelector('[data-testid="product-fullpage"]')?.scrollTo({ top: 0, behavior: 'smooth' }); }, 50); }}
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
              <span className="font-bold text-base text-[#0F172A]">{shop.name}</span>
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
              {user && (user.role === 'shop_owner' || user.role === 'super_admin') ? (
                <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} data-testid="storefront-dashboard-btn">
                  <Button variant="outline" size="sm" className="rounded-full text-xs hover:text-white" style={{ borderColor: themeColor, color: themeColor }} onMouseEnter={(e) => { e.target.style.backgroundColor = themeColor; e.target.style.color = 'white'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = themeColor; }}>
                    <LayoutDashboard className="w-3 h-3 mr-1" /> {t.dashboard}
                  </Button>
                </Link>
              ) : !user && (
                <Link to="/" data-testid="storefront-login-btn">
                  <Button size="sm" className="rounded-full text-xs text-white" style={{ backgroundColor: themeColor }}>
                    {t.login || 'Đăng nhập'}
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
      </header>

      {/* Mobile Mega Menu - Full screen overlay (rendered outside header for proper z-index) */}
      {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-white overflow-y-auto" data-testid="mobile-mega-menu">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-white">
              <div className="flex items-center gap-2">
                {shop.logo_url && <img src={shop.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />}
                <span className="font-bold text-[#0F172A] text-sm">{shop.name}</span>
              </div>
              <button onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]" data-testid="mobile-menu-close">
                <X className="w-5 h-5 text-[#475569]" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="px-4 py-3 border-b border-[#F1F5F9]">
              {(shop.menu_items || []).filter(mi => mi.enabled).sort((a, b) => a.position - b.position).map((mi, idx) => (
                mi.type === 'scroll_shop' ? (
                  <button key={mi.id} onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); setSelectedCategory('all'); setTimeout(() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                    className="w-full py-3 text-sm font-medium text-[#0F172A] text-left" data-testid={`mobile-menu-${idx}`}>
                    {mi.label}
                  </button>
                ) : mi.type === 'external' ? (
                  <a key={mi.id} href={mi.url} target="_blank" rel="noopener noreferrer" onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); }}
                    className="block py-3 text-sm font-medium text-[#0F172A]" data-testid={`mobile-menu-${idx}`}>
                    {mi.label}
                  </a>
                ) : (
                  <Link key={mi.id} to={mi.url} onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); }}
                    className="block py-3 text-sm font-medium text-[#0F172A]" data-testid={`mobile-menu-${idx}`}>
                    {mi.label}
                  </Link>
                )
              ))}
            </div>

            {/* Categories Mega Menu */}
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2 px-1">{t.categories}</p>
              {(() => {
                const parentCats = categories.filter(c => !c.parent_id);
                const megaConfig = shop.mega_menu_categories || [];
                let megaCats;
                if (megaConfig.length > 0) {
                  megaCats = megaConfig.filter(mc => mc.enabled).sort((a, b) => a.position - b.position)
                    .map(mc => parentCats.find(c => c.id === mc.category_id)).filter(Boolean);
                } else {
                  megaCats = parentCats;
                }
                return megaCats.map(cat => {
                  const subs = categories.filter(c => c.parent_id === cat.id);
                  const isExpanded = mobileExpandedCat === cat.id;
                  const catProducts = products.filter(p => {
                    const subIds = subs.map(s => s.id);
                    return p.category_id === cat.id || subIds.includes(p.category_id);
                  }).slice(0, 4);

                  return (
                    <div key={cat.id} className="border-b border-[#F1F5F9] last:border-0" data-testid={`mobile-mega-cat-${cat.id}`}>
                      <button
                        onClick={() => {
                          if (subs.length > 0) {
                            setMobileExpandedCat(isExpanded ? null : cat.id);
                          } else {
                            setMobileMenuOpen(false);
                            setMobileExpandedCat(null);
                            setSelectedCategory(cat.id);
                            setTimeout(() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                          }
                        }}
                        className="flex items-center justify-between w-full py-3 px-1"
                        data-testid={`mobile-mega-cat-btn-${cat.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#F8FAFC]" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor + '12' }}>
                              <FolderOpen className="w-4 h-4" style={{ color: themeColor }} />
                            </div>
                          )}
                          <span className="text-sm font-medium text-[#0F172A]">{cat.name}</span>
                        </div>
                        {subs.length > 0 && (
                          <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {/* Expanded subcategories + products */}
                      {isExpanded && subs.length > 0 && (
                        <div className="pb-3 pl-2 animate-in slide-in-from-top-2 duration-200" data-testid={`mobile-mega-subs-${cat.id}`}>
                          {/* Subcategory chips */}
                          <div className="flex flex-wrap gap-2 mb-3 pl-11">
                            <button
                              onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); setSelectedCategory(cat.id); setTimeout(() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
                              style={{ borderColor: themeColor, color: themeColor }}
                              data-testid={`mobile-sub-all-${cat.id}`}
                            >
                              {t.viewAll || 'Tất cả'}
                            </button>
                            {subs.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); setSelectedCategory(sub.id); setTimeout(() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                                className="px-3 py-1.5 text-xs font-medium text-[#475569] rounded-full border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors"
                                data-testid={`mobile-sub-${sub.id}`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>

                          {/* Product preview row */}
                          {catProducts.length > 0 && (
                            <div className="pl-11">
                              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                                {catProducts.map(p => (
                                  <div
                                    key={p.id}
                                    className="flex-shrink-0 w-24 cursor-pointer"
                                    onClick={() => { setMobileMenuOpen(false); setMobileExpandedCat(null); scrollPosRef.current = window.scrollY; productFromMegaMenu.current = true; setSelectedProduct(p); setActiveImage(0); setShowVideo(null); }}
                                    data-testid={`mobile-mega-prod-${p.id}`}
                                  >
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F8FAFC] mb-1">
                                      {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Grid3X3 className="w-6 h-6 text-[#CBD5E1]" />
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#334155] line-clamp-1">{p.name}</p>
                                    <p className="text-[11px] font-bold" style={{ color: themeColor }}>{formatVND(p.price)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer contact */}
            {(shop.contact_phone || shop.contact_email) && (
              <div className="px-4 py-4 mt-2 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                {shop.contact_phone && (
                  <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-3 py-2 text-sm text-[#334155]">
                    <PhoneCall className="w-4 h-4" style={{ color: themeColor }} />
                    {shop.contact_phone}
                  </a>
                )}
                {shop.contact_email && (
                  <a href={`mailto:${shop.contact_email}`} className="flex items-center gap-3 py-2 text-sm text-[#334155]">
                    <MessageCircle className="w-4 h-4" style={{ color: themeColor }} />
                    {shop.contact_email}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

      {/* Shopee-style Mega Menu - Desktop Only */}
      <div className="hidden lg:block sticky top-14 z-30 bg-white border-b border-[#E2E8F0] shadow-sm" data-testid="mega-menu-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <nav className="flex items-center justify-center gap-0">
            {(() => {
              const parentCats = categories.filter(c => !c.parent_id);
              const megaConfig = shop.mega_menu_categories || [];
              // If config exists, use it to filter and sort; otherwise show all parent cats
              let megaCats;
              if (megaConfig.length > 0) {
                megaCats = megaConfig
                  .filter(mc => mc.enabled)
                  .sort((a, b) => a.position - b.position)
                  .map(mc => parentCats.find(c => c.id === mc.category_id))
                  .filter(Boolean);
              } else {
                megaCats = parentCats;
              }
              return megaCats;
            })().map(cat => {
              const subs = categories.filter(c => c.parent_id === cat.id);
              const catProducts = products.filter(p => {
                const subIds = subs.map(s => s.id);
                return p.category_id === cat.id || subIds.includes(p.category_id);
              }).slice(0, 3);
              return (
                <div key={cat.id} className="group relative" data-testid={`mega-cat-${cat.id}`}>
                  <Link
                    to={`/shop/${slug}/category/${cat.id}`}
                    className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                    style={{ '--hover-color': themeColor }}
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    {cat.name}
                    {subs.length > 0 && <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-all group-hover:rotate-180" />}
                  </Link>
                  {/* Mega dropdown panel */}
                  {subs.length > 0 && (
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex: 40, width: '100%', maxWidth: '640px' }}>
                      <div className="bg-white rounded-b-xl shadow-xl border border-[#E2E8F0] border-t-2 p-5" style={{ borderTopColor: themeColor }}>
                        <div className="flex gap-6">
                          {/* Subcategories column */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3">{cat.name}</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                              {subs.map(sub => (
                                <Link
                                  key={sub.id}
                                  to={`/shop/${slug}/category/${cat.id}?sub=${sub.id}`}
                                  className="group/sub flex items-center gap-2 py-2 px-2 rounded-lg text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-40 group-hover/sub:opacity-100 transition-opacity" style={{ backgroundColor: themeColor }} />
                                  <span className="truncate group-hover/sub:text-[#0F172A] transition-colors">{sub.name}</span>
                                </Link>
                              ))}
                            </div>
                            <Link
                              to={`/shop/${slug}/category/${cat.id}`}
                              className="inline-flex items-center gap-1 mt-3 text-xs font-semibold hover:underline transition-colors"
                              style={{ color: themeColor }}
                            >
                              {t.viewAll || 'Xem tất cả'} {cat.name} →
                            </Link>
                          </div>
                          {/* Featured product images */}
                          {catProducts.length > 0 && (
                            <div className="w-40 shrink-0 space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">{t.featuredProducts}</h4>
                              {catProducts.map(p => (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                                  onClick={() => { scrollPosRef.current = window.scrollY; productFromMegaMenu.current = true; setSelectedProduct(p); setActiveImage(0); setShowVideo(null); }}
                                >
                                  <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-md object-cover shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#0F172A] truncate">{p.name}</p>
                                    <p className="text-xs font-bold" style={{ color: themeColor }}>{formatVND(p.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dynamic sections (banner, blog, featured) in layout order */}
        {layoutSections.filter(s => s.id !== 'products').map(section => renderSection(section))}

        {/* Filters (always before products) */}
        <div id="products-section">
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
        </div>

        {/* Products section */}
        <ProductsSection />
        </div>
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
                        item.url.startsWith('http') ? (
                          <a key={itemIdx} href={item.url} target="_blank" rel="noopener noreferrer"
                            className="block hover:text-white transition-colors" data-testid={`footer-link-${idx}-${itemIdx}`}>
                            {item.text}
                          </a>
                        ) : (
                          <Link key={itemIdx} to={item.url}
                            className="block hover:text-white transition-colors" data-testid={`footer-link-${idx}-${itemIdx}`}>
                            {item.text}
                          </Link>
                        )
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

      {/* Bottom Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto sm:rounded-full sm:shadow-[0_4px_24px_rgba(0,0,0,0.18)] sm:px-2" style={{ backgroundColor: themeColor }} data-testid="bottom-bar">
        <div className="grid grid-cols-4 h-14 max-w-7xl mx-auto sm:flex sm:h-11 sm:gap-0">
          {shop.contact_phone ? (
            <a href={`tel:${shop.contact_phone}`} className="flex flex-col items-center justify-center gap-0.5 text-white/80 hover:text-white active:bg-white/10 transition-colors sm:px-4 sm:rounded-full sm:h-full" data-testid="bottom-call">
              <Phone className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-[10px] font-bold whitespace-nowrap sm:hidden">{t.call}</span>
            </a>
          ) : <div />}
          {shop.contact_phone ? (
            <a href={`https://zalo.me/${shop.contact_phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-0.5 text-white/80 hover:text-white active:bg-white/10 transition-colors sm:px-4 sm:rounded-full sm:h-full" data-testid="bottom-message">
              <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-[10px] font-bold whitespace-nowrap sm:hidden">{t.message}</span>
            </a>
          ) : <div />}
          <button onClick={() => {
            const stripHtml = (html) => html ? html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n/g, ' ').trim() : '';
            const escapeLine = (s) => s ? s.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;') : '';
            const name = escapeLine(shop.name || '');
            const phone = (shop.contact_phone || '').replace(/\s/g, '');
            const email = shop.contact_email || '';
            const addr = escapeLine(shop.address || '');
            const note = escapeLine(stripHtml(shop.description || ''));
            const url = `${window.location.origin}/shop/${slug}`;
            const lines = [
              'BEGIN:VCARD',
              'VERSION:3.0',
              `FN:${name}`,
              `ORG:${name}`,
            ];
            if (phone) lines.push(`TEL;TYPE=WORK:${phone}`);
            if (email) lines.push(`EMAIL;TYPE=WORK:${email}`);
            if (addr) lines.push(`ADR;TYPE=WORK:;;${addr};;;;`);
            if (note) lines.push(`NOTE:${note}`);
            if (shop.logo_url && shop.logo_url.startsWith('http')) {
              lines.push(`PHOTO;VALUE=URI:${shop.logo_url}`);
            } else if (shop.logo_url && shop.logo_url.startsWith('data:image')) {
              const b64match = shop.logo_url.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
              if (b64match) {
                lines.push(`PHOTO;ENCODING=b;TYPE=${b64match[1].toUpperCase()}:${b64match[2]}`);
              }
            }
            lines.push(`URL:${url}`);
            if (shop.social_facebook) lines.push(`X-SOCIALPROFILE;TYPE=facebook:${shop.social_facebook}`);
            if (shop.social_instagram) lines.push(`X-SOCIALPROFILE;TYPE=instagram:${shop.social_instagram}`);
            lines.push('END:VCARD');
            const vcard = lines.join('\r\n');
            const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = `${shop.name || 'contact'}.vcf`;
            a.click(); URL.revokeObjectURL(blobUrl);
          }} className="flex flex-col items-center justify-center gap-0.5 text-white/80 hover:text-white active:bg-white/10 transition-colors sm:px-4 sm:rounded-full sm:h-full" data-testid="bottom-save-contact">
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] font-bold whitespace-nowrap sm:hidden">Lưu liên hệ</span>
          </button>
          <button onClick={() => setShowCategoryMenu(!showCategoryMenu)} className="flex flex-col items-center justify-center gap-0.5 text-white/80 hover:text-white active:bg-white/10 transition-colors relative sm:px-4 sm:rounded-full sm:h-full" data-testid="bottom-categories">
            <Grid3X3 className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="text-[10px] font-bold whitespace-nowrap sm:hidden">Danh mục</span>
          </button>
        </div>
      </div>

      {/* Category Menu Popup */}
      {showCategoryMenu && (
        <>
          <div className="fixed inset-0 z-[41]" onClick={() => setShowCategoryMenu(false)} />
          <div className="fixed bottom-[60px] left-0 right-0 z-[42] bg-white border-t border-[#E2E8F0] shadow-xl p-4 max-h-64 overflow-y-auto sm:bottom-20 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-[90vw] sm:max-w-md sm:rounded-xl sm:border sm:border-[#E2E8F0]" data-testid="category-menu-popup">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => (
                <Link key={cat.id} to={`/shop/${slug}/category/${cat.parent_id || cat.id}`} className="text-left p-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] rounded-lg transition-colors text-sm font-medium text-[#0F172A]" data-testid={`cat-menu-${cat.id}`}>
                  {cat.name}
                </Link>
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
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { if (searchParams.get('checkout') === '1') { navigate(-1); } else { setShowCheckout(false); setShowCart(true); } }} data-testid="checkout-back-btn"><ArrowLeft className="w-5 h-5" /></Button>
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

      {/* Inline Product Edit Modal */}
      <Dialog open={!!editProduct} onOpenChange={(v) => { if (!v) setEditProduct(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-white" hideClose>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Sửa sản phẩm</DialogTitle>
            <DialogDescription className="sr-only">Edit product</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium text-[#334155] mb-1 block">Tên sản phẩm</label>
                <Input value={editProduct.name || ''} onChange={(e) => setEditProduct({...editProduct, name: e.target.value})} className="text-sm" data-testid="inline-edit-product-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#334155] mb-1 block">Giá (VND)</label>
                  <Input type="number" value={editProduct.price || 0} onChange={(e) => setEditProduct({...editProduct, price: Number(e.target.value)})} className="text-sm" data-testid="inline-edit-product-price" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#334155] mb-1 block">SKU</label>
                  <Input value={editProduct.sku || ''} onChange={(e) => setEditProduct({...editProduct, sku: e.target.value})} className="text-sm" data-testid="inline-edit-product-sku" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#334155] mb-1 block">Ảnh ({(editProduct.images || []).length}/8)</label>
                <div className="flex gap-2 flex-wrap">
                  {(editProduct.images || []).map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { const imgs = [...(editProduct.images || [])]; imgs.splice(idx, 1); setEditProduct({...editProduct, images: imgs, image_url: imgs[0] || ''}); }}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">x</button>
                    </div>
                  ))}
                  {(editProduct.images || []).length < 8 && (
                    <button type="button" onClick={() => { setEditMediaTarget('product'); setEditMediaOpen(true); }}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:border-[#94A3B8] transition-colors" data-testid="inline-edit-product-add-image">
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditProduct(null)}>Hủy</Button>
                <Button type="button" size="sm" className="flex-1 text-xs text-white" style={{ backgroundColor: themeColor }} onClick={handleSaveProduct} disabled={editSaving} data-testid="inline-edit-product-save">
                  {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inline Post Edit Modal */}
      <Dialog open={!!editPost} onOpenChange={(v) => { if (!v) setEditPost(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-white" hideClose>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Sửa bài viết</DialogTitle>
            <DialogDescription className="sr-only">Edit post</DialogDescription>
          </DialogHeader>
          {editPost && (
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium text-[#334155] mb-1 block">Tiêu đề</label>
                <Input value={editPost.title || ''} onChange={(e) => setEditPost({...editPost, title: e.target.value})} className="text-sm" data-testid="inline-edit-post-title" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#334155] mb-1 block">Ảnh đại diện</label>
                <div className="flex items-center gap-2">
                  {editPost.thumbnail && <img src={editPost.thumbnail} alt="" className="w-20 h-14 rounded-lg object-cover border" />}
                  <button type="button" onClick={() => { setEditMediaTarget('post'); setEditMediaOpen(true); }}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#475569] hover:bg-[#F8FAFC] transition-colors" data-testid="inline-edit-post-thumbnail">
                    Chọn ảnh
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#334155] mb-1 block">Nội dung</label>
                <Textarea value={(editPost.description || '').replace(/<[^>]+>/g, '')} onChange={(e) => setEditPost({...editPost, description: `<p>${e.target.value.replace(/\n/g, '</p><p>')}</p>`})} rows={6} className="text-sm" data-testid="inline-edit-post-description" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditPost(null)}>Hủy</Button>
                <Button type="button" size="sm" className="flex-1 text-xs text-white" style={{ backgroundColor: themeColor }} onClick={handleSavePost} disabled={editSaving} data-testid="inline-edit-post-save">
                  {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Media Library for inline edit */}
      <MediaLibrary
        open={editMediaOpen}
        onClose={() => setEditMediaOpen(false)}
        onSelect={(urls) => {
          if (editMediaTarget === 'product' && editProduct) {
            const newUrls = Array.isArray(urls) ? urls : [urls];
            const combined = [...(editProduct.images || []), ...newUrls].slice(0, 8);
            setEditProduct({...editProduct, images: combined, image_url: combined[0] || ''});
          } else if (editMediaTarget === 'post' && editPost) {
            setEditPost({...editPost, thumbnail: Array.isArray(urls) ? urls[0] : urls});
          }
        }}
        multiple={editMediaTarget === 'product'}
        maxSelect={editMediaTarget === 'product' ? 8 - (editProduct?.images?.length || 0) : 1}
      />
    </div>
  );
};

export default StorefrontPage;
