import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  LayoutDashboard, Store, Users, Package, ShoppingCart, 
  Settings, LogOut, Menu, X, TrendingUp, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SuperAdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Create shop owner modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOwner, setNewOwner] = useState({ email: '', password: '', name: '', shop_name: '' });

  useEffect(() => {
    if (authLoading) return; // Wait for auth check
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
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/shops`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setShops(shopsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/users/${userId}/block`, {}, { withCredentials: true });
      toast.success('User status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will delete the user and their shop.')) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      toast.success('User deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/users`, newOwner, { withCredentials: true });
      toast.success('Shop owner created');
      setShowCreateModal(false);
      setNewOwner({ email: '', password: '', name: '', shop_name: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create');
    }
  };

  const handleShopStatus = async (shopId, status) => {
    try {
      await axios.post(`${API}/admin/shops/${shopId}/status?status=${status}`, {}, { withCredentials: true });
      toast.success('Shop status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update shop');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'shops', label: 'Shops', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
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
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white transition-all z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <span className="font-bold text-lg">Admin Panel</span>}
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-3 hover:bg-white/10 text-red-400"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all ${sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0F172A]">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'shops' && 'Shop Management'}
              {activeTab === 'users' && 'User Management'}
            </h1>
            <p className="text-[#64748B] mt-1">Welcome back, {user?.name}</p>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-sm" data-testid="stat-shops">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">Total Shops</CardTitle>
                  <Store className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{stats.total_shops}</div>
                  <p className="text-xs text-green-500 mt-1">{stats.active_shops} active</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm" data-testid="stat-owners">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">Shop Owners</CardTitle>
                  <Users className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{stats.total_shop_owners}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm" data-testid="stat-orders">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">Total Orders</CardTitle>
                  <ShoppingCart className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{stats.total_orders}</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm" data-testid="stat-revenue">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748B]">Total Revenue</CardTitle>
                  <TrendingUp className="w-5 h-5 text-[#0055FF]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#0F172A]">{formatVND(stats.total_revenue)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shops Tab */}
          {activeTab === 'shops' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>All Shops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="shops-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">Shop Name</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">Owner</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">Orders</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-[#64748B]">Actions</th>
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
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {shop.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShopStatus(shop.id, shop.status === 'active' ? 'suspended' : 'active')}
                              data-testid={`toggle-shop-${shop.id}`}
                            >
                              {shop.status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
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
                <Button 
                  onClick={() => setShowCreateModal(true)} 
                  className="bg-[#0055FF] hover:bg-[#0040CC]"
                  data-testid="create-owner-btn"
                >
                  + Create Shop Owner
                </Button>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="users-table">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Shop</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-[#64748B]">Actions</th>
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
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleBlockUser(u.id)} data-testid={`block-user-${u.id}`}>
                                    {u.status === 'blocked' ? 'Unblock' : 'Block'}
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.id)} data-testid={`delete-user-${u.id}`}>
                                    Delete
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md" data-testid="create-owner-modal">
            <h2 className="text-2xl font-bold mb-6">Create Shop Owner</h2>
            <form onSubmit={handleCreateOwner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newOwner.name}
                  onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                  data-testid="input-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newOwner.email}
                  onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={newOwner.password}
                  onChange={(e) => setNewOwner({ ...newOwner, password: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                  data-testid="input-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shop Name</label>
                <input
                  type="text"
                  value={newOwner.shop_name}
                  onChange={(e) => setNewOwner({ ...newOwner, shop_name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                  data-testid="input-shop-name"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" data-testid="submit-create">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
