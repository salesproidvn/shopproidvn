import { useState } from 'react';
import { Heart, ShoppingCart, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatVND } from '../utils/format';
import { Dialog, DialogContent, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const ProductModal = ({ product, open, onOpenChange }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, product, quantity);
      toast.success('Đã thêm vào giỏ hàng');
      onOpenChange(false);
    } catch (err) {
      toast.error('Không thể thêm vào giỏ hàng');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const result = await toggleWishlist(product.id, product);
      toast.success(result.in_wishlist ? 'Đã thêm vào wishlist' : 'Đã xóa khỏi wishlist');
    } catch (err) {
      toast.error('Không thể cập nhật wishlist');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white" data-testid="product-modal">
        <DialogDescription className="sr-only">Chi tiết sản phẩm {product.name}</DialogDescription>
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-[#F8FAFC]">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-8 flex flex-col">
            <span className="badge-category w-fit mb-4">{product.category}</span>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">{product.name}</h2>
            <p className="text-[#64748B] mb-6 flex-1">{product.description}</p>
            
            <div className="text-3xl font-bold text-[#0055FF] mb-6 price-vnd">
              {formatVND(product.price)}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[#64748B]">Số lượng:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid="modal-decrease-qty"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="modal-increase-qty"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                className="flex-1 bg-[#0055FF] hover:bg-[#0040CC] rounded-full py-6 text-lg"
                onClick={handleAddToCart}
                data-testid="modal-add-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Thêm vào giỏ
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`w-14 h-14 rounded-full ${
                  inWishlist ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' : ''
                }`}
                onClick={handleToggleWishlist}
                data-testid="modal-wishlist-btn"
              >
                <Heart className={`w-6 h-6 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
