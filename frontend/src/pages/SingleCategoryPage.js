import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { ArrowLeft, ShoppingCart, FolderOpen, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SingleCategoryPage = () => {
  const { slug, categoryId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { addToCart, cart, cartCount, cartTotal, updateCartQuantity, removeFromCart } = useCart();
  const [shop, setShop] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [activeSubFilter, setActiveSubFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => { fetchData(); }, [slug, categoryId]);

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
    : products.filter(p => p.category_id === activeSubFilter);

  const handleAddToCart = (product) => {
    addToCart(product.id, product, 1);
    toast.success(`${product.name} ${t.addedToCart || 'added'}`);
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
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all group" data-testid={`cat-product-${product.id}`}>
                <Link to={`/shop/${slug}?product=${product.id}`}>
                  <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                </Link>
                <div className="p-3 text-center">
                  <Link to={`/shop/${slug}?product=${product.id}`}>
                    <h3 className="font-medium text-[#0F172A] text-sm line-clamp-2 mb-1 hover:underline">{product.name}</h3>
                  </Link>
                  <p className="text-base font-bold mb-2" style={{ color: themeColor }}>{formatVND(product.price)}</p>
                  <Button
                    size="sm"
                    className="w-full text-xs hover:opacity-90 gap-1.5"
                    style={{ backgroundColor: themeColor }}
                    onClick={() => handleAddToCart(product)}
                    data-testid={`add-cart-${product.id}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> {t.addToCart}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
                  onClick={() => { setShowCart(false); navigate(`/shop/${slug}?checkout=1`); }} data-testid="cat-checkout-btn">
                  {t.orderNow}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SingleCategoryPage;
