import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
  Bold, Italic, List
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShopOwnerDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Theme color
  const [themeColor, setThemeColor] = useState('#0055FF');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({ name: '', price: '', category_id: '', description: '', image_url: '', stock: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [shopForm, setShopForm] = useState({});

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
      const [statsRes, shopRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { withCredentials: true }),
        axios.get(`${API}/dashboard/shop`, { withCredentials: true }),
        axios.get(`${API}/dashboard/products`, { withCredentials: true }),
        axios.get(`${API}/dashboard/categories`, { withCredentials: true }),
        axios.get(`${API}/dashboard/orders`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setShop(shopRes.data);
      setShopForm(shopRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const { data } = await axios.post(`${API}/upload/image`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProductForm({ ...productForm, image_url: `${API}/files/${data.id}` });
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Product handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        ...productForm, 
        price: parseInt(productForm.price), 
        stock: parseInt(productForm.stock) || 0,
        category_id: productForm.category_id === "none" ? null : productForm.category_id || null
      };
      if (editingProduct) {
        await axios.put(`${API}/dashboard/products/${editingProduct.id}`, data, { withCredentials: true });
        toast.success('Product updated');
      } else {
        await axios.post(`${API}/dashboard/products`, data, { withCredentials: true });
        toast.success('Product created');
      }
      setShowProductModal(false);
      resetProductForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/dashboard/products/${prodId}`, { withCredentials: true });
      toast.success('Product deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
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
      stock: (product.stock || 0).toString()
    });
    setShowProductModal(true);
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setShowProductDetailModal(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', category_id: '', description: '', image_url: '', stock: '' });
  };

  // Category handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/dashboard/categories/${editingCategory.id}`, categoryForm, { withCredentials: true });
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/dashboard/categories`, categoryForm, { withCredentials: true });
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API}/dashboard/categories/${catId}`, { withCredentials: true });
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  // Shop handlers
  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/dashboard/shop`, shopForm, { withCredentials: true });
      toast.success('Shop updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update shop');
    }
  };

  // Order handlers
  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/dashboard/orders/${orderId}/status`, { status }, { withCredentials: true });
      toast.success('Order status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update order');
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

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const themeColors = [
    { name: 'Blue', value: '#0055FF' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
  ];

  // Simple formatting functions
  const insertFormatting = (format) => {
    const textarea = document.querySelector('[data-testid="product-description-input"]');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = productForm.description;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    switch (format) {
      case 'bold':
        newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
        break;
      case 'italic':
        newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
        break;
      case 'list':
        newText = text.substring(0, start) + `\n- ${selectedText}` + text.substring(end);
        break;
      default:
        return;
    }
    setProductForm({ ...productForm, description: newText });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="shop-owner-dashboard" style={{ '--theme-color': themeColor }}>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white transition-all z-50 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="min-w-0">
              <span className="font-bold text-base truncate block">{shop?.name || 'Dashboard'}</span>
              <p className="text-xs text-[#94A3B8] truncate">/{shop?.slug}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-white/10 flex-shrink-0">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors`}
              style={{ backgroundColor: activeTab === item.id ? themeColor : 'transparent' }}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Shop Preview Link */}
        {sidebarOpen && shop && (
          <div className="px-4 mt-4">
            <Link 
              to={`/shop/${shop.slug}`} 
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Shop
            </Link>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-red-400 text-sm" data-testid="logout-btn">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all ${sidebarOpen ? 'ml-64' : 'ml-16'} p-4 lg:p-6`}>
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A]">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'products' && 'Products'}
                {activeTab === 'categories' && 'Categories'}
                {activeTab === 'orders' && 'Orders'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="text-sm text-[#64748B] mt-1">Welcome back, {user?.name}</p>
            </div>
            {activeTab === 'products' && (
              <Button onClick={() => { resetProductForm(); setShowProductModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            )}
            {activeTab === 'categories' && (
              <Button onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">Products</CardTitle>
                    <Package className="w-4 h-4" style={{ color: themeColor }} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.total_products}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">Orders</CardTitle>
                    <ShoppingCart className="w-4 h-4" style={{ color: themeColor }} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.total_orders}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">Pending</CardTitle>
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.pending_orders}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">Revenue</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-lg lg:text-2xl font-bold text-[#0F172A]">{formatVND(stats.total_revenue)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {orders.length === 0 ? (
                    <p className="text-[#64748B] text-center py-8 text-sm">No orders yet</p>
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
                              {order.status}
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

          {/* Products Tab - 5 columns desktop, 2 mobile */}
          {activeTab === 'products' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">No products yet. Add your first product!</p>
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
                          <p className="text-[10px] lg:text-xs text-[#64748B]">Stock: {product.stock || 0}</p>
                          <div className="flex gap-1 lg:gap-2 mt-2">
                            <Button variant="outline" size="sm" className="flex-1 text-[10px] lg:text-xs h-7 lg:h-8 px-1 lg:px-2" onClick={() => openEditProduct(product)} data-testid={`edit-product-${product.id}`}>
                              <Pencil className="w-3 h-3 mr-1" /> Edit
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
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">No categories yet. Create your first category!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="categories-grid">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-[#0F172A] text-sm">{cat.name}</h3>
                          <p className="text-xs text-[#64748B]">{cat.description || 'No description'}</p>
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
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#0F172A] text-sm">{order.id}</p>
                          <p className="text-xs text-[#64748B]">{order.customer_name} • {order.customer_phone}</p>
                          <p className="text-xs text-[#64748B]">{order.items?.length || 0} items</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(order.total_amount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {order.status}
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

          {/* Settings Tab */}
          {activeTab === 'settings' && shop && (
            <div className="space-y-6">
              {/* Shop Preview */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Shop Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-[#64748B]">Your shop is live at:</p>
                      <p className="font-medium text-[#0F172A]">{window.location.origin}/shop/{shop.slug}</p>
                    </div>
                    <Link to={`/shop/${shop.slug}`} target="_blank">
                      <Button style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" /> Open Shop
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Color Setting */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Theme Color</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-3">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setThemeColor(color.value)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${themeColor === color.value ? 'border-[#0F172A] scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        data-testid={`theme-${color.name.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shop Profile */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Shop Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <form onSubmit={handleSaveShop} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Shop Name</label>
                        <Input value={shopForm.name || ''} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} className="text-sm" data-testid="shop-name-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Shop URL</label>
                        <Input value={`/${shop.slug}`} disabled className="bg-[#F8FAFC] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Description</label>
                      <Textarea value={shopForm.description || ''} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} rows={3} className="text-sm" data-testid="shop-description-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Logo URL</label>
                      <Input value={shopForm.logo_url || ''} onChange={(e) => setShopForm({ ...shopForm, logo_url: e.target.value })} placeholder="https://..." className="text-sm" data-testid="shop-logo-input" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Contact Phone</label>
                        <Input value={shopForm.contact_phone || ''} onChange={(e) => setShopForm({ ...shopForm, contact_phone: e.target.value })} className="text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Contact Email</label>
                        <Input value={shopForm.contact_email || ''} onChange={(e) => setShopForm({ ...shopForm, contact_email: e.target.value })} className="text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Address</label>
                      <Input value={shopForm.address || ''} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} className="text-sm" />
                    </div>
                    <Button type="submit" style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="save-shop-btn">
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Product Modal with Image Upload and Rich Text */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto" data-testid="product-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription className="text-sm">Fill in the product details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required className="text-sm" data-testid="product-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Price (VND) *</label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required className="text-sm" data-testid="product-price-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Stock</label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="text-sm" data-testid="product-stock-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <Select value={productForm.category_id || "none"} onValueChange={(val) => setProductForm({ ...productForm, category_id: val })}>
                <SelectTrigger className="text-sm" data-testid="product-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Product Image *</label>
              <div className="space-y-2">
                {productForm.image_url && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F8FAFC]">
                    <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs">
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
                <Input 
                  value={productForm.image_url} 
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} 
                  placeholder="Or paste image URL..." 
                  className="text-sm"
                  data-testid="product-image-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="flex gap-1 p-2 border-b bg-[#F8FAFC]">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting('bold')} title="Bold">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting('italic')} title="Italic">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormatting('list')} title="List">
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Enter product description... (supports **bold**, *italic*, - lists)"
                  className="text-sm border-0 rounded-none min-h-[120px] focus-visible:ring-0"
                  data-testid="product-description-input"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowProductModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-product-btn">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="category-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription className="text-sm">Enter category details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required className="text-sm" data-testid="category-name-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={2} className="text-sm" data-testid="category-description-input" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-category-btn">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto" data-testid="order-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">Order Details</DialogTitle>
            <DialogDescription className="text-sm">Order ID: {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg text-sm">
                <div>
                  <p className="text-xs text-[#64748B]">Customer Name</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Phone</p>
                  <p className="font-medium">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Email</p>
                  <p className="font-medium">{selectedOrder.customer_email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Address</p>
                  <p className="font-medium">{selectedOrder.customer_address}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[#64748B]">Qty: {item.quantity} × {formatVND(item.price)}</p>
                      </div>
                      <p className="font-bold" style={{ color: themeColor }}>{formatVND(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-[#F8FAFC] rounded-lg">
                <span className="font-medium text-sm">Total</span>
                <span className="text-xl font-bold" style={{ color: themeColor }}>{formatVND(selectedOrder.total_amount)}</span>
              </div>

              {/* Note */}
              {selectedOrder.note && (
                <div className="p-3 border rounded-lg text-sm">
                  <p className="text-xs text-[#64748B]">Note</p>
                  <p>{selectedOrder.note}</p>
                </div>
              )}

              {/* Status Update */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#64748B]">Status:</span>
                <Select value={selectedOrder.status} onValueChange={(val) => { handleOrderStatus(selectedOrder.id, val); setSelectedOrder({ ...selectedOrder, status: val }); }}>
                  <SelectTrigger className="w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={showProductDetailModal} onOpenChange={setShowProductDetailModal}>
        <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden" data-testid="product-detail-modal">
          <DialogDescription className="sr-only">Product details</DialogDescription>
          {selectedProduct && (
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-[#F8FAFC]">
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex flex-col">
                <h2 className="text-xl font-bold text-[#0F172A] mb-2">{selectedProduct.name}</h2>
                <p className="text-2xl font-bold mb-4" style={{ color: themeColor }}>{formatVND(selectedProduct.price)}</p>
                <p className="text-sm text-[#64748B] mb-2">Stock: {selectedProduct.stock || 0}</p>
                {selectedProduct.description && (
                  <div className="text-sm text-[#64748B] mb-4 flex-1 prose prose-sm" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                )}
                <div className="flex gap-3 mt-auto">
                  <Button variant="outline" className="flex-1 text-sm" onClick={() => { setShowProductDetailModal(false); openEditProduct(selectedProduct); }}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button className="flex-1 text-sm hover:opacity-90" style={{ backgroundColor: themeColor }} onClick={() => setShowProductDetailModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopOwnerDashboard;
