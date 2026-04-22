import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut, Globe, LayoutDashboard, Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { emitNotification } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';
import { formatVND } from '../utils/format';
import { resolveImage } from '../utils/imageUrl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../components/ui/sheet';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

const Header = ({ searchQuery, setSearchQuery, onSearch }) => {
  const { user, logout } = useAuth();
  const { cart, cartCount, cartTotal, clearCart } = useCart();
  const { wishlist } = useWishlist();
  const { lang, t, switchLanguage } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '', customer_address: '', note: ''
  });
  const navigate = useNavigate();

  const handleCheckout = async (e) => {
    e.preventDefault();
    const items = cart.map(item => ({
      product_id: item.product_id, name: item.name, price: item.price,
      quantity: item.quantity, subtotal: item.price * item.quantity
    }));
    const order = {
      id: `ORD-${Date.now().toString(16).toUpperCase()}`,
      ...checkoutForm,
      items,
      total_amount: cartTotal,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    emitNotification({
      type: 'new_order',
      title: t.newOrder,
      message: `${checkoutForm.customer_name} - ${formatVND(cartTotal)}`,
      order_id: order.id,
    });

    clearCart();
    setShowCheckout(false);
    setCheckoutForm({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '', note: '' });
    navigate('/thank-you', { state: { order } });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="header-sticky" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5" data-testid="logo-link">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-[#0055FF] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-lg">W</span>
              </div>
              <span className="text-base sm:text-xl font-bold text-[#0F172A]">The Wi Shop</span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-5 h-5" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full bg-[#F8FAFC] border-[#E2E8F0] focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
                  data-testid="search-input"
                />
              </div>
            </form>

            {/* Navigation - Desktop */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-2 hover:bg-[#F8FAFC] rounded-full" data-testid="lang-switch">
                    <Globe className="w-5 h-5 text-[#64748B]" />
                    <span className="ml-1 text-xs font-medium">{lang.toUpperCase()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={() => switchLanguage('vi')} className={lang === 'vi' ? 'bg-[#F8FAFC]' : ''}>
                    🇻🇳 Tiếng Việt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchLanguage('en')} className={lang === 'en' ? 'bg-[#F8FAFC]' : ''}>
                    🇺🇸 English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/wishlist" data-testid="wishlist-link">
                <Button variant="ghost" className="relative p-2 hover:bg-[#F8FAFC] rounded-full">
                  <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-[#64748B]" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-[#0055FF] text-white text-[10px] lg:text-xs rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Button>
              </Link>

              <Button
                variant="ghost"
                className="relative p-2 hover:bg-[#F8FAFC] rounded-full"
                onClick={() => setShowCartDrawer(true)}
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 text-[#64748B]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-[#0055FF] text-white text-[10px] lg:text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {user ? (
                <div className="flex items-center gap-2">
                  {(user.role === 'shop_owner' || user.role === 'super_admin') && (
                    <>
                      <NotificationBell className="text-[#64748B]" />
                      <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} data-testid="header-dashboard-btn">
                        <Button variant="outline" className="rounded-full px-4 text-sm border-[#0055FF] text-[#0055FF] hover:bg-[#0055FF] hover:text-white">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          {t.dashboard}
                        </Button>
                      </Link>
                    </>
                  )}
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-2 hover:bg-[#F8FAFC] rounded-full" data-testid="user-menu-button">
                      <User className="w-5 h-5 lg:w-6 lg:h-6 text-[#64748B]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-[#0F172A]">{user.name}</p>
                      <p className="text-xs text-[#64748B]">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {(user.role === 'shop_owner' || user.role === 'super_admin') && (
                      <DropdownMenuItem asChild>
                        <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} className="cursor-pointer" data-testid="dropdown-dashboard-link">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          {t.dashboard}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="cursor-pointer" data-testid="dropdown-wishlist-link">
                        <Heart className="w-4 h-4 mr-2" />
                        {t.wishlist}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600" data-testid="logout-button">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-[#0055FF] text-white hover:bg-[#0040CC] rounded-full px-4 lg:px-6 text-sm"
                  data-testid="login-button"
                >
                  {t.login}
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-2">
              {/* Language - Mobile */}
              <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => switchLanguage(lang === 'vi' ? 'en' : 'vi')}>
                <Globe className="w-6 h-6 text-[#64748B]" />
              </Button>

              <Button
                variant="ghost"
                className="relative p-2 w-10 h-10"
                onClick={() => setShowCartDrawer(true)}
                data-testid="mobile-cart-button"
              >
                <ShoppingCart className="w-6 h-6 text-[#64748B]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#0055FF] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="p-2 w-10 h-10" data-testid="mobile-menu-button">
                    <Menu className="w-6 h-6 text-[#64748B]" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-white">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navigation menu</SheetDescription>
                  <div className="flex flex-col gap-4 mt-6">
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4" />
                        <Input
                          type="text"
                          placeholder={t.searchShort}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 text-sm"
                          data-testid="mobile-search-input"
                        />
                      </div>
                    </form>

                    <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-[#0F172A] text-sm py-2" data-testid="mobile-wishlist-link">
                      <Heart className="w-5 h-5" />
                      {t.wishlist} ({wishlist.length})
                    </Link>

                    {user ? (
                      <>
                        <div className="border-t pt-4">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-[#64748B]">{user.email}</p>
                        </div>
                        {(user.role === 'shop_owner' || user.role === 'super_admin') && (
                          <Link to={user.role === 'super_admin' ? '/admin' : '/dashboard'} onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 text-[#0F172A] text-sm py-2" data-testid="mobile-dashboard-link">
                            <LayoutDashboard className="w-5 h-5" />
                            {t.dashboard}
                          </Link>
                        )}
                        <Button
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                          variant="destructive"
                          className="w-full text-sm"
                          data-testid="mobile-logout-button"
                        >
                          {t.logout}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                        className="w-full bg-[#0055FF] hover:bg-[#0040CC] text-sm"
                        data-testid="mobile-login-button"
                      >
                        {t.login}
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <CartDrawer open={showCartDrawer} onOpenChange={setShowCartDrawer} onCheckout={() => setShowCheckout(true)} />

      {/* Checkout Full-Screen Overlay */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] bg-[#F8FAFC] overflow-y-auto" data-testid="homepage-checkout-overlay">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setShowCheckout(false); setShowCartDrawer(true); }} data-testid="checkout-back-btn">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-[#0F172A]">{t.checkoutTitle}</h1>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg text-[#0F172A] mb-4">{t.shippingInfo}</h2>
                  <form id="homepage-checkout-form" onSubmit={handleCheckout} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t.customerName} *</label>
                      <Input value={checkoutForm.customer_name} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })} required data-testid="hp-checkout-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.phone} *</label>
                        <Input value={checkoutForm.customer_phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_phone: e.target.value })} required data-testid="hp-checkout-phone" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">{t.email}</label>
                        <Input type="email" value={checkoutForm.customer_email} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_email: e.target.value })} data-testid="hp-checkout-email" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t.address} *</label>
                      <Input value={checkoutForm.customer_address} onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_address: e.target.value })} required data-testid="hp-checkout-address" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t.note}</label>
                      <Input value={checkoutForm.note} onChange={(e) => setCheckoutForm({ ...checkoutForm, note: e.target.value })} data-testid="hp-checkout-note" />
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
                        <img src={resolveImage(item.image_url)} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
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
                  <Button form="homepage-checkout-form" type="submit" className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-xl py-6 mt-6 text-base" data-testid="hp-place-order-btn">
                    {t.placeOrder}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
