import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut, Globe, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { lang, t, switchLanguage } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#0055FF] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">W</span>
              </div>
              <span className="text-base sm:text-xl font-bold text-[#0F172A] hidden sm:block">The Wi Shop</span>
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
            <div className="flex md:hidden items-center gap-1">
              {/* Language - Mobile */}
              <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => switchLanguage(lang === 'vi' ? 'en' : 'vi')}>
                <Globe className="w-5 h-5 text-[#64748B]" />
              </Button>

              <Button
                variant="ghost"
                className="relative p-2"
                onClick={() => setShowCartDrawer(true)}
                data-testid="mobile-cart-button"
              >
                <ShoppingCart className="w-5 h-5 text-[#64748B]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0055FF] text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="p-2" data-testid="mobile-menu-button">
                    <Menu className="w-5 h-5 text-[#64748B]" />
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
      <CartDrawer open={showCartDrawer} onOpenChange={setShowCartDrawer} />
    </>
  );
};

export default Header;
