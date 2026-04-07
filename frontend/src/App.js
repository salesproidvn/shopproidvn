import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LanguageProvider } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import WishlistPage from "./pages/WishlistPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import StorefrontPage from "./pages/StorefrontPage";
import ContactPage from "./pages/ContactPage";
import ThankYouPage from "./pages/ThankYouPage";
import BlogPostPage from "./pages/BlogPostPage";
import CategoryPage from "./pages/CategoryPage";
import SingleCategoryPage from "./pages/SingleCategoryPage";
import CustomPage from "./pages/CustomPage";

function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/admin" element={<SuperAdminDashboard />} />
                <Route path="/dashboard" element={<ShopOwnerDashboard />} />
                <Route path="/shop/:slug" element={<StorefrontPage />} />
                <Route path="/shop/:slug/categories" element={<CategoryPage />} />
                <Route path="/shop/:slug/category/:categoryId" element={<SingleCategoryPage />} />
                <Route path="/shop/:slug/page/:pageSlug" element={<CustomPage />} />
                <Route path="/shop/:slug/contact" element={<ContactPage />} />
                <Route path="/shop/:slug/posts" element={<BlogPostPage />} />
                <Route path="/shop/:slug/posts/:postId" element={<BlogPostPage />} />
                <Route path="/shop/:slug/thank-you" element={<ThankYouPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster 
              position="bottom-center" 
              richColors 
              closeButton 
              toastOptions={{
                style: {
                  fontFamily: 'Manrope, sans-serif',
                  marginBottom: '70px',
                },
              }}
            />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;
