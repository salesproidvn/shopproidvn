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
import { 
  LayoutDashboard, Store, Users, ShoppingCart, 
  LogOut, Menu, X, TrendingUp, CalendarClock, Eye
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
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOwner, setNewOwner] = useState({ email: '', password: '', name: '', shop_name: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'super_admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

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
      setNewOwner({ email: '', password: '', name: '', shop_name: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToCreate);
    }
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'shops', label: t.shopManagement, icon: Store },
    { id: 'users', label: t.userManagement, icon: Users },
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
                <CardTitle>{t.allShops}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="shops-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.shopName}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.owner}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.orders}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.products}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.status}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.expiryDate}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.shopLimits}</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shops.map((shop) => (
                        <tr key={shop.id} className="border-b hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-[#0F172A]">{shop.name}</div>
                              <div className="text-sm text-[#64748B]">/{shop.slug}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">{shop.owner?.email || '-'}</td>
                          <td className="py-3 px-4 text-[#0F172A]">{shop.order_count}</td>
                          <td className="py-3 px-4 text-[#0F172A]">{shop.product_count || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {shop.status}
                            </span>
                            {shop.expiry_date && new Date(shop.expiry_date) < new Date() && (
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{t.expired}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={shop.expiry_date ? shop.expiry_date.split('T')[0] : ''}
                                onChange={(e) => handleSetExpiry(shop.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="text-sm border rounded px-2 py-1 w-36"
                                data-testid={`expiry-input-${shop.id}`}
                              />
                              {shop.expiry_date && (
                                <button onClick={() => handleSetExpiry(shop.id, null)} className="text-xs text-red-500 hover:text-red-600">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <label className="text-[10px] text-[#94A3B8] w-12">{t.maxProducts}:</label>
                                <input type="number" min="0" value={shop.max_products ?? 100}
                                  onChange={(e) => handleSetLimits(shop.id, 'max_products', e.target.value)}
                                  className="text-xs border rounded px-1 py-0.5 w-16 text-center"
                                  data-testid={`max-products-${shop.id}`} />
                              </div>
                              <div className="flex items-center gap-1">
                                <label className="text-[10px] text-[#94A3B8] w-12">{t.maxPosts}:</label>
                                <input type="number" min="0" value={shop.max_posts ?? 50}
                                  onChange={(e) => handleSetLimits(shop.id, 'max_posts', e.target.value)}
                                  className="text-xs border rounded px-1 py-0.5 w-16 text-center"
                                  data-testid={`max-posts-${shop.id}`} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 flex-wrap">
                              <Link to={`/dashboard?shop=${shop.id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5" data-testid={`view-shop-${shop.id}`}>
                                  <Eye className="w-3.5 h-3.5" /> {t.viewShop}
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" onClick={() => handleShopStatus(shop.id, shop.status === 'active' ? 'suspended' : 'active')} data-testid={`toggle-shop-${shop.id}`}>
                                {shop.status === 'active' ? t.suspend : t.activate}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setShowCreateModal(true)} className="bg-[#0055FF] hover:bg-[#0040CC]" data-testid="create-owner-btn">
                  + {t.createShopOwner}
                </Button>
              </div>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>{t.allUsers}</CardTitle>
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
                        {users.map((u) => (
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
                              {u.role !== 'super_admin' && (
                                <div className="flex gap-2 flex-wrap">
                                  <Button variant="outline" size="sm" onClick={() => handleBlockUser(u.id)} data-testid={`block-user-${u.id}`}>
                                    {u.status === 'blocked' ? t.unblock : t.block}
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => handleResetPassword(u.id)} data-testid={`reset-pwd-${u.id}`}>
                                    {t.resetPwd}
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.id)} data-testid={`delete-user-${u.id}`}>
                                    {t.delete}
                                  </Button>
                                </div>
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
    </div>
  );
};

export default SuperAdminDashboard;
