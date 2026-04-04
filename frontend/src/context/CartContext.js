import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setCart([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/cart`, { withCredentials: true });
      setCart(data);
    } catch (e) {
      console.error('Error fetching cart:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/cart/add`, { product_id: productId, quantity }, { withCredentials: true });
      await fetchCart();
    } catch (e) {
      throw e;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await axios.post(`${API}/cart/update`, { product_id: productId, quantity }, { withCredentials: true });
      await fetchCart();
    } catch (e) {
      throw e;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API}/cart/${productId}`, { withCredentials: true });
      await fetchCart();
    } catch (e) {
      throw e;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart`, { withCredentials: true });
      setCart([]);
    } catch (e) {
      throw e;
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount, fetchCart }}>
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
