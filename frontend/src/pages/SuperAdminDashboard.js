import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { 
  LayoutDashboard, Store, Users, ShoppingCart, 
  LogOut, Menu, X, TrendingUp, CalendarClock, Eye, Phone, Mail, Globe, Wrench, Trash2, Image, AlertTriangle, CheckCircle2, Settings, Lock, Copy, MoreHorizontal, Send, Download
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SuperAdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { t, lang, switchLanguage } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shopSortBy, setShopSortBy] = useState('product_count');
  // Maintenance state
  const [maintenancePreview, setMaintenancePreview] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(null); // 'orders' | 'images' | null
  const [maintenanceResults, setMaintenanceResults] = useState([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOwner, setNewOwner] = useState({ email: '', password: '', name: '', shop_name: '', phone: '', send_email: false });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSendEmail, setBulkSendEmail] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  // Change password state
  const [changePasswordData, setChangePasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'super_admin' && user.role !== 'sub_admin')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  const isSuperAdmin = user?.role === 'super_admin';


  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, shopsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/shops`),
        axios.get(`${API}/admin/users`)
      ]);
      setStats(statsRes.data);
      setShops(shopsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/block`, {});
      toast.success(t.userStatusUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t.deleteConfirmUser)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success(t.userDeleted);
      fetchData();
    } catch (err) {
      toast.error(t.failedToDelete);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm(t.resetPasswordConfirm)) return;
    try {
      await axios.post(`${API}/admin/users/${userId}/reset-password`, {});
      toast.success(t.passwordResetSuccess);
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/users`, newOwner);
      toast.success(t.shopOwnerCreated);
      setShowCreateModal(false);
      setNewOwner({ email: '', password: '', name: '', shop_name: '', phone: '', send_email: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToCreate);
    }
  };

  const handleBulkCreate = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) return toast.error('Không có dữ liệu');
    setBulkCreating(true);
    const results = [];
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 3) { results.push({ line, status: 'error', msg: 'Thiếu dữ liệu (cần: tên, email, tên cửa hàng)' }); continue; }
      const [name, email, shop_name, phone] = parts;
      try {
        await axios.post(`${API}/admin/users`, { name, email, password: 'iLoveProID@', shop_name, phone: phone || '', send_email: bulkSendEmail });
        results.push({ line, status: 'ok', msg: `${email} - OK` });
      } catch (err) {
        results.push({ line, status: 'error', msg: `${email} - ${err.response?.data?.detail || 'Lỗi'}` });
      }
    }
    setBulkResults(results);
    setBulkCreating(false);
    fetchData();
    toast.success(`Đã xử lý ${results.length} dòng`);
  };

  const handleShopStatus = async (shopId, status) => {
    try {
      await axios.post(`${API}/admin/shops/${shopId}/status?status=${status}`, {});
      toast.success(t.shopStatusUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleSetExpiry = async (shopId, expiryDate) => {
    try {
      await axios.post(`${API}/admin/shops/${shopId}/expiry`, { expiry_date: expiryDate || null });
      toast.success(t.expiryUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleSetLimits = async (shopId, field, value) => {
    try {
      await axios.put(`${API}/admin/shops/${shopId}/limits`, { [field]: parseInt(value) || 0 });
      toast.success(t.limitsUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePasswordData.new_password !== changePasswordData.confirm_password) {
      toast.error(t.passwordMismatch || 'Mật khẩu mới không khớp');
      return;
    }
    if (changePasswordData.new_password.length < 6) {
      toast.error(t.passwordTooShort || 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setChangingPassword(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: changePasswordData.current_password,
        new_password: changePasswordData.new_password,
      });
      toast.success(t.passwordChanged || 'Đổi mật khẩu thành công!');
      setChangePasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToUpdate || 'Lỗi');
    }
    setChangingPassword(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'shops', label: t.shopManagement, icon: Store },
    { id: 'users', label: t.userManagement, icon: Users },
    ...(isSuperAdmin ? [{ id: 'maintenance', label: t.maintenance || 'Bảo trì', icon: Wrench }] : []),
    { id: 'settings', label: t.settings || 'Cài đặt', icon: Settings },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="super-admin-dashboard">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} data-testid="sidebar-backdrop" />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white z-50 transition-all duration-300 w-64 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          <span className={`font-bold text-lg ${sidebarOpen ? '' : 'lg:hidden'}`}>{t.adminPanel}</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-white/10 hidden lg:inline-flex">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="text-white hover:bg-white/10 lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/10 transition-colors ${activeTab === item.id ? 'bg-[#0055FF]' : ''}`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={sidebarOpen ? '' : 'lg:hidden'}>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={() => { handleLogout(); setMobileSidebarOpen(false); }} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white/10 text-red-400" data-testid="logout-btn">
            <LogOut className="w-5 h-5" />
            <span className={sidebarOpen ? '' : 'lg:hidden'}>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all p-4 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} data-testid="mobile-sidebar-toggle">
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
                  {activeTab === 'overview' && t.dashboardOverview}
                  {activeTab === 'shops' && t.shopManagement}
                  {activeTab === 'users' && t.userManagement}
                  {activeTab === 'maintenance' && (t.maintenance || 'Bảo trì hệ thống')}
                  {activeTab === 'settings' && (t.settings || 'Cài đặt')}
                </h1>
                <p className="text-[#64748B] mt-1">{t.welcomeBack}, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center bg-[#F1F5F9] rounded-full p-0.5" data-testid="admin-lang-switcher">
              <button onClick={() => switchLanguage('vi')} className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${lang === 'vi' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`} data-testid="admin-lang-vi">VI</button>
              <button onClick={() => switchLanguage('en')} className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`} data-testid="admin-lang-en">EN</button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="border-0 shadow-sm" data-testid="stat-shops">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">{t.totalShops}</CardTitle>
                  <Store className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{stats.total_shops}</div>
                  <p className="text-xs text-green-500 mt-1">{stats.active_shops} {t.activeShops}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm" data-testid="stat-owners">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">{t.shopOwners}</CardTitle>
                  <Users className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{stats.total_shop_owners}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm" data-testid="stat-orders">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">{t.totalOrders}</CardTitle>
                  <ShoppingCart className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{stats.total_orders}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm" data-testid="stat-revenue">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">{t.totalRevenue}</CardTitle>
                  <TrendingUp className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold text-[#0F172A]">{formatVND(stats.total_revenue)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shops Tab */}
          {activeTab === 'shops' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle>{t.allShops}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} placeholder="Tìm tên, email, SĐT..." className="max-w-[200px] text-sm h-8" data-testid="shop-search-input" />
                    <div className="flex items-center gap-2" data-testid="shop-sort-controls">
                      <span className="text-xs text-[#64748B] font-medium">{t.sortBy || 'Sắp xếp'}:</span>
                      <select
                        value={shopSortBy}
                        onChange={(e) => setShopSortBy(e.target.value)}
                        className="text-xs border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-white text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 cursor-pointer"
                        data-testid="shop-sort-select"
                      >
                        <option value="product_count">{t.products} ↓</option>
                        <option value="category_count">{t.categories} ↓</option>
                        <option value="order_count">{t.orders} ↓</option>
                        <option value="post_count">{t.posts} ↓</option>
                        <option value="page_count">{t.pages} ↓</option>
                        <option value="menu_item_count">{t.menuItems} ↓</option>
                        <option value="mega_menu_count">Mega Menu ↓</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...shops].filter(shop => {
                    if (!shopSearch.trim()) return true;
                    const q = shopSearch.toLowerCase();
                    return (shop.name || '').toLowerCase().includes(q) || (shop.owner?.email || '').toLowerCase().includes(q) || (shop.contact_phone || '').toLowerCase().includes(q);
                  }).sort((a, b) => (b[shopSortBy] || 0) - (a[shopSortBy] || 0)).map((shop, rank) => (
                    <div key={shop.id} className="border border-[#E2E8F0] rounded-xl p-4 hover:shadow-md transition-shadow" data-testid={`shop-card-${shop.id}`}>
                      {/* Row 1: Shop name, status, actions */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm relative" style={{ backgroundColor: shop.theme_color || '#0055FF' }}>
                            {shop.name?.[0]}
                            {rank === 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-[10px] font-bold text-white flex items-center justify-center shadow">#1</span>}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F172A]">{shop.name}</div>
                            <div className="text-xs text-[#94A3B8]">/{shop.slug} · {shop.owner?.email || '-'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${shop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {shop.status}
                          </span>
                          {shop.expiry_date && new Date(shop.expiry_date) < new Date() && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{t.expired}</span>
                          )}
                          <Link to={`/dashboard?shop=${shop.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5" data-testid={`view-shop-${shop.id}`}>
                              <Eye className="w-3.5 h-3.5" /> {t.viewShop}
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleShopStatus(shop.id, shop.status === 'active' ? 'suspended' : 'active')} data-testid={`toggle-shop-${shop.id}`}>
                            {shop.status === 'active' ? t.suspend : t.activate}
                          </Button>
                        </div>
                      </div>

                      {/* Row 2: Count stats grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-3" data-testid={`shop-counts-${shop.id}`}>
                        {[
                          { key: 'product_count', label: t.products, value: shop.product_count || 0 },
                          { key: 'category_count', label: t.categories, value: shop.category_count || 0 },
                          { key: 'order_count', label: t.orders, value: shop.order_count || 0 },
                          { key: 'post_count', label: t.posts, value: shop.post_count || 0 },
                          { key: 'page_count', label: t.pages, value: shop.page_count || 0 },
                          { key: 'menu_item_count', label: t.menuItems, value: shop.menu_item_count || 0 },
                          { key: 'mega_menu_count', label: 'Mega Menu', value: shop.mega_menu_count || 0 }
                        ].map(col => (
                          <div key={col.key} className={`rounded-lg p-2.5 text-center transition-all ${shopSortBy === col.key ? 'bg-[#0055FF]/10 ring-1 ring-[#0055FF]/30' : 'bg-[#F8FAFC]'}`}>
                            <div className={`text-lg font-bold ${shopSortBy === col.key ? 'text-[#0055FF]' : 'text-[#0F172A]'}`}>{col.value}</div>
                            <div className={`text-[10px] font-medium uppercase tracking-wide ${shopSortBy === col.key ? 'text-[#0055FF]/70' : 'text-[#94A3B8]'}`}>{col.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Row 3: Contact Info */}
                      <div className="flex items-center gap-5 mb-3 px-1 text-xs text-[#64748B]" data-testid={`shop-contact-${shop.id}`}>
                        {shop.contact_phone && (
                          <a href={`tel:${shop.contact_phone}`} className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{shop.contact_phone}</span>
                          </a>
                        )}
                        {shop.contact_email && (
                          <a href={`mailto:${shop.contact_email}`} className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{shop.contact_email}</span>
                          </a>
                        )}
                        <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                          <span>/shop/{shop.slug}</span>
                        </a>
                      </div>

                      {/* Row 4: Limits + Expiry */}
                      <div className="flex items-center gap-4 pt-2 border-t border-[#F1F5F9] text-xs text-[#64748B]">
                        <div className="flex items-center gap-2">
                          <span>{t.expiryDate}:</span>
                          <input type="date"
                            value={shop.expiry_date ? shop.expiry_date.split('T')[0] : ''}
                            onChange={(e) => handleSetExpiry(shop.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="text-xs border rounded px-2 py-1 w-36"
                            data-testid={`expiry-input-${shop.id}`} />
                          {shop.expiry_date && (
                            <button onClick={() => handleSetExpiry(shop.id, null)} className="text-red-500 hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{t.maxProducts}:</span>
                          <input type="number" min="0" value={shop.max_products ?? 100}
                            onChange={(e) => handleSetLimits(shop.id, 'max_products', e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 w-16 text-center"
                            data-testid={`max-products-${shop.id}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{t.maxPosts}:</span>
                          <input type="number" min="0" value={shop.max_posts ?? 50}
                            onChange={(e) => handleSetLimits(shop.id, 'max_posts', e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 w-16 text-center"
                            data-testid={`max-posts-${shop.id}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{t.maxPages}:</span>
                          <input type="number" min="0" value={shop.max_pages ?? 20}
                            onChange={(e) => handleSetLimits(shop.id, 'max_pages', e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 w-16 text-center"
                            data-testid={`max-pages-${shop.id}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{t.maxCategories}:</span>
                          <input type="number" min="0" value={shop.max_categories ?? 50}
                            onChange={(e) => handleSetLimits(shop.id, 'max_categories', e.target.value)}
                            className="text-xs border rounded px-1 py-0.5 w-16 text-center"
                            data-testid={`max-categories-${shop.id}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-end gap-2">
                {isSuperAdmin && <Button variant="outline" onClick={() => { setShowBulkModal(true); setBulkResults([]); setBulkText(''); }} data-testid="bulk-create-btn">
                  Tạo hàng loạt
                </Button>}
                {isSuperAdmin && <Button onClick={() => setShowCreateModal(true)} className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="create-owner-btn">
                  + {t.createShopOwner}
                </Button>}
              </div>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>{t.allUsers}</CardTitle>
                    <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Tìm theo tên, email, cửa hàng..." className="max-w-xs text-sm" data-testid="user-search-input" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="users-table">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.name}</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.email}</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.role}</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.shopName}</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.status}</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => {
                          if (!userSearch.trim()) return true;
                          const q = userSearch.toLowerCase();
                          return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.shop_name || '').toLowerCase().includes(q);
                        }).map((u) => (
                          <tr key={u.id} className="border-b hover:bg-[#F8FAFC]">
                            <td className="py-3 px-4 font-medium text-[#0F172A]">{u.name}</td>
                            <td className="py-3 px-4 text-[#64748B]">{u.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'shop_owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#64748B]">{u.shop_name || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {u.role !== 'super_admin' && u.role !== 'sub_admin' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" data-testid={`user-actions-${u.id}`}>
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white w-48">
                                    <DropdownMenuItem onClick={async () => {
                                      const info = `Tên: ${u.name}\nEmail: ${u.email}\nMật khẩu: iLoveProID@`;
                                      try {
                                        await navigator.clipboard.writeText(info);
                                        toast.success('Đã copy thông tin đăng nhập');
                                      } catch {
                                        const ta = document.createElement('textarea');
                                        ta.value = info; ta.style.position = 'fixed'; ta.style.opacity = '0';
                                        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
                                        document.body.removeChild(ta);
                                        toast.success('Đã copy thông tin đăng nhập');
                                      }
                                    }} data-testid={`copy-login-${u.id}`} className="cursor-pointer">
                                      <Copy className="w-4 h-4 mr-2" /> Copy đăng nhập
                                    </DropdownMenuItem>
                                    {u.shop_slug && (
                                      <DropdownMenuItem onClick={() => window.open(`/shop/${u.shop_slug}`, '_blank')} data-testid={`view-shop-${u.id}`} className="cursor-pointer">
                                        <Eye className="w-4 h-4 mr-2" /> Xem cửa hàng
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={async () => {
                                      try {
                                        await axios.post(`${API}/admin/users/${u.id}/send-login-email`);
                                        toast.success(`Đã gửi email đến ${u.email}`);
                                      } catch (err) {
                                        toast.error(err.response?.data?.detail || 'Gửi email thất bại');
                                      }
                                    }} data-testid={`send-email-${u.id}`} className="cursor-pointer">
                                      <Send className="w-4 h-4 mr-2" /> Gửi email đăng nhập
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleBlockUser(u.id)} data-testid={`block-user-${u.id}`} className="cursor-pointer">
                                      <Lock className="w-4 h-4 mr-2" /> {u.status === 'blocked' ? t.unblock : t.block}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResetPassword(u.id)} data-testid={`reset-pwd-${u.id}`} className="cursor-pointer">
                                      <Settings className="w-4 h-4 mr-2" /> {t.resetPwd}
                                    </DropdownMenuItem>
                                    {isSuperAdmin && <><DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} data-testid={`delete-user-${u.id}`} className="cursor-pointer text-red-600 focus:text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" /> {t.delete}
                                    </DropdownMenuItem></>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <p className="text-sm text-[#64748B]">{t.maintenanceDesc || 'Quét và dọn dẹp dữ liệu cũ trên hệ thống để tối ưu hóa hiệu suất.'}</p>

              {/* Scan Button */}
              {!maintenancePreview && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Wrench className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">{t.scanSystem || 'Quét hệ thống'}</h3>
                    <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">{t.scanDesc || 'Quét toàn bộ hệ thống để tìm đơn hàng cũ hơn 1 năm và hình ảnh không được sử dụng.'}</p>
                    <Button className="bg-[#0055FF] hover:bg-[#0040CC] px-8" disabled={maintenanceLoading}
                      onClick={async () => {
                        setMaintenanceLoading(true);
                        try {
                          const res = await axios.get(`${API}/admin/maintenance/preview`);
                          setMaintenancePreview(res.data);
                          setMaintenanceResults([]);
                        } catch { toast.error(t.failedToSave || 'Error'); }
                        setMaintenanceLoading(false);
                      }} data-testid="scan-system-btn">
                      {maintenanceLoading ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.scanning || 'Đang quét...'}</span>
                      ) : (t.startScan || 'Bắt đầu quét')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Preview Results */}
              {maintenancePreview && (
                <>
                  {/* Old Orders Card */}
                  <Card className="border-0 shadow-sm" data-testid="preview-old-orders">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-red-500" />
                          {t.oldOrders || 'Đơn hàng cũ'} ({'>'}1 {t.year || 'năm'})
                        </CardTitle>
                        <span className="text-2xl font-bold text-red-500">{maintenancePreview.old_orders.total}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {maintenancePreview.old_orders.total === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 py-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {t.noOldOrders || 'Không có đơn hàng cũ hơn 1 năm'}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 mb-4">
                            {maintenancePreview.old_orders.by_shop.map(s => (
                              <div key={s.shop_id} className="flex items-center justify-between py-2 px-3 bg-[#FFF7ED] rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                  <span className="font-medium text-[#0F172A]">{s.shop_name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[#64748B]">
                                  <span className="font-bold text-orange-600">{s.count} {t.orders?.toLowerCase?.() || 'đơn'}</span>
                                  <span className="text-xs">{t.oldest || 'Cũ nhất'}: {s.oldest ? new Date(s.oldest).toLocaleDateString('vi-VN') : '-'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {showMaintenanceConfirm === 'orders' ? (
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                              <p className="text-sm text-red-700 flex-1">{t.confirmDeleteOrders || `Bạn có chắc muốn xóa ${maintenancePreview.old_orders.total} đơn hàng cũ? Hành động này không thể hoàn tác.`}</p>
                              <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => setShowMaintenanceConfirm(null)}>{t.cancel}</Button>
                                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" disabled={maintenanceLoading}
                                  onClick={async () => {
                                    setMaintenanceLoading(true);
                                    try {
                                      const res = await axios.post(`${API}/admin/maintenance/cleanup-orders`);
                                      setMaintenanceResults(prev => [...prev, { type: 'orders', ...res.data }]);
                                      toast.success(res.data.message);
                                      setShowMaintenanceConfirm(null);
                                      const preview = await axios.get(`${API}/admin/maintenance/preview`);
                                      setMaintenancePreview(preview.data);
                                    } catch { toast.error('Error'); }
                                    setMaintenanceLoading(false);
                                  }} data-testid="confirm-delete-orders-btn">
                                  {maintenanceLoading ? '...' : (t.confirmDelete || 'Xác nhận xóa')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => setShowMaintenanceConfirm('orders')} data-testid="delete-old-orders-btn">
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t.deleteOldOrders || 'Xóa đơn hàng cũ'}
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Orphaned Images Card */}
                  <Card className="border-0 shadow-sm" data-testid="preview-orphaned-images">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Image className="w-4 h-4 text-purple-500" />
                          {t.orphanedImages || 'Hình ảnh không sử dụng'}
                        </CardTitle>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-purple-500">{maintenancePreview.orphaned_images.total}</span>
                          <span className="text-xs text-[#94A3B8] ml-2">({(maintenancePreview.orphaned_images.total_size_kb / 1024).toFixed(2)} MB)</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {maintenancePreview.orphaned_images.total === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 py-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {t.noOrphanedImages || 'Không có hình ảnh không sử dụng'}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1.5 mb-4">
                            {maintenancePreview.orphaned_images.items.map((img, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-[#FAF5FF] rounded-lg text-sm">
                                <div className="flex items-center gap-2">
                                  <Image className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="font-mono text-xs text-[#334155]">{img.url}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[#64748B] text-xs">
                                  <span>{img.size_kb} KB</span>
                                  <span>{new Date(img.uploaded_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {showMaintenanceConfirm === 'images' ? (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <AlertTriangle className="w-5 h-5 text-purple-500 shrink-0" />
                              <p className="text-sm text-purple-700 flex-1">{t.confirmDeleteImages || `Bạn có chắc muốn xóa ${maintenancePreview.orphaned_images.total} hình ảnh? Hành động này không thể hoàn tác.`}</p>
                              <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => setShowMaintenanceConfirm(null)}>{t.cancel}</Button>
                                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white" disabled={maintenanceLoading}
                                  onClick={async () => {
                                    setMaintenanceLoading(true);
                                    try {
                                      const res = await axios.post(`${API}/admin/maintenance/cleanup-images`);
                                      setMaintenanceResults(prev => [...prev, { type: 'images', ...res.data }]);
                                      toast.success(res.data.message);
                                      setShowMaintenanceConfirm(null);
                                      const preview = await axios.get(`${API}/admin/maintenance/preview`);
                                      setMaintenancePreview(preview.data);
                                    } catch { toast.error('Error'); }
                                    setMaintenanceLoading(false);
                                  }} data-testid="confirm-delete-images-btn">
                                  {maintenanceLoading ? '...' : (t.confirmDelete || 'Xác nhận xóa')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="border-purple-300 text-purple-600 hover:bg-purple-50"
                              onClick={() => setShowMaintenanceConfirm('images')} data-testid="delete-orphaned-images-btn">
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t.deleteOrphanedImages || 'Xóa hình ảnh'}
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Results log */}
                  {maintenanceResults.length > 0 && (
                    <Card className="border-0 shadow-sm border-l-4 border-l-green-500" data-testid="maintenance-results">
                      <CardContent className="p-4">
                        <h4 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t.completedActions || 'Hoàn tất'}</h4>
                        <div className="space-y-1.5">
                          {maintenanceResults.map((r, idx) => (
                            <div key={idx} className="text-sm text-[#64748B] flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              <span>{r.message}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Rescan button */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { setMaintenancePreview(null); setMaintenanceResults([]); setShowMaintenanceConfirm(null); }} data-testid="rescan-btn">
                      {t.rescan || 'Quét lại'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6" data-testid="settings-tab">
              <Card className="border-0 shadow-sm max-w-lg">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#0055FF]" />
                    {t.changePassword || 'Đổi mật khẩu'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1">{t.currentPassword || 'Mật khẩu hiện tại'}</label>
                      <Input type="password" value={changePasswordData.current_password}
                        onChange={(e) => setChangePasswordData({ ...changePasswordData, current_password: e.target.value })}
                        required placeholder="••••••••" data-testid="current-password-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1">{t.newPassword || 'Mật khẩu mới'}</label>
                      <Input type="password" value={changePasswordData.new_password}
                        onChange={(e) => setChangePasswordData({ ...changePasswordData, new_password: e.target.value })}
                        required minLength={6} placeholder="Ít nhất 6 ký tự" data-testid="new-password-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#334155] mb-1">{t.confirmPassword || 'Xác nhận mật khẩu mới'}</label>
                      <Input type="password" value={changePasswordData.confirm_password}
                        onChange={(e) => setChangePasswordData({ ...changePasswordData, confirm_password: e.target.value })}
                        required minLength={6} placeholder="Nhập lại mật khẩu mới" data-testid="confirm-password-input" />
                    </div>
                    <Button type="submit" className="bg-[#0055FF] hover:bg-[#0040CC] w-full" disabled={changingPassword} data-testid="change-password-btn">
                      {changingPassword ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t.saving || 'Đang lưu...'}</span>
                      ) : (t.changePassword || 'Đổi mật khẩu')}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm max-w-lg">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#64748B]" />
                    {t.accountInfo || 'Thông tin tài khoản'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">Email</span>
                      <span className="font-medium text-[#0F172A]" data-testid="admin-email">{user?.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">{t.role || 'Vai trò'}</span>
                      <span className="font-medium text-[#0F172A]">Super Admin</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Create Shop Owner Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="create-owner-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{t.createShopOwner}</DialogTitle>
            <DialogDescription className="sr-only">{t.createShopOwner}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOwner} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.name}</label>
              <Input value={newOwner.name} onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })} required data-testid="input-name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.email}</label>
              <Input type="email" value={newOwner.email} onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })} required data-testid="input-email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.password}</label>
              <Input type="password" value={newOwner.password} onChange={(e) => setNewOwner({ ...newOwner, password: e.target.value })} required data-testid="input-password" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.shopName}</label>
              <Input value={newOwner.shop_name} onChange={(e) => setNewOwner({ ...newOwner, shop_name: e.target.value })} required data-testid="input-shop-name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <Input type="tel" value={newOwner.phone} onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })} placeholder="0912 345 678" data-testid="input-phone" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="send-email-toggle">
              <input type="checkbox" checked={newOwner.send_email} onChange={(e) => setNewOwner({ ...newOwner, send_email: e.target.checked })} className="w-4 h-4 rounded border-[#CBD5E1] accent-[#0055FF]" />
              <Send className="w-4 h-4 text-[#64748B]" />
              <span className="text-sm text-[#334155]">Gửi email thông tin đăng nhập</span>
            </label>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" data-testid="submit-create">
                {t.create}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto" data-testid="bulk-create-modal">
          <DialogHeader>
            <DialogTitle>Tạo chủ cửa hàng hàng loạt</DialogTitle>
            <DialogDescription>Mỗi dòng 1 user. Mật khẩu mặc định: iLoveProID@</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium mb-1">Định dạng: <code className="text-[#0055FF]">Tên, Email, Tên cửa hàng, SĐT (tùy chọn)</code></label>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                className="w-full h-40 border rounded-lg p-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20"
                placeholder={"Nguyễn Văn A, a@email.com, Shop A, 0912345678\nTrần Thị B, b@email.com, Shop B\n# Dòng bắt đầu bằng # sẽ bị bỏ qua"}
                data-testid="bulk-textarea" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={bulkSendEmail} onChange={(e) => setBulkSendEmail(e.target.checked)} className="w-4 h-4 rounded border-[#CBD5E1] accent-[#0055FF]" />
              <Send className="w-4 h-4 text-[#64748B]" />
              <span className="text-sm text-[#334155]">Gửi email thông tin đăng nhập</span>
            </label>
            {bulkResults.length > 0 && (
              <div className="space-y-2">
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto text-xs space-y-1" data-testid="bulk-results">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`flex items-start gap-2 ${r.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{r.status === 'ok' ? '✓' : '✗'}</span>
                      <span>{r.msg}</span>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" className="w-full text-sm" onClick={() => {
                  const successLines = bulkResults.filter(r => r.status === 'ok');
                  const header = 'Tên,Email,Mật khẩu,Tên cửa hàng,SĐT';
                  const rows = successLines.map(r => {
                    const parts = r.line.split(',').map(p => p.trim());
                    return `${parts[0]},${parts[1]},iLoveProID@,${parts[2]},${parts[3] || ''}`;
                  });
                  const csv = [header, ...rows].join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'users_created.csv'; a.click();
                  URL.revokeObjectURL(url);
                }} data-testid="bulk-download-btn">
                  <Download className="w-4 h-4 mr-2" /> Tải danh sách ({bulkResults.filter(r => r.status === 'ok').length} users)
                </Button>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBulkModal(false)}>{t.cancel}</Button>
              <Button type="button" className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" onClick={handleBulkCreate} disabled={bulkCreating} data-testid="bulk-submit-btn">
                {bulkCreating ? 'Đang tạo...' : `Tạo (${bulkText.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length} users)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
