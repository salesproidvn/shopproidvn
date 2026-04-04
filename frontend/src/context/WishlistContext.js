import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/wishlist`, { withCredentials: true });
      setWishlist(data);
      setWishlistIds(new Set(data.map(p => p.id)));
    } catch (e) {
      console.error('Error fetching wishlist:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
      setWishlistIds(new Set());
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    try {
      const { data } = await axios.post(`${API}/wishlist/toggle/${productId}`, {}, { withCredentials: true });
      await fetchWishlist();
      return data;
    } catch (e) {
      throw e;
    }
  };

  const isInWishlist = (productId) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist, isInWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
