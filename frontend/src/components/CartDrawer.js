import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

const CartDrawer = ({ open, onOpenChange }) => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" data-testid="cart-drawer">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Giỏ hàng</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="w-16 h-16 text-[#E2E8F0] mb-4" />
            <p className="text-[#64748B]">Vui lòng đăng nhập để xem giỏ hàng</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col" data-testid="cart-drawer">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Giỏ hàng ({cart.length})</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <ShoppingBag className="w-16 h-16 text-[#E2E8F0] mb-4" />
            <p className="text-[#64748B]">Giỏ hàng trống</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-4 p-4 bg-[#F8FAFC] rounded-xl"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#0F172A] truncate">{item.name}</h4>
                      <p className="text-[#0055FF] font-semibold mt-1">{formatVND(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 rounded-full"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          data-testid={`decrease-qty-${item.product_id}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 rounded-full"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          data-testid={`increase-qty-${item.product_id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeFromCart(item.product_id)}
                          data-testid={`remove-item-${item.product_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 mt-auto space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Tổng cộng:</span>
                <span className="text-2xl font-bold text-[#0055FF]" data-testid="cart-total">
                  {formatVND(cartTotal)}
                </span>
              </div>
              <Button
                className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-full py-6 text-lg"
                data-testid="checkout-button"
              >
                Thanh toán
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={clearCart}
                data-testid="clear-cart-button"
              >
                Xóa giỏ hàng
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
