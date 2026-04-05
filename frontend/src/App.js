import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LanguageProvider } from "./context/LanguageContext";
import HomePage from "./pages/HomePage";
import WishlistPage from "./pages/WishlistPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import StorefrontPage from "./pages/StorefrontPage";
import ContactPage from "./pages/ContactPage";
import ThankYouPage from "./pages/ThankYouPage";

import FloatingActions from "./components/FloatingActions";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/admin" element={<SuperAdminDashboard />} />
                <Route path="/dashboard" element={<ShopOwnerDashboard />} />
                <Route path="/shop/:slug" element={<StorefrontPage />} />
                <Route path="/shop/:slug/contact" element={<ContactPage />} />
                <Route path="/shop/:slug/thank-you" element={<ThankYouPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
              <FloatingActions />
            </BrowserRouter>
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              toastOptions={{
                style: {
                  fontFamily: 'Manrope, sans-serif',
                },
              }}
            />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
