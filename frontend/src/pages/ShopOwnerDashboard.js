import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Settings, 
  LogOut, Menu, X, Plus, Pencil, Trash2, TrendingUp, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShopOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({ name: '', price: '', category_id: '', description: '', image_url: '', stock: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [shopForm, setShopForm] = useState({});

  useEffect(() => {
    if (!user || (user.role !== 'shop_owner' && user.role !== 'super_admin')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

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

  // Product handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { ...productForm, price: parseInt(productForm.price), stock: parseInt(productForm.stock) || 0 };
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
      category_id: product.category_id || '',
      description: product.description || '',
      image_url: product.image_url,
      stock: (product.stock || 0).toString()
    });
    setShowProductModal(true);
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
      setShowShopModal(false);
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'settings', label: 'Shop Settings', icon: Settings },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="shop-owner-dashboard">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white transition-all z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <span className="font-bold text-lg">{shop?.name || 'Dashboard'}</span>
              <p className="text-xs text-[#94A3B8]">/{shop?.slug}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-white/10">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/10 transition-colors ${activeTab === item.id ? 'bg-[#0055FF]' : ''}`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white/10 text-red-400" data-testid="logout-btn">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all ${sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#0F172A]">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'products' && 'Products'}
                {activeTab === 'categories' && 'Categories'}
                {activeTab === 'orders' && 'Orders'}
                {activeTab === 'settings' && 'Shop Settings'}
              </h1>
              <p className="text-[#64748B] mt-1">Welcome back, {user?.name}</p>
            </div>
            {activeTab === 'products' && (
              <Button onClick={() => { resetProductForm(); setShowProductModal(true); }} className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            )}
            {activeTab === 'categories' && (
              <Button onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }} className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-[#64748B]">Total Products</CardTitle>
                    <Package className="w-5 h-5 text-[#0055FF]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#0F172A]">{stats.total_products}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-[#64748B]">Total Orders</CardTitle>
                    <ShoppingCart className="w-5 h-5 text-[#0055FF]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#0F172A]">{stats.total_orders}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-[#64748B]">Pending Orders</CardTitle>
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#0F172A]">{stats.pending_orders}</div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-[#64748B]">Total Revenue</CardTitle>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#0F172A]">{formatVND(stats.total_revenue)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-[#64748B] text-center py-8">No orders yet</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                          <div>
                            <p className="font-medium text-[#0F172A]">{order.id}</p>
                            <p className="text-sm text-[#64748B]">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#0055FF]">{formatVND(order.total_amount)}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
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

          {/* Products Tab */}
          {activeTab === 'products' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B]">No products yet. Add your first product!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="products-grid">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-[#F8FAFC]">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-[#0F172A] truncate">{product.name}</h3>
                          <p className="text-[#0055FF] font-bold mt-1">{formatVND(product.price)}</p>
                          <p className="text-sm text-[#64748B] mt-1">Stock: {product.stock || 0}</p>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditProduct(product)} data-testid={`edit-product-${product.id}`}>
                              <Pencil className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)} data-testid={`delete-product-${product.id}`}>
                              <Trash2 className="w-4 h-4" />
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
              <CardContent className="pt-6">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B]">No categories yet. Create your first category!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="categories-grid">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-4 border rounded-xl bg-white flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-[#0F172A]">{cat.name}</h3>
                          <p className="text-sm text-[#64748B]">{cat.description || 'No description'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryModal(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
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
              <CardContent className="pt-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B]">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="orders-table">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Order ID</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Customer</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Items</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Total</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-medium text-[#0F172A]">{order.id}</td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-[#0F172A]">{order.customer_name}</p>
                                <p className="text-sm text-[#64748B]">{order.customer_phone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#64748B]">{order.items?.length || 0} items</td>
                            <td className="py-3 px-4 font-bold text-[#0055FF]">{formatVND(order.total_amount)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Select value={order.status} onValueChange={(val) => handleOrderStatus(order.id, val)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && shop && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Shop Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveShop} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Shop Name</label>
                      <Input value={shopForm.name || ''} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} data-testid="shop-name-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Shop URL</label>
                      <Input value={`/${shop.slug}`} disabled className="bg-[#F8FAFC]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea value={shopForm.description || ''} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} rows={3} data-testid="shop-description-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Logo URL</label>
                    <Input value={shopForm.logo_url || ''} onChange={(e) => setShopForm({ ...shopForm, logo_url: e.target.value })} placeholder="https://..." data-testid="shop-logo-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Phone</label>
                      <Input value={shopForm.contact_phone || ''} onChange={(e) => setShopForm({ ...shopForm, contact_phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Email</label>
                      <Input value={shopForm.contact_email || ''} onChange={(e) => setShopForm({ ...shopForm, contact_email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <Input value={shopForm.address || ''} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Facebook</label>
                      <Input value={shopForm.social_facebook || ''} onChange={(e) => setShopForm({ ...shopForm, social_facebook: e.target.value })} placeholder="https://facebook.com/..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Instagram</label>
                      <Input value={shopForm.social_instagram || ''} onChange={(e) => setShopForm({ ...shopForm, social_instagram: e.target.value })} placeholder="https://instagram.com/..." />
                    </div>
                  </div>
                  <Button type="submit" className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="save-shop-btn">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-lg" data-testid="product-modal">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required data-testid="product-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (VND)</label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required data-testid="product-price-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} data-testid="product-stock-input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select value={productForm.category_id} onValueChange={(val) => setProductForm({ ...productForm, category_id: val })}>
                <SelectTrigger data-testid="product-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} required data-testid="product-image-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} data-testid="product-description-input" />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" data-testid="save-product-btn">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-md" data-testid="category-modal">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required data-testid="category-name-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={2} data-testid="category-description-input" />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" data-testid="save-category-btn">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopOwnerDashboard;
