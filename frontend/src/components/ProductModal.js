import { useState } from 'react';
import { Heart, ShoppingCart, Minus, Plus, Play } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Dialog, DialogContent, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const getEmbedUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
};

const ProductModal = ({ product, open, onOpenChange }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const images = product.images?.length > 0 ? product.images : [product.image_url];
  const embedUrl = getEmbedUrl(product.video_url);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, product, quantity);
      toast.success(t.addedToCart);
      onOpenChange(false);
    } catch (err) {
      toast.error(t.failedToAdd);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const result = await toggleWishlist(product.id, product);
      toast.success(result.in_wishlist ? t.addedToWishlist : t.removedFromWishlist);
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setActiveImage(0); setShowVideo(false); } }}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white max-h-[90vh] overflow-y-auto" data-testid="product-modal">
        <DialogDescription className="sr-only">{t.productDetail} {product.name}</DialogDescription>
        <div className="grid md:grid-cols-2">
          {/* Image Gallery */}
          <div className="flex flex-col">
            <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden" data-testid="product-main-image">
              {showVideo && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Product video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              )}
            </div>
            {/* Thumbnails */}
            {(images.length > 1 || embedUrl) && (
              <div className="flex gap-2 p-3 overflow-x-auto" data-testid="product-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImage(idx); setShowVideo(false); }}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      !showVideo && activeImage === idx ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-transparent hover:border-[#E2E8F0]'
                    }`}
                    data-testid={`thumbnail-${idx}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {embedUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={`w-16 h-16 rounded-lg flex-shrink-0 border-2 transition-all flex items-center justify-center bg-[#0F172A] ${
                      showVideo ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-transparent hover:border-[#E2E8F0]'
                    }`}
                    data-testid="thumbnail-video"
                  >
                    <Play className="w-6 h-6 text-white fill-white" />
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Product Info */}
          <div className="p-8 flex flex-col">
            <span className="badge-category w-fit mb-4">{product.category}</span>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">{product.name}</h2>
            <p className="text-[#64748B] mb-6 flex-1">{product.description}</p>
            <div className="text-3xl font-bold text-[#0055FF] mb-6 price-vnd">{formatVND(product.price)}</div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[#64748B]">{t.quantity}:</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="modal-decrease-qty">
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full"
                  onClick={() => setQuantity(quantity + 1)} data-testid="modal-increase-qty">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="flex-1 bg-[#0055FF] hover:bg-[#0040CC] rounded-full py-6 text-lg"
                onClick={handleAddToCart} data-testid="modal-add-to-cart">
                <ShoppingCart className="w-5 h-5 mr-2" /> {t.addToCart}
              </Button>
              <Button variant="outline" size="icon"
                className={`w-14 h-14 rounded-full ${inWishlist ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' : ''}`}
                onClick={handleToggleWishlist} data-testid="modal-wishlist-btn">
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
