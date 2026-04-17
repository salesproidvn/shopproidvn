import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  LogOut, TrendingUp, ShoppingCart, Copy, ExternalLink, Users, Award
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      navigate('/');
      return;
    }
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get(`${API}/agent/dashboard`);
      setDashData(data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!dashData) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">No data available</p></div>;

  const { agent, shop, sales, total_sales, total_orders, parent_info } = dashData;
  const themeColor = shop?.theme_color || '#0055FF';
  const refLink = `${window.location.origin}/shop/${shop?.slug}?ref=${agent.tracking_code}`;

  const levelLabels = { 1: t.agentLevel1 || 'Cấp 1', 2: t.agentLevel2 || 'Cấp 2', 3: t.agentLevel3 || 'Cấp 3' };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop?.logo_url && <img src={shop.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
            <div>
              <h1 className="font-bold text-[#0F172A] text-sm">{shop?.name}</h1>
              <p className="text-[10px] text-[#94A3B8]">{agent.name} - {levelLabels[agent.level]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(`/shop/${shop?.slug}`, '_blank')} data-testid="view-shop-btn">
              <ExternalLink className="w-3 h-3 mr-1" /> {t.viewShop || 'Xem shop'}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-red-500" onClick={() => { logout(); navigate('/'); }} data-testid="agent-logout-btn">
              <LogOut className="w-3 h-3 mr-1" /> {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#64748B]">{t.totalSales}</p>
                <TrendingUp className="w-4 h-4" style={{ color: themeColor }} />
              </div>
              <p className="text-xl font-bold" style={{ color: themeColor }} data-testid="agent-total-sales">{formatVND(total_sales)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#64748B]">{t.orderCount}</p>
                <ShoppingCart className="w-4 h-4 text-[#64748B]" />
              </div>
              <p className="text-xl font-bold text-[#0F172A]" data-testid="agent-total-orders">{total_orders}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#64748B]">{t.agentLevel}</p>
                <Award className="w-4 h-4 text-[#64748B]" />
              </div>
              <p className="text-xl font-bold text-[#0F172A]">{levelLabels[agent.level]}</p>
            </CardContent>
          </Card>
          {parent_info && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[#64748B]">{t.myLeader}</p>
                  <Users className="w-4 h-4 text-[#64748B]" />
                </div>
                <p className="text-sm font-bold text-[#0F172A]" data-testid="agent-parent-info">{parent_info.name}</p>
                <p className="text-[10px] text-[#94A3B8]">{levelLabels[parent_info.level]}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Referral Link */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-[#0F172A] mb-2">{t.trackingLink}</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#F1F5F9] px-3 py-2 rounded text-xs font-mono text-[#334155] truncate" data-testid="agent-ref-link">{refLink}</code>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(refLink); toast.success(t.linkCopied || 'Copied!'); }} data-testid="copy-ref-link-btn">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-1">{t.trackingCode}: <span className="font-mono">{agent.tracking_code}</span></p>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">{t.orders || 'Đơn hàng'} ({total_orders})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {sales.length === 0 ? (
              <p className="text-center py-8 text-[#94A3B8] text-sm">{t.noOrders || 'Chưa có đơn hàng nào'}</p>
            ) : (
              <div className="space-y-2">
                {sales.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{s.order_id}</p>
                      <p className="text-[10px] text-[#94A3B8]">{new Date(s.created_at).toLocaleDateString('vi-VN')} {new Date(s.created_at).toLocaleTimeString('vi-VN')}</p>
                    </div>
                    <span className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(s.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AgentDashboard;
