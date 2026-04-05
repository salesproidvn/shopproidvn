import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Settings, 
  LogOut, Menu, X, Plus, Pencil, Trash2, TrendingUp, Clock, Eye, Palette, Upload, ExternalLink,
  Bold, Italic, List, ChevronUp, ChevronDown, Play, FileText, Image, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShopOwnerDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [themeColor, setThemeColor] = useState('#0055FF');

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailActiveImage, setDetailActiveImage] = useState(0);
  const [detailShowVideo, setDetailShowVideo] = useState(false);
  const [posts, setPosts] = useState([]);

  const [productForm, setProductForm] = useState({ name: '', price: '', category_id: '', description: '', image_url: '', images: [], stock: '', position: '', video_url: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [shopForm, setShopForm] = useState({});
  const [postForm, setPostForm] = useState({ title: '', description: '', thumbnail: '', images: [], attached_products: [] });
  const postFileInputRef = useRef(null);
  const postImagesInputRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'shop_owner' && user.role !== 'super_admin')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, shopRes, productsRes, categoriesRes, ordersRes, postsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/shop`),
        axios.get(`${API}/dashboard/products`),
        axios.get(`${API}/dashboard/categories`),
        axios.get(`${API}/dashboard/orders`),
        axios.get(`${API}/dashboard/posts`)
      ]);
      setStats(statsRes.data);
      setShop(shopRes.data);
      setShopForm(shopRes.data);
      if (shopRes.data.theme_color) setThemeColor(shopRes.data.theme_color);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      setPosts(postsRes.data || []);
    } catch (err) {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const { data } = await axios.post(`${API}/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = data.url || `${API}/files/${data.id}`;
      const newImages = [...(productForm.images || []), url];
      setProductForm({ ...productForm, images: newImages, image_url: newImages[0] });
      toast.success(t.uploadSuccess);
    } catch (err) {
      toast.error(err.response?.data?.detail || t.uploadFailed);
    } finally {
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeProductImage = (idx) => {
    const newImages = productForm.images.filter((_, i) => i !== idx);
    setProductForm({ ...productForm, images: newImages, image_url: newImages[0] || '' });
  };

  const setAsThumbnail = (idx) => {
    if (idx === 0) return;
    const newImages = [...productForm.images];
    const [moved] = newImages.splice(idx, 1);
    newImages.unshift(moved);
    setProductForm({ ...productForm, images: newImages, image_url: newImages[0] });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        ...productForm, 
        price: parseInt(productForm.price), 
        stock: parseInt(productForm.stock) || 0,
        position: parseInt(productForm.position) || 0,
        category_id: productForm.category_id === "none" ? null : productForm.category_id || null,
        images: productForm.images || [],
        video_url: productForm.video_url || '',
        image_url: productForm.images?.length > 0 ? productForm.images[0] : productForm.image_url
      };
      if (editingProduct) {
        await axios.put(`${API}/dashboard/products/${editingProduct.id}`, data);
        toast.success(t.productUpdated);
      } else {
        await axios.post(`${API}/dashboard/products`, data);
        toast.success(t.productCreated);
      }
      setShowProductModal(false);
      resetProductForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToSave);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm(t.deleteConfirmProduct)) return;
    try {
      await axios.delete(`${API}/dashboard/products/${prodId}`);
      toast.success(t.productDeleted);
      fetchData();
    } catch (err) {
      toast.error(t.failedToDelete);
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || 'none',
      description: product.description || '',
      image_url: product.image_url,
      images: product.images || (product.image_url ? [product.image_url] : []),
      stock: (product.stock || 0).toString(),
      position: (product.position || 0).toString(),
      video_url: product.video_url || ''
    });
    setShowProductModal(true);
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailActiveImage(0);
    setDetailShowVideo(false);
    setShowProductDetailModal(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', category_id: '', description: '', image_url: '', images: [], stock: '', position: '', video_url: '' });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/dashboard/categories/${editingCategory.id}`, categoryForm);
        toast.success(t.categoryUpdated);
      } else {
        await axios.post(`${API}/dashboard/categories`, categoryForm);
        toast.success(t.categoryCreated);
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchData();
    } catch (err) {
      toast.error(t.failedToSave);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm(t.deleteConfirmCategory)) return;
    try {
      await axios.delete(`${API}/dashboard/categories/${catId}`);
      toast.success(t.categoryDeleted);
      fetchData();
    } catch (err) {
      toast.error(t.failedToDelete);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/dashboard/shop`, shopForm);
      toast.success(t.shopUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToSave);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/dashboard/orders/${orderId}/status`, { status });
      toast.success(t.orderStatusUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleMoveCategoryPosition = async (catId, direction) => {
    const sorted = [...categories].sort((a, b) => (a.position || 0) - (b.position || 0));
    const idx = sorted.findIndex(c => c.id === catId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempPos = sorted[idx].position;
    sorted[idx].position = sorted[swapIdx].position;
    sorted[swapIdx].position = tempPos;
    try {
      await axios.put(`${API}/dashboard/categories/positions`, {
        positions: sorted.map(c => ({ id: c.id, position: c.position }))
      });
      toast.success(t.positionSaved);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  // Post methods
  const countWords = (html) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (countWords(postForm.description) > 2000) { toast.error(t.maxWordsReached); return; }
    try {
      const data = { ...postForm, images: postForm.images || [], attached_products: postForm.attached_products || [] };
      if (editingPost) {
        await axios.put(`${API}/dashboard/posts/${editingPost.id}`, data);
        toast.success(t.postUpdated);
      } else {
        await axios.post(`${API}/dashboard/posts`, data);
        toast.success(t.postCreated);
      }
      setShowPostModal(false);
      resetPostForm();
      fetchData();
    } catch (err) { toast.error(t.failedToSave); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm(t.deleteConfirmPost)) return;
    try {
      await axios.delete(`${API}/dashboard/posts/${postId}`);
      toast.success(t.postDeleted);
      fetchData();
    } catch { toast.error(t.failedToDelete); }
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setPostForm({ title: post.title, description: post.description, thumbnail: post.thumbnail || '', images: post.images || [], attached_products: post.attached_products || [] });
    setShowPostModal(true);
  };

  const resetPostForm = () => {
    setEditingPost(null);
    setPostForm({ title: '', description: '', thumbnail: '', images: [], attached_products: [] });
  };

  const handlePostThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data.url || `${API}/files/${data.id}`;
      setPostForm(prev => ({ ...prev, thumbnail: url }));
      toast.success(t.uploadSuccess);
    } catch { toast.error(t.uploadFailed); }
    if (postFileInputRef.current) postFileInputRef.current.value = '';
  };

  const handlePostImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if ((postForm.images || []).length >= 3) { toast.error('Max 3 images'); return; }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data.url || `${API}/files/${data.id}`;
      setPostForm(prev => ({ ...prev, images: [...(prev.images || []), url] }));
      toast.success(t.uploadSuccess);
    } catch { toast.error(t.uploadFailed); }
    if (postImagesInputRef.current) postImagesInputRef.current.value = '';
  };

  const toggleProductAttach = (prodId) => {
    setPostForm(prev => {
      const current = prev.attached_products || [];
      return { ...prev, attached_products: current.includes(prodId) ? current.filter(id => id !== prodId) : [...current, prodId] };
    });
  };

  const quillModules = { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] };

  const menuItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'products', label: t.products, icon: Package },
    { id: 'categories', label: t.categories, icon: FolderOpen },
    { id: 'posts', label: t.posts, icon: FileText },
    { id: 'orders', label: t.orders, icon: ShoppingCart },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    pending: t.pending, confirmed: t.confirmed, processing: t.processing,
    shipped: t.shipped, completed: t.completed, cancelled: t.cancelled
  };

  const themeColors = [
    { name: 'Blue', value: '#0055FF' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
  ];

  const insertFormatting = (format) => {};

  const quillModulesProduct = { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] };

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const filteredProductsForAttach = products.filter(p =>
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="shop-owner-dashboard" style={{ '--theme-color': themeColor }}>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} data-testid="sidebar-backdrop" />
      )}

      {/* Sidebar - Desktop: toggle width, Mobile: overlay slide-in */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white z-50 transition-all duration-300 w-64 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className={`min-w-0 ${sidebarOpen ? '' : 'lg:hidden'}`}>
            <span className="font-bold text-base truncate block">{shop?.name || t.dashboard}</span>
            <p className="text-xs text-[#94A3B8] truncate">/{shop?.slug}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-white/10 flex-shrink-0 hidden lg:inline-flex">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="text-white hover:bg-white/10 flex-shrink-0 lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors"
              style={{ backgroundColor: activeTab === item.id ? themeColor : 'transparent' }}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={sidebarOpen ? '' : 'lg:hidden'}>{item.label}</span>
            </button>
          ))}
        </nav>

        {shop && (
          <div className={`px-4 mt-4 ${sidebarOpen ? '' : 'lg:hidden'}`}>
            <a href={`${window.location.origin}/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
              <ExternalLink className="w-4 h-4" />
              {t.previewShop}
            </a>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={() => { handleLogout(); setMobileSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-red-400 text-sm" data-testid="logout-btn">
            <LogOut className="w-5 h-5" />
            <span className={sidebarOpen ? '' : 'lg:hidden'}>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all p-4 lg:p-6 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} data-testid="mobile-sidebar-toggle">
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A]">
                  {activeTab === 'overview' && t.dashboard}
                  {activeTab === 'products' && t.products}
                  {activeTab === 'categories' && t.categories}
                  {activeTab === 'posts' && t.posts}
                  {activeTab === 'orders' && t.orders}
                  {activeTab === 'settings' && t.settings}
                </h1>
                <p className="text-sm text-[#64748B] mt-1">{t.welcomeBack}, {user?.name}</p>
              </div>
              <NotificationBell className="text-[#64748B] ml-2" />
            </div>
            {activeTab === 'products' && (
              <Button onClick={() => { resetProductForm(); setShowProductModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.addProduct}
              </Button>
            )}
            {activeTab === 'categories' && (
              <Button onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.addCategory}
              </Button>
            )}
            {activeTab === 'posts' && (
              <Button onClick={() => { resetPostForm(); setShowPostModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-post-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.addPost}
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.totalProducts}</CardTitle>
                    <Package className="w-4 h-4" style={{ color: themeColor }} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.total_products}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.totalOrders}</CardTitle>
                    <ShoppingCart className="w-4 h-4" style={{ color: themeColor }} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.total_orders}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.pendingOrders}</CardTitle>
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.pending_orders}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.totalRevenue}</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-lg lg:text-2xl font-bold text-[#0F172A]">{formatVND(stats.total_revenue)}</div>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{t.recentOrders}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {orders.length === 0 ? (
                    <p className="text-[#64748B] text-center py-8 text-sm">{t.noOrdersYet}</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg cursor-pointer hover:bg-[#EFF6FF]" onClick={() => openOrderDetail(order)}>
                          <div>
                            <p className="font-medium text-[#0F172A] text-sm">{order.id}</p>
                            <p className="text-xs text-[#64748B]">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(order.total_amount)}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">{t.noProductsYet}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4" data-testid="products-grid">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-[#F8FAFC] cursor-pointer" onClick={() => openProductDetail(product)}>
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 lg:p-3">
                          <h3 className="font-medium text-[#0F172A] text-xs lg:text-sm truncate cursor-pointer hover:text-[#0055FF]" onClick={() => openProductDetail(product)}>{product.name}</h3>
                          <p className="font-bold mt-1 text-xs lg:text-sm" style={{ color: themeColor }}>{formatVND(product.price)}</p>
                          <p className="text-[10px] lg:text-xs text-[#64748B]">{t.stock}: {product.stock || 0}</p>
                          <div className="flex gap-1 lg:gap-2 mt-2">
                            <Button variant="outline" size="sm" className="flex-1 text-[10px] lg:text-xs h-7 lg:h-8 px-1 lg:px-2" onClick={() => openEditProduct(product)} data-testid={`edit-product-${product.id}`}>
                              <Pencil className="w-3 h-3 mr-1" /> {t.edit}
                            </Button>
                            <Button variant="destructive" size="sm" className="h-7 lg:h-8 px-1 lg:px-2" onClick={() => handleDeleteProduct(product.id)} data-testid={`delete-product-${product.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Category Position Manager */}
              {categories.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{t.manageCategoryPositions}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2" data-testid="category-position-list">
                      {[...categories].sort((a, b) => (a.position || 0) - (b.position || 0)).map((cat, idx) => (
                        <div key={cat.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg" data-testid={`cat-position-${cat.id}`}>
                          <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm text-[#0055FF] border">{idx + 1}</span>
                          <span className="flex-1 font-medium text-sm text-[#0F172A]">{cat.name}</span>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={idx === 0}
                              onClick={() => handleMoveCategoryPosition(cat.id, 'up')} data-testid={`cat-move-up-${cat.id}`}>
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={idx === categories.length - 1}
                              onClick={() => handleMoveCategoryPosition(cat.id, 'down')} data-testid={`cat-move-down-${cat.id}`}>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Cards */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {categories.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                      <p className="text-[#64748B] text-sm">{t.noCategoriesYet}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="categories-grid">
                      {[...categories].sort((a, b) => (a.position || 0) - (b.position || 0)).map((cat) => (
                        <div key={cat.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[#94A3B8]">#{cat.position || 0}</span>
                              <h3 className="font-medium text-[#0F172A] text-sm">{cat.name}</h3>
                            </div>
                            <p className="text-xs text-[#64748B]">{cat.description || t.noDescription}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryModal(true); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">{t.noOrdersYet}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openOrderDetail(order)} data-testid={`order-row-${order.id}`}>
                          <p className="font-medium text-[#0F172A] text-sm hover:text-[#0055FF] transition-colors">{order.id}</p>
                          <p className="text-xs text-[#64748B]">{order.customer_name} - {order.customer_phone}</p>
                          <p className="text-xs text-[#64748B]">{order.items?.length || 0} {t.items}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(order.total_amount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => openOrderDetail(order)} data-testid={`view-order-${order.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">{t.noPostsYet}</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="posts-list">
                    {posts.map((post) => (
                      <div key={post.id} className="p-3 border rounded-lg bg-white flex gap-4 items-start" data-testid={`post-row-${post.id}`}>
                        {post.thumbnail && (
                          <img src={post.thumbnail} alt={post.title} className="w-20 h-14 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[#0F172A] text-sm truncate">{post.title}</h4>
                          <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1" dangerouslySetInnerHTML={{ __html: post.description.replace(/<[^>]+>/g, '') }} />
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-[#94A3B8] flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                            {post.attached_products?.length > 0 && (
                              <span className="text-[10px] text-[#94A3B8]">{post.attached_products.length} {t.products.toLowerCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Link to={`/shop/${shop?.slug}/posts/${post.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 text-xs" data-testid={`view-post-${post.id}`}>
                              <Eye className="w-3 h-3 mr-1" /> {t.view || 'View'}
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditPost(post)} data-testid={`edit-post-${post.id}`}>
                            <Pencil className="w-3 h-3 mr-1" /> {t.edit}
                          </Button>
                          <Button variant="destructive" size="sm" className="h-8" onClick={() => handleDeletePost(post.id)} data-testid={`delete-post-${post.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && shop && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="w-4 h-4" /> {t.shopPreview}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-[#64748B]">{t.shopLiveAt}</p>
                      <p className="font-medium text-[#0F172A]">{window.location.origin}/shop/{shop.slug}</p>
                    </div>
                    <a href={`${window.location.origin}/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" /> {t.openShop}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="w-4 h-4" /> {t.customDomain}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-[#94A3B8] mb-3">{t.customDomainHint}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={shopForm.custom_domain || ''} onChange={(e) => setShopForm({ ...shopForm, custom_domain: e.target.value })} placeholder={t.customDomainPlaceholder} className="text-sm flex-1" data-testid="custom-domain-input" />
                    <Button onClick={async () => {
                      try {
                        await axios.put(`${API}/dashboard/shop`, { custom_domain: shopForm.custom_domain || '' });
                        toast.success(t.shopUpdated);
                        fetchData();
                      } catch (err) { toast.error(t.failedToSave); }
                    }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="save-domain-btn">
                      {t.saveChanges}
                    </Button>
                  </div>
                  {shopForm.custom_domain && (
                    <div className="mt-3 p-3 bg-[#F0F9FF] rounded-lg">
                      <p className="text-xs text-[#0369A1]">CNAME: <code className="bg-white px-2 py-0.5 rounded text-[#0F172A]">{shopForm.custom_domain}</code> → <code className="bg-white px-2 py-0.5 rounded text-[#0F172A]">your-server.com</code></p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> {t.themeColor}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-3">
                    {themeColors.map((color) => (
                      <button key={color.value} onClick={async () => {
                        setThemeColor(color.value);
                        try {
                          await axios.put(`${API}/dashboard/shop`, { theme_color: color.value });
                          toast.success(t.shopUpdated);
                        } catch (err) { toast.error(t.failedToSave); }
                      }}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${themeColor === color.value ? 'border-[#0F172A] scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }} title={color.name} data-testid={`theme-${color.name.toLowerCase()}`} />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> {t.postCarouselPosition}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-3">
                    {['top', 'bottom'].map(pos => (
                      <Button key={pos} variant={shopForm.post_carousel_position === pos ? 'default' : 'outline'}
                        className={`flex-1 text-sm ${shopForm.post_carousel_position === pos ? 'text-white' : ''}`}
                        style={shopForm.post_carousel_position === pos ? { backgroundColor: themeColor } : {}}
                        onClick={async () => {
                          setShopForm({ ...shopForm, post_carousel_position: pos });
                          try {
                            await axios.put(`${API}/dashboard/shop`, { post_carousel_position: pos });
                            toast.success(t.shopUpdated);
                          } catch { toast.error(t.failedToSave); }
                        }}
                        data-testid={`post-position-${pos}`}>
                        {pos === 'top' ? t.postPositionTop : t.postPositionBottom}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{t.shopProfile}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <form onSubmit={handleSaveShop} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.shopName}</label>
                        <Input value={shopForm.name || ''} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} className="text-sm" data-testid="shop-name-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.shopUrl}</label>
                        <Input value={`/${shop.slug}`} disabled className="bg-[#F8FAFC] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.description}</label>
                      <Textarea value={shopForm.description || ''} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} rows={3} className="text-sm" data-testid="shop-description-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.logoUrl}</label>
                      <Input value={shopForm.logo_url || ''} onChange={(e) => setShopForm({ ...shopForm, logo_url: e.target.value })} placeholder="https://..." className="text-sm" data-testid="shop-logo-input" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.contactPhone}</label>
                        <Input value={shopForm.contact_phone || ''} onChange={(e) => setShopForm({ ...shopForm, contact_phone: e.target.value })} className="text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.contactEmail}</label>
                        <Input value={shopForm.contact_email || ''} onChange={(e) => setShopForm({ ...shopForm, contact_email: e.target.value })} className="text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.shopAddress}</label>
                      <Input value={shopForm.address || ''} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} className="text-sm" />
                    </div>
                    <Button type="submit" style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="save-shop-btn">
                      {t.saveChanges}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto" data-testid="product-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingProduct ? t.editProduct : t.addProduct}</DialogTitle>
            <DialogDescription className="text-sm">{t.fillProductDetails}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.productName} *</label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required className="text-sm" data-testid="product-name-input" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">{t.productPrice} *</label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required className="text-sm" data-testid="product-price-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.stock}</label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="text-sm" data-testid="product-stock-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.position}</label>
                <Input type="number" value={productForm.position} onChange={(e) => setProductForm({ ...productForm, position: e.target.value })} className="text-sm" placeholder="0" data-testid="product-position-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.category}</label>
              <Select value={productForm.category_id || "none"} onValueChange={(val) => setProductForm({ ...productForm, category_id: val })}>
                <SelectTrigger className="text-sm" data-testid="product-category-select">
                  <SelectValue placeholder={t.selectCategory} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">{t.none}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.productImages}</label>
              <div className="space-y-2">
                {productForm.images?.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="product-images-preview">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F8FAFC] group cursor-pointer"
                        onClick={() => setAsThumbnail(idx)} title={idx === 0 ? '' : (t.setAsThumbnail || 'Set as thumbnail')}>
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeProductImage(idx); }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          data-testid={`remove-image-${idx}`}>
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#0055FF]/80 text-white text-[9px] text-center py-0.5" data-testid="thumbnail-badge">Thumbnail</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs" data-testid="upload-image-btn">
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? '...' : t.addMoreImages}
                  </Button>
                </div>
                <Input
                  placeholder={t.orPasteUrl}
                  className="text-sm"
                  data-testid="product-image-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = e.target.value.trim();
                      if (url) {
                        const newImages = [...(productForm.images || []), url];
                        setProductForm({ ...productForm, images: newImages, image_url: newImages[0] });
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.videoUrl}</label>
              <Input value={productForm.video_url} onChange={(e) => setProductForm({ ...productForm, video_url: e.target.value })} placeholder={t.videoUrlPlaceholder} className="text-sm" data-testid="product-video-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.description}</label>
              <ReactQuill theme="snow" value={productForm.description} onChange={(val) => setProductForm({ ...productForm, description: val })} modules={quillModulesProduct} className="bg-white [&_.ql-container]:min-h-[120px]" data-testid="product-description-input" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowProductModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-product-btn">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="category-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingCategory ? t.editCategory : t.addCategory}</DialogTitle>
            <DialogDescription className="text-sm">{t.enterCategoryDetails}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.categoryName} *</label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required className="text-sm" data-testid="category-name-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.categoryDescription}</label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={2} className="text-sm" data-testid="category-description-input" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowCategoryModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-category-btn">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto" data-testid="order-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{t.orderDetails}</DialogTitle>
            <DialogDescription className="text-sm">{t.orderId}: {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg text-sm">
                <div>
                  <p className="text-xs text-[#64748B]">{t.customerName}</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{t.phone}</p>
                  <p className="font-medium">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{t.email}</p>
                  <p className="font-medium">{selectedOrder.customer_email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{t.address}</p>
                  <p className="font-medium">{selectedOrder.customer_address}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm">{t.items}</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[#64748B]">{t.quantity}: {item.quantity} x {formatVND(item.price)}</p>
                      </div>
                      <p className="font-bold" style={{ color: themeColor }}>{formatVND(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#F8FAFC] rounded-lg">
                <span className="font-medium text-sm">{t.total}</span>
                <span className="text-xl font-bold" style={{ color: themeColor }}>{formatVND(selectedOrder.total_amount)}</span>
              </div>
              {selectedOrder.note && (
                <div className="p-3 border rounded-lg text-sm">
                  <p className="text-xs text-[#64748B]">{t.note}</p>
                  <p>{selectedOrder.note}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#64748B]">{t.status}:</span>
                <Select value={selectedOrder.status} onValueChange={(val) => { handleOrderStatus(selectedOrder.id, val); setSelectedOrder({ ...selectedOrder, status: val }); }}>
                  <SelectTrigger className="w-36 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="confirmed">{t.confirmed}</SelectItem>
                    <SelectItem value="processing">{t.processing}</SelectItem>
                    <SelectItem value="shipped">{t.shipped}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={showProductDetailModal} onOpenChange={(v) => { setShowProductDetailModal(v); if (!v) { setDetailActiveImage(0); setDetailShowVideo(false); } }}>
        <DialogContent className="sm:max-w-3xl bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto" data-testid="product-detail-modal">
          <DialogDescription className="sr-only">{t.productDetail}</DialogDescription>
          {selectedProduct && (() => {
            const images = selectedProduct.images?.length > 0 ? selectedProduct.images : [selectedProduct.image_url];
            const ytMatch = selectedProduct.video_url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : (selectedProduct.video_url || null);
            return (
              <div className="grid md:grid-cols-2">
                <div className="flex flex-col">
                  <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden">
                    {detailShowVideo && embedUrl ? (
                      <iframe src={embedUrl} title="Product video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : (
                      <img src={images[detailActiveImage]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  {(images.length > 1 || embedUrl) && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button key={idx} onClick={() => { setDetailActiveImage(idx); setDetailShowVideo(false); }}
                          className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${!detailShowVideo && detailActiveImage === idx ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-transparent hover:border-[#E2E8F0]'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {embedUrl && (
                        <button onClick={() => setDetailShowVideo(true)}
                          className={`w-14 h-14 rounded-lg flex-shrink-0 border-2 transition-all flex items-center justify-center bg-[#0F172A] ${detailShowVideo ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-transparent hover:border-[#E2E8F0]'}`}>
                          <Play className="w-5 h-5 text-white fill-white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col">
                  <h2 className="text-xl font-bold text-[#0F172A] mb-2">{selectedProduct.name}</h2>
                  <p className="text-2xl font-bold mb-4" style={{ color: themeColor }}>{formatVND(selectedProduct.price)}</p>
                  <p className="text-sm text-[#64748B] mb-2">{t.stock}: {selectedProduct.stock || 0}</p>
                  {selectedProduct.description && (
                    <div className="text-sm text-[#64748B] mb-4 flex-1 whitespace-pre-wrap">{selectedProduct.description}</div>
                  )}
                  <div className="flex gap-3 mt-auto pt-4">
                    <Button variant="outline" className="flex-1 text-sm" onClick={(e) => { e.stopPropagation(); setShowProductDetailModal(false); setTimeout(() => openEditProduct(selectedProduct), 100); }} data-testid="product-detail-edit-btn">
                      <Pencil className="w-4 h-4 mr-2" /> {t.editProduct}
                    </Button>
                    <Button className="flex-1 text-sm hover:opacity-90" style={{ backgroundColor: themeColor }} onClick={() => setShowProductDetailModal(false)}>
                      {t.close}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto" data-testid="post-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingPost ? t.editPost : t.addPost}</DialogTitle>
            <DialogDescription className="text-sm">{t.postDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePost} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.postTitle} *</label>
              <Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required className="text-sm" data-testid="post-title-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.postThumbnail}</label>
              <div className="flex items-center gap-3">
                {postForm.thumbnail && (
                  <div className="relative w-24 h-16 rounded overflow-hidden bg-[#F8FAFC]">
                    <img src={postForm.thumbnail} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPostForm({ ...postForm, thumbnail: '' })} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <input type="file" ref={postFileInputRef} onChange={handlePostThumbnailUpload} accept="image/*" className="hidden" />
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => postFileInputRef.current?.click()} data-testid="post-thumbnail-upload">
                  <Upload className="w-3 h-3 mr-1" /> {t.uploadImage}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.postImages}</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(postForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative w-20 h-14 rounded overflow-hidden bg-[#F8FAFC]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPostForm({ ...postForm, images: postForm.images.filter((_, i) => i !== idx) })} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {(postForm.images || []).length < 3 && (
                  <>
                    <input type="file" ref={postImagesInputRef} onChange={handlePostImageUpload} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" size="sm" className="text-xs h-14 w-20" onClick={() => postImagesInputRef.current?.click()} data-testid="post-images-upload">
                      <Image className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium">{t.postDescription} *</label>
                <span className={`text-[10px] ${countWords(postForm.description) > 2000 ? 'text-red-500 font-bold' : 'text-[#94A3B8]'}`}>
                  {countWords(postForm.description)}/2000 {t.wordCount}
                </span>
              </div>
              <ReactQuill theme="snow" value={postForm.description} onChange={(val) => setPostForm({ ...postForm, description: val })} modules={quillModules} className="bg-white [&_.ql-container]:min-h-[200px]" data-testid="post-editor" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">{t.attachProducts}</label>
              {(postForm.attached_products || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(postForm.attached_products || []).map(pid => {
                    const prod = products.find(p => p.id === pid);
                    if (!prod) return null;
                    return (
                      <div key={pid} className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5px] px-2 py-1">
                        <img src={prod.image_url} alt={prod.name} className="w-6 h-6 rounded object-cover" />
                        <span className="text-xs text-[#0F172A] max-w-[120px] truncate">{prod.name}</span>
                        <button type="button" onClick={() => toggleProductAttach(pid)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Input
                placeholder={t.searchShort || 'Search...'}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="text-sm mb-2 rounded-[5px]"
                data-testid="post-product-search"
              />
              <div className="max-h-40 overflow-y-auto border rounded-[5px] p-1" data-testid="post-product-attach">
                {filteredProductsForAttach.map(prod => {
                  const isAttached = (postForm.attached_products || []).includes(prod.id);
                  return (
                    <button type="button" key={prod.id} onClick={() => toggleProductAttach(prod.id)}
                      className={`w-full flex items-center gap-2 p-1.5 rounded-[5px] text-left transition-all mb-0.5 ${isAttached ? 'bg-blue-50 border border-blue-200' : 'hover:bg-[#F8FAFC]'}`}
                      data-testid={`attach-product-${prod.id}`}>
                      <img src={prod.image_url} alt={prod.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      <span className="text-xs text-[#0F172A] flex-1 truncate">{prod.name}</span>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0">{formatVND(prod.price)}</span>
                      {isAttached && <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0" style={{ backgroundColor: themeColor }}>✓</span>}
                    </button>
                  );
                })}
                {filteredProductsForAttach.length === 0 && (
                  <p className="text-xs text-[#94A3B8] text-center py-3">{t.noProducts}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowPostModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-post-btn">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopOwnerDashboard;
