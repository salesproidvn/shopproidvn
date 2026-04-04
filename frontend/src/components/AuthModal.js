import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatApiErrorDetail } from '../utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';

const AuthModal = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </DialogTitle>
          <DialogDescription className="text-center text-[#64748B]">
            {mode === 'login' ? 'Đăng nhập để quản lý cửa hàng' : 'Tạo tài khoản mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nhập họ tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'register'}
                data-testid="name-input"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="password-input"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg" data-testid="auth-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-full py-6"
            disabled={loading}
            data-testid="auth-submit-button"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              'Đăng nhập'
            ) : (
              'Đăng ký'
            )}
          </Button>

          <div className="text-center text-sm text-[#64748B]">
            {mode === 'login' ? (
              <>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-[#0055FF] font-medium hover:underline"
                  data-testid="switch-to-register"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-[#0055FF] font-medium hover:underline"
                  data-testid="switch-to-login"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
