import { useState } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ProductModal from './ProductModal';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    try {
      await addToCart(product.id);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error('Không thể thêm vào giỏ hàng');
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào wishlist');
      return;
    }
    try {
      const result = await toggleWishlist(product.id);
      toast.success(result.in_wishlist ? 'Đã thêm vào wishlist' : 'Đã xóa khỏi wishlist');
    } catch (err) {
      toast.error('Không thể cập nhật wishlist');
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

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className={`w-10 h-10 rounded-full shadow-lg ${
                  inWishlist ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white hover:bg-[#F8FAFC]'
                }`}
                onClick={handleToggleWishlist}
                data-testid={`wishlist-btn-${product.id}`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="w-10 h-10 rounded-full bg-white shadow-lg hover:bg-[#F8FAFC]"
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                data-testid={`quick-view-btn-${product.id}`}
              >
                <Eye className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="badge-category">{product.category}</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h3 className="font-semibold text-[#0F172A] text-lg mb-2 line-clamp-2 group-hover:text-[#0055FF] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-[#0055FF] price-vnd">
              {formatVND(product.price)}
            </span>
            <Button
              size="icon"
              className="w-12 h-12 rounded-full bg-[#0055FF] hover:bg-[#0040CC] shadow-lg"
              onClick={handleAddToCart}
              data-testid={`add-to-cart-btn-${product.id}`}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
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
