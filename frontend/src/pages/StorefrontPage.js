import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import PriceFilter from '../components/PriceFilter';
import { 
  Search, ShoppingCart, Phone, Mail, MapPin, Facebook, Instagram, 
  Plus, Minus, Trash2, ArrowLeft, LayoutDashboard, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { emitNotification } from '../context/NotificationContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StorefrontPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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

  useEffect(() => {
    fetchShopData();
  }, [slug]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const [shopRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/shop/${slug}`),
        axios.get(`${API}/shop/${slug}/products`),
        axios.get(`${API}/shop/${slug}/categories`)
      ]);
      setShop(shopRes.data);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data);
      setCategories(categoriesRes.data);

      // Check expiry
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

  // Filter products locally
  useEffect(() => {
    let result = [...products];
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => p.category_id === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    if (priceFilter.id !== 'all') {
      result = result.filter(p => p.price >= priceFilter.min && p.price <= priceFilter.max);
    }
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

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...checkoutForm,
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
      };
      const { data } = await axios.post(`${API}/shop/${slug}/orders`, orderData);
      
      // Emit notification for shop owner
      emitNotification({
        type: 'new_order',
        title: t.newOrder,
        message: `${checkoutForm.customer_name} - ${formatVND(data.total_amount)}`,
        order_id: data.id,
        shop_slug: slug,
      });
      
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setCheckoutForm({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '', note: '' });
      navigate(`/shop/${slug}/thank-you`, { state: { order: data } });
    } catch (err) {
      toast.error(t.orderFailed);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">{t.shopNotFound}</h1>
        <p className="text-[#64748B] mb-6">{error}</p>
        <Link to="/">
          <Button className="bg-[#0055FF] hover:bg-[#0040CC]">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="storefront-page">
      {/* Expired Overlay */}
      {isExpired && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" data-testid="shop-expired-overlay">
          <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-3">{t.shopExpired}</h2>
            <p className="text-[#64748B] mb-8">{t.shopExpiredMsg}</p>
            <Link to="/">
              <Button className="bg-[#0055FF] hover:bg-[#0040CC] rounded-full px-8 py-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-[#0055FF] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{shop.name[0]}</span>
                </div>
              )}
              <span className="font-bold text-lg text-[#0F172A]">{shop.name}</span>
            </div>
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-[#F8FAFC]" data-testid="search-input" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && (user.role === 'shop_owner' || user.role === 'super_admin') && (
                <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} data-testid="storefront-dashboard-btn">
                  <Button variant="outline" className="rounded-full px-4 text-sm border-[#0055FF] text-[#0055FF] hover:bg-[#0055FF] hover:text-white">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t.dashboard}
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="relative rounded-full" onClick={() => setShowCart(true)} data-testid="cart-button">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#0055FF] text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0055FF]/5 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4">{shop.name}</h1>
            {shop.description && <p className="text-[#64748B] text-lg mb-6">{shop.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-[#64748B]">
              {shop.contact_phone && (
                <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-2 hover:text-[#0055FF]">
                  <Phone className="w-4 h-4" /> {shop.contact_phone}
                </a>
              )}
              {shop.contact_email && (
                <a href={`mailto:${shop.contact_email}`} className="flex items-center gap-2 hover:text-[#0055FF]">
                  <Mail className="w-4 h-4" /> {shop.contact_email}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="md:hidden flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input type="text" placeholder={t.searchShort} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="category-filter">
                <SelectValue placeholder={t.allCategories} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">{t.allCategories}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PriceFilter onFilter={setPriceFilter} activeFilter={priceFilter} />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#64748B] text-lg">{t.noProducts}</p>
          </div>
        ) : selectedCategory === 'all' && !searchQuery && priceFilter.id === 'all' ? (
          <div className="space-y-10" data-testid="grouped-product-view">
            {categories.map(cat => {
              const catProducts = filteredProducts
                .filter(p => p.category_id === cat.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0));
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} data-testid={`category-section-${cat.id}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{cat.name}</h3>
                    <div className="flex-1 h-px bg-[#E2E8F0]" />
                    <span className="text-sm text-[#94A3B8]">{catProducts.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
                    {catProducts.map((product) => (
                      <div key={product.id} className="group bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => setSelectedProduct(product)} data-testid={`product-${product.id}`}>
                        <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-3 sm:p-4 text-center">
                          <h3 className="font-medium text-[#0F172A] text-sm sm:text-base line-clamp-2 mb-2">{product.name}</h3>
                          <p className="text-base sm:text-lg font-bold text-[#0055FF] mb-2">{formatVND(product.price)}</p>
                          <Button className="w-full bg-[#0055FF] hover:bg-[#0040CC] text-white text-xs sm:text-sm h-9 sm:h-10 rounded-lg"
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }} data-testid={`add-cart-${product.id}`}>
                            {t.addToCart}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6" data-testid="product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedProduct(product)} data-testid={`product-${product.id}`}>
                <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3 sm:p-4 text-center">
                  <h3 className="font-medium text-[#0F172A] text-sm sm:text-base line-clamp-2 mb-2">{product.name}</h3>
                  <p className="text-base sm:text-lg font-bold text-[#0055FF] mb-2">{formatVND(product.price)}</p>
                  <Button className="w-full bg-[#0055FF] hover:bg-[#0040CC] text-white text-xs sm:text-sm h-9 sm:h-10 rounded-lg"
                    onClick={(e) => { e.stopPropagation(); addToCart(product); }} data-testid={`add-cart-${product.id}`}>
                    {t.addToCart}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">{shop.name}</h3>
              {shop.description && <p className="text-[#94A3B8] mb-4">{shop.description}</p>}
              <div className="flex gap-4">
                {shop.social_facebook && (
                  <a href={shop.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#0055FF]"><Facebook className="w-6 h-6" /></a>
                )}
                {shop.social_instagram && (
                  <a href={shop.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#0055FF]"><Instagram className="w-6 h-6" /></a>
                )}
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
        </div>
      </footer>

      {/* Product Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white" data-testid="product-modal">
          <DialogDescription className="sr-only">{t.productDetail}</DialogDescription>
          {selectedProduct && (
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-[#F8FAFC]">
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex flex-col">
                <h2 className="text-xl font-bold text-[#0F172A] mb-2">{selectedProduct.name}</h2>
                <p className="text-2xl font-bold text-[#0055FF] mb-4">{formatVND(selectedProduct.price)}</p>
                {selectedProduct.description && <p className="text-[#64748B] mb-6 flex-1">{selectedProduct.description}</p>}
                <Button className="w-full bg-[#0055FF] hover:bg-[#0040CC] py-6"
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} data-testid="modal-add-cart">
                  <ShoppingCart className="w-5 h-5 mr-2" /> {t.addToCart}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md flex flex-col bg-white" data-testid="cart-drawer">
          <SheetHeader>
            <SheetTitle>{t.cart} ({cartCount})</SheetTitle>
            <SheetDescription>{t.cartItems}</SheetDescription>
          </SheetHeader>
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#64748B]">{t.cartEmpty}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex gap-4 p-3 bg-[#F8FAFC] rounded-xl">
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#0F172A] text-sm truncate">{item.name}</h4>
                        <p className="text-[#0055FF] font-semibold text-sm">{formatVND(item.price)}</p>
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
                  <span className="font-bold text-[#0055FF]">{formatVND(cartTotal)}</span>
                </div>
                <Button className="w-full bg-[#0055FF] hover:bg-[#0040CC] py-6"
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
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setShowCheckout(false); setShowCart(true); }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-[#0F172A]">{t.checkoutTitle}</h1>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
              {/* Shipping Form */}
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

              {/* Order Summary */}
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
                      <span className="text-[#0055FF]">{formatVND(cartTotal)}</span>
                    </div>
                  </div>
                  <Button form="checkout-form" type="submit" className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-xl py-6 mt-6 text-base" data-testid="place-order-btn">
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
