import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ShieldOff, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TwoFARecoverPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Thiếu token'); }
  }, [token]);

  const confirm = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/2fa/recover-complete`, { token });
      setStatus('success');
      setMessage(data.message || 'Đã tắt 2FA');
    } catch (e) {
      setStatus('error');
      setMessage(e.response?.data?.detail || 'Lỗi');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-4" data-testid="2fa-recover-page">
        {status === 'pending' && (
          <>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] mt-3">Khôi phục 2FA</h1>
              <p className="text-sm text-[#64748B] mt-1">
                Bạn chắc chắn muốn <b>tắt xác thực 2 bước</b> cho tài khoản? Sau khi tắt, bạn có thể đăng nhập bằng email + mật khẩu rồi bật lại 2FA.
              </p>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={confirm} disabled={loading || !token} data-testid="confirm-recover-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldOff className="w-4 h-4 mr-2" />}
              Xác nhận tắt 2FA
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Hủy</Button>
          </>
        )}
        {status === 'success' && (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">Thành công</h1>
            <p className="text-sm text-[#64748B]">{message}</p>
            <Button className="w-full" onClick={() => navigate('/')}>Đăng nhập</Button>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">Lỗi</h1>
            <p className="text-sm text-[#64748B]">{message}</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Về trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFARecoverPage;
