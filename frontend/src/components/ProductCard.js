import { useState } from 'react';
import { Heart, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ProductModal from './ProductModal';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      await addToCart(product.id, product);
      toast.success(t.addedToCart);
    } catch (err) {
      toast.error(t.failedToAdd);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    try {
      const result = await toggleWishlist(product.id, product);
      toast.success(result.in_wishlist ? t.addedToWishlist : t.removedFromWishlist);
    } catch (err) {
      toast.error('Error');
    }
  };

  return (
    <>
      <div
        className="product-card group cursor-pointer"
        onClick={() => setShowModal(true)}
        data-testid={`product-card-${product.id}`}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-[#F8FAFC]">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#F8FAFC] to-[#E2E8F0]" />
          )}
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full object-cover image-zoom ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Overlay Actions - Desktop only */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors hidden sm:block">
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className={`w-9 h-9 rounded-full shadow-lg ${
                  inWishlist ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white hover:bg-[#F8FAFC]'
                }`}
                onClick={handleToggleWishlist}
                data-testid={`wishlist-btn-${product.id}`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="w-9 h-9 rounded-full bg-white shadow-lg hover:bg-[#F8FAFC]"
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                data-testid={`quick-view-btn-${product.id}`}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-3 left-3">
              <span className="badge-category text-[10px] px-2 py-0.5">{product.category}</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-medium text-[#0F172A] text-sm sm:text-base mb-1 line-clamp-2 group-hover:text-[#0055FF] transition-colors">
            {product.name}
          </h3>
          <p className="text-base sm:text-lg font-bold text-[#0055FF] price-vnd mb-2 sm:mb-3">
            {formatVND(product.price)}
          </p>
          
          {/* Add to Cart Button - Text button below price */}
          <Button
            className="w-full bg-[#0055FF] hover:bg-[#0040CC] text-white text-xs sm:text-sm h-9 sm:h-10 rounded-lg"
            onClick={handleAddToCart}
            data-testid={`add-to-cart-btn-${product.id}`}
          >
            {t.addToCart}
          </Button>
        </div>
      </div>

      <ProductModal
        product={product}
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
};

export default ProductCard;
