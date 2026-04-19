import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { 
  LayoutDashboard, Store, Users, ShoppingCart, 
  LogOut, Menu, X, TrendingUp, CalendarClock, Eye, Phone, Mail, Globe, Wrench, Trash2, Image, AlertTriangle, CheckCircle2, Settings, Lock, Copy, MoreHorizontal, Send, Download, Shield, Activity, ShieldAlert, ShieldCheck, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorAuthCard from '../components/TwoFactorAuthCard';
import DatabaseBackupCard from '../components/DatabaseBackupCard';

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
  // Security dashboard state
  const [securityData, setSecurityData] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  // Edit user modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', shop_name: '' });

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

  const fetchSecurityData = async () => {
    try {
      setSecurityLoading(true);
      const res = await axios.get(`${API}/admin/security/dashboard`);
      setSecurityData(res.data);
    } catch (err) {
      console.error('Failed to load security data');
    } finally {
      setSecurityLoading(false);
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
    try {
      await axios.post(`${API}/admin/users/${userId}/reset-password`, {});
      toast.success('Đã đặt lại mật khẩu thành: iLoveProID@');
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

  const handleEditUser = async () => {
    try {
      await axios.put(`${API}/admin/users/${editingUser.id}`, editForm);
      toast.success('Cập nhật thành công');
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u, name: editForm.name || u.name, email: editForm.email || u.email, phone: editForm.phone,
        shop: u.shop ? { ...u.shop, name: editForm.shop_name || u.shop.name } : null,
        shop_name: editForm.shop_name || u.shop_name,
      } : u));
      setEditingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cập nhật thất bại');
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
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, expiry_date: expiryDate || '' } : s));
      setUsers(prev => prev.map(u => u.shop?.id === shopId ? { ...u, shop: { ...u.shop, expiry_date: expiryDate || '' } } : u));
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleSetLimits = async (shopId, field, value) => {
    try {
      await axios.put(`${API}/admin/shops/${shopId}/limits`, { [field]: parseInt(value) || 0 });
      toast.success(t.limitsUpdated);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, [field]: parseInt(value) || 0 } : s));
      setUsers(prev => prev.map(u => u.shop?.id === shopId ? { ...u, shop: { ...u.shop, [field]: parseInt(value) || 0 } } : u));
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
    { id: 'users', label: t.userManagement, icon: Users },
    ...(isSuperAdmin ? [{ id: 'security', label: 'Bảo mật', icon: Shield }] : []),
    ...(isSuperAdmin ? [{ id: 'maintenance', label: t.maintenance || 'Bảo trì', icon: Wrench }] : []),
    { id: 'settings', label: t.settings || 'Cài đặt', icon: Settings },
  ];

  if (authLoading) {
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
                  {activeTab === 'users' && t.userManagement}
                  {activeTab === 'security' && 'Bảo mật hệ thống'}
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
          {activeTab === 'overview' && loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1,2,3,4].map(i => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="h-4 w-24 bg-[#E2E8F0] rounded animate-pulse" />
                    <div className="h-5 w-5 bg-[#E2E8F0] rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-20 bg-[#E2E8F0] rounded animate-pulse mb-2" />
                    <div className="h-3 w-32 bg-[#F1F5F9] rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {activeTab === 'overview' && !loading && stats && (
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

          {/* Users & Shops Merged Tab */}
          {activeTab === 'users' && loading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-28 bg-[#F1F5F9] rounded-xl animate-pulse" />
                ))}
              </CardContent>
            </Card>
          )}
          {activeTab === 'users' && !loading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Tìm theo tên, email, cửa hàng..." className="max-w-xs text-sm" data-testid="user-search-input" />
                <div className="flex gap-2">
                  {isSuperAdmin && <Button variant="outline" onClick={() => { setShowBulkModal(true); setBulkResults([]); setBulkText(''); }} data-testid="bulk-create-btn">
                    Tạo hàng loạt
                  </Button>}
                  {isSuperAdmin && <Button onClick={() => setShowCreateModal(true)} className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="create-owner-btn">
                    + {t.createShopOwner}
                  </Button>}
                </div>
              </div>

              <div className="space-y-4">
                {users.filter(u => {
                  if (!userSearch.trim()) return true;
                  const q = userSearch.toLowerCase();
                  return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.shop_name || '').toLowerCase().includes(q);
                }).map((u) => (
                  <Card key={u.id} className="border-0 shadow-sm" data-testid={`user-card-${u.id}`}>
                    <CardContent className="p-4">
                      {/* User Info Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: u.shop?.theme_color || '#64748B' }}>
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F172A]">{u.name}</div>
                            <div className="text-xs text-[#94A3B8]">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'sub_admin' ? 'bg-indigo-100 text-indigo-700' : u.role === 'shop_owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.status}
                          </span>
                          {u.role !== 'super_admin' && u.role !== 'sub_admin' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`user-actions-${u.id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white w-48">
                                <DropdownMenuItem onClick={() => {
                                  setEditingUser(u);
                                  setEditForm({ name: u.name, email: u.email, phone: u.phone || '', shop_name: u.shop?.name || '' });
                                }} data-testid={`edit-user-${u.id}`} className="cursor-pointer">
                                  <Settings className="w-4 h-4 mr-2" /> Chỉnh sửa thông tin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  const info = `Email: ${u.email}\nMật khẩu: iLoveProID@`;
                                  try { await navigator.clipboard.writeText(info); toast.success('Đã copy thông tin đăng nhập'); }
                                  catch { const ta = document.createElement('textarea'); ta.value = info; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('Đã copy thông tin đăng nhập'); }
                                }} data-testid={`copy-login-${u.id}`} className="cursor-pointer">
                                  <Copy className="w-4 h-4 mr-2" /> Copy đăng nhập
                                </DropdownMenuItem>
                                {u.shop_slug && (
                                  <DropdownMenuItem onClick={() => window.open(`/shop/${u.shop_slug}`, '_blank')} data-testid={`view-storefront-${u.id}`} className="cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2" /> Xem cửa hàng
                                  </DropdownMenuItem>
                                )}
                                {u.shop_slug && (
                                  <DropdownMenuItem onClick={async () => {
                                    const link = `${window.location.origin}/shop/${u.shop_slug}`;
                                    try { await navigator.clipboard.writeText(link); } catch { const ta = document.createElement('textarea'); ta.value = link; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
                                    toast.success('Đã copy link cửa hàng');
                                  }} data-testid={`copy-shop-link-${u.id}`} className="cursor-pointer">
                                    <Globe className="w-4 h-4 mr-2" /> Copy link shop
                                  </DropdownMenuItem>
                                )}
                                {u.shop_id && (
                                  <DropdownMenuItem onClick={() => window.open(`/dashboard?shop=${u.shop_id}`, '_blank')} data-testid={`manage-shop-${u.id}`} className="cursor-pointer">
                                    <Store className="w-4 h-4 mr-2" /> Quản lý shop
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={async () => {
                                  try { await axios.post(`${API}/admin/users/${u.id}/send-login-email`); toast.success(`Đã gửi email đến ${u.email}`); }
                                  catch (err) { toast.error(err.response?.data?.detail || 'Gửi email thất bại'); }
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
                        </div>
                      </div>

                      {/* Shop Info (if user has a shop) */}
                      {u.shop && (
                        <div className="border-t border-[#F1F5F9] pt-3 mt-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Store className="w-4 h-4 text-[#64748B]" />
                            <span className="text-sm font-semibold text-[#0F172A]">{u.shop.name}</span>
                            <span className="text-xs text-[#94A3B8]">/{u.shop.slug}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.shop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.shop.status}
                            </span>
                            {u.shop.expiry_date && new Date(u.shop.expiry_date) < new Date() && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">{t.expired}</span>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                            {[
                              { label: t.products, value: u.shop.product_count },
                              { label: t.orders, value: u.shop.order_count },
                              { label: t.categories, value: u.shop.category_count },
                            ].map(s => (
                              <div key={s.label} className="bg-[#F8FAFC] rounded-lg p-2 text-center">
                                <div className="text-lg font-bold text-[#0F172A]">{s.value}</div>
                                <div className="text-[10px] text-[#94A3B8] uppercase">{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Limits + Expiry */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                            <div className="flex items-center gap-1.5">
                              <span>Hạn:</span>
                              <input type="date"
                                value={u.shop.expiry_date ? u.shop.expiry_date.split('T')[0] : ''}
                                onChange={(e) => handleSetExpiry(u.shop.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="text-xs border rounded px-2 py-1 w-36"
                                data-testid={`expiry-input-${u.shop.id}`} />
                              {u.shop.expiry_date && (
                                <button onClick={() => handleSetExpiry(u.shop.id, null)} className="text-red-500 hover:text-red-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>SP:</span>
                              <input type="number" min="0" value={u.shop.max_products ?? 100}
                                onChange={(e) => handleSetLimits(u.shop.id, 'max_products', e.target.value)}
                                className="text-xs border rounded px-1 py-0.5 w-14 text-center" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>Bài:</span>
                              <input type="number" min="0" value={u.shop.max_posts ?? 50}
                                onChange={(e) => handleSetLimits(u.shop.id, 'max_posts', e.target.value)}
                                className="text-xs border rounded px-1 py-0.5 w-14 text-center" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>DM:</span>
                              <input type="number" min="0" value={u.shop.max_categories ?? 50}
                                onChange={(e) => handleSetLimits(u.shop.id, 'max_categories', e.target.value)}
                                className="text-xs border rounded px-1 py-0.5 w-14 text-center" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>Trang:</span>
                              <input type="number" min="0" value={u.shop.max_pages ?? 20}
                                onChange={(e) => handleSetLimits(u.shop.id, 'max_pages', e.target.value)}
                                className="text-xs border rounded px-1 py-0.5 w-14 text-center" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>Ảnh:</span>
                              <input type="number" min="0" value={u.shop.max_images ?? 500}
                                onChange={(e) => handleSetLimits(u.shop.id, 'max_images', e.target.value)}
                                className="text-xs border rounded px-1 py-0.5 w-14 text-center" />
                              <span className="text-[10px] text-[#94A3B8]">({u.shop.image_count ?? 0})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>Đại lý:</span>
                              <button
                                onClick={async () => {
                                  try {
                                    const newVal = !u.shop.agents_enabled;
                                    await axios.put(`${API}/admin/shops/${u.shop.id}/agents-toggle`, { agents_enabled: newVal });
                                    setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, shop: {...usr.shop, agents_enabled: newVal}} : usr));
                                    toast.success(newVal ? 'Agents enabled' : 'Agents disabled');
                                  } catch { toast.error('Error'); }
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.shop.agents_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                data-testid={`agents-toggle-${u.shop.id}`}>
                                {u.shop.agents_enabled ? 'ON' : 'OFF'}
                              </button>
                              <input type="number" min="0" value={u.shop.max_agents ?? 100}
                                onChange={(e) => handleSetLimits(u.shop.id, 'max_agents', e.target.value)}
                                className="text-xs border rounded px-1 py-0.5 w-14 text-center" />
                            </div>
                            <button
                              onClick={() => {
                                const newStatus = u.shop.status === 'active' ? 'suspended' : 'active';
                                handleShopStatus(u.shop.id, newStatus);
                                setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, shop: {...usr.shop, status: newStatus}} : usr));
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.shop.status === 'active' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                              {u.shop.status === 'active' ? t.suspend : t.activate}
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
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

          {/* Security Dashboard Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6" data-testid="security-tab">
              {!securityData && !securityLoading && (
                <div className="text-center py-8">
                  <Button onClick={fetchSecurityData} className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="load-security-btn">
                    <Shield className="w-4 h-4 mr-2" /> Tải dữ liệu bảo mật
                  </Button>
                </div>
              )}
              {securityLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
                </div>
              )}
              {securityData && (
                <>
                  {/* Security Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm" data-testid="security-active-ips">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#64748B]">IP đang theo dõi</CardTitle>
                        <Activity className="w-5 h-5 text-[#0055FF]" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-[#0F172A]">{securityData.rate_limiter.active_tracked_ips}</div>
                        <p className="text-xs text-[#94A3B8] mt-1">Active trong 2 phút qua</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm" data-testid="security-blocked-ips">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#64748B]">IP bị chặn</CardTitle>
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-[#0F172A]">{securityData.rate_limiter.total_blocked}</div>
                        <p className="text-xs text-[#94A3B8] mt-1">Đang bị rate limit</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm" data-testid="security-locked-accounts">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#64748B]">Tài khoản bị khóa</CardTitle>
                        <Lock className="w-5 h-5 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-[#0F172A]">{securityData.brute_force.total_locked}</div>
                        <p className="text-xs text-[#94A3B8] mt-1">Brute force protection</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm" data-testid="security-word-limit">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#64748B]">Giới hạn nội dung</CardTitle>
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-[#0F172A]">{securityData.security_config.content_word_limit}</div>
                        <p className="text-xs text-[#94A3B8] mt-1">Từ tối đa / bài viết</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rate Limit Breakdown */}
                  <Card className="border-0 shadow-sm" data-testid="security-rate-breakdown">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#0055FF]" />
                          Rate Limiting
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={fetchSecurityData} className="text-xs" data-testid="refresh-security-btn">
                          <Clock className="w-3 h-3 mr-1" /> Làm mới
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {Object.entries(securityData.rate_limiter.breakdown).map(([key, value]) => (
                          <div key={key} className="bg-[#F8FAFC] rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-[#0F172A]">{value}</div>
                            <div className="text-xs text-[#64748B] mt-1 capitalize">{key}</div>
                            <div className="text-[10px] text-[#94A3B8]">{
                              {auth: `${securityData.security_config.rate_auth}/min`, orders: `${securityData.security_config.rate_orders}/min`, global: `${securityData.security_config.rate_global}/min`, contact: `${securityData.security_config.rate_contact}/5min`, register: `${securityData.security_config.rate_register}/5min`}[key] || ''
                            }</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blocked IPs List */}
                  {Object.keys(securityData.rate_limiter.blocked_ips).length > 0 && (
                    <Card className="border-0 shadow-sm border-l-4 border-l-red-500" data-testid="security-blocked-list">
                      <CardHeader className="p-5 pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                          <ShieldAlert className="w-5 h-5" />
                          IP đang bị chặn
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0">
                        <div className="space-y-2">
                          {Object.entries(securityData.rate_limiter.blocked_ips).map(([ip, remaining]) => (
                            <div key={ip} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2">
                              <span className="font-mono text-sm text-red-700">{ip}</span>
                              <span className="text-xs text-red-500">Còn {Math.ceil(remaining / 60)} phút</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Locked Accounts */}
                  {Object.keys(securityData.brute_force.locked_accounts).length > 0 && (
                    <Card className="border-0 shadow-sm border-l-4 border-l-orange-500" data-testid="security-locked-list">
                      <CardHeader className="p-5 pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                          <Lock className="w-5 h-5" />
                          Tài khoản đang bị khóa (Brute Force)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0">
                        <div className="space-y-2">
                          {Object.entries(securityData.brute_force.locked_accounts).map(([key, attempts]) => (
                            <div key={key} className="flex items-center justify-between bg-orange-50 rounded-lg px-4 py-2">
                              <span className="font-mono text-sm text-orange-700">{key}</span>
                              <span className="text-xs text-orange-500">{attempts} lần thử</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Security Configuration - Editable */}
                  <Card className="border-0 shadow-sm" data-testid="security-config">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                          Cấu hình bảo mật
                        </CardTitle>
                        <Button size="sm" className="bg-[#0055FF] hover:bg-[#0040CC] text-xs" onClick={async () => {
                          try {
                            await axios.put(`${API}/admin/security/config`, securityData.security_config);
                            toast.success('Đã lưu cấu hình bảo mật');
                            fetchSecurityData();
                          } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi'); }
                        }} data-testid="save-security-config">
                          Lưu thay đổi
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-[#334155]">Rate Limits</h4>
                          {[
                            { key: 'rate_global', label: 'Global', unit: 'req/min' },
                            { key: 'rate_auth', label: 'Auth', unit: 'req/min' },
                            { key: 'rate_orders', label: 'Orders', unit: 'req/min' },
                            { key: 'rate_contact', label: 'Contact', unit: 'req/5min' },
                            { key: 'rate_register', label: 'Register', unit: 'req/5min' },
                          ].map(({ key, label, unit }) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="text-[#64748B]">{label}</span>
                              <div className="flex items-center gap-1.5">
                                <input type="number" min="1" value={securityData.security_config[key] ?? ''}
                                  onChange={(e) => setSecurityData({...securityData, security_config: {...securityData.security_config, [key]: parseInt(e.target.value) || 0}})}
                                  className="font-mono text-xs border rounded px-2 py-1 w-16 text-center" />
                                <span className="text-[10px] text-[#94A3B8]">{unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-[#334155]">Bảo vệ</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#64748B]">Brute Force (lần thử)</span>
                            <input type="number" min="1" value={securityData.security_config.brute_force_max ?? ''}
                              onChange={(e) => setSecurityData({...securityData, security_config: {...securityData.security_config, brute_force_max: parseInt(e.target.value) || 0}})}
                              className="font-mono text-xs border rounded px-2 py-1 w-16 text-center" />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#64748B]">Lockout (giây)</span>
                            <input type="number" min="60" value={securityData.security_config.brute_force_window ?? ''}
                              onChange={(e) => setSecurityData({...securityData, security_config: {...securityData.security_config, brute_force_window: parseInt(e.target.value) || 0}})}
                              className="font-mono text-xs border rounded px-2 py-1 w-16 text-center" />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#64748B]">Payload tối đa (MB)</span>
                            <input type="number" min="1" value={securityData.security_config.max_body_mb ?? ''}
                              onChange={(e) => setSecurityData({...securityData, security_config: {...securityData.security_config, max_body_mb: parseInt(e.target.value) || 0}})}
                              className="font-mono text-xs border rounded px-2 py-1 w-16 text-center" />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#64748B]">Giới hạn từ</span>
                            <input type="number" min="100" value={securityData.security_config.content_word_limit ?? ''}
                              onChange={(e) => setSecurityData({...securityData, security_config: {...securityData.security_config, content_word_limit: parseInt(e.target.value) || 0}})}
                              className="font-mono text-xs border rounded px-2 py-1 w-16 text-center" />
                          </div>
                          <h4 className="text-sm font-semibold text-[#334155] pt-2">Security Headers</h4>
                          {["X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection", "Referrer-Policy", "Permissions-Policy"].map((header) => (
                            <div key={header} className="flex items-center gap-2 text-sm">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-mono text-xs text-[#64748B]">{header}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6" data-testid="settings-tab">
              <TwoFactorAuthCard />
              <DatabaseBackupCard />
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

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="edit-user-modal">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Họ tên</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} data-testid="edit-user-name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} data-testid="edit-user-email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Số điện thoại</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} data-testid="edit-user-phone" placeholder="0912345678" />
            </div>
            {editingUser?.shop && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tên cửa hàng</Label>
                <Input value={editForm.shop_name} onChange={(e) => setEditForm({...editForm, shop_name: e.target.value})} data-testid="edit-shop-name" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>Hủy</Button>
              <Button className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" onClick={handleEditUser} data-testid="edit-user-save">Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
