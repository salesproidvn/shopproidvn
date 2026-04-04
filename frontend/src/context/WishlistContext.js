import { createContext, useContext, useState } from 'react';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  // Local wishlist state for homepage demo (not persisted to backend)
  const [wishlist, setWishlist] = useState([]);

  const toggleWishlist = async (productId, product) => {
    const exists = wishlist.find(p => p.id === productId);
    if (exists) {
      setWishlist(wishlist.filter(p => p.id !== productId));
      return { in_wishlist: false };
    } else if (product) {
      setWishlist([...wishlist, product]);
      return { in_wishlist: true };
    }
    return { in_wishlist: false };
  };

  const isInWishlist = (productId) => wishlist.some(p => p.id === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, loading: false, toggleWishlist, isInWishlist }}>
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
