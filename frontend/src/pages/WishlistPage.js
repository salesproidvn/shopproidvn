import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId, null);
      toast.success(t.removedFromWishlist);
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, product);
      toast.success(t.addedToCart);
    } catch (err) {
      toast.error(t.failedToAdd);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="wishlist-page">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}} />
      
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-button">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{t.wishlist}</h1>
              <p className="text-[#64748B]">{wishlist.length} {t.items}</p>
            </div>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-24">
              <Heart className="w-16 h-16 text-[#E2E8F0] mx-auto mb-4" />
              <p className="text-[#64748B] text-lg mb-4">{t.wishlistEmpty}</p>
              <Link to="/">
                <Button className="bg-[#0055FF] hover:bg-[#0040CC] rounded-full">
                  {t.browseProducts}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="wishlist-grid">
              {wishlist.map((product) => (
                <div key={product.id} className="product-card group" data-testid={`wishlist-item-${product.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-[#F8FAFC]">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    <Button variant="destructive" size="icon"
                      className="absolute top-4 right-4 w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(product.id)} data-testid={`remove-wishlist-${product.id}`}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    {product.category && <span className="badge-category absolute top-4 left-4">{product.category}</span>}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-[#0F172A] text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[#0055FF] price-vnd">{formatVND(product.price)}</span>
                      <Button size="icon" className="w-12 h-12 rounded-full bg-[#0055FF] hover:bg-[#0040CC]"
                        onClick={() => handleAddToCart(product)} data-testid={`add-cart-wishlist-${product.id}`}>
                        <ShoppingCart className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;
