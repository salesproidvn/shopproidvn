import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Local cart state for homepage demo (not persisted to backend)
  const [cart, setCart] = useState([]);

  const addToCart = async (productId, product, quantity = 1) => {
    const existing = cart.find(item => item.product_id === productId);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else if (product) {
      setCart([...cart, { 
        product_id: productId, 
        name: product.name, 
        price: product.price, 
        image_url: product.image_url,
        quantity 
      }]);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product_id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = async (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const clearCart = async () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading: false, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
