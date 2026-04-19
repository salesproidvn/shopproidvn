import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatApiErrorDetail } from '../utils/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Store, ShoppingCart, BarChart3, Globe, Shield, Smartphone, ArrowRight, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LoginPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset' | '2fa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [twoFAPending, setTwoFAPending] = useState(null); // { pending_token, email }
  const [twoFACode, setTwoFACode] = useState('');
  const [showRecover, setShowRecover] = useState(false);
  const { login, register, user, verify2FA } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user) {
    if (user.role === 'super_admin' || user.role === 'sub_admin') { navigate('/admin'); return null; }
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result?.requires_2fa) {
          setTwoFAPending({ pending_token: result.pending_token, email: result.email });
          setMode('2fa');
        } else if (result?.redirectTo) {
          navigate(result.redirectTo);
        }
      } else if (mode === 'register') {
        await register(email, password, name);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
      if (data.reset_token) {
        setResetToken(data.reset_token);
        setMode('reset');
        setSuccessMessage('Reset token generated. Enter your new password below.');
      } else {
        setSuccessMessage(data.message || 'If this email exists, a reset link has been sent.');
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || 'Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, { token: resetToken, new_password: newPassword });
      setSuccessMessage(data.message || 'Password reset successfully!');
      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
        setResetToken('');
        setNewPassword('');
      }, 2000);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider} login coming soon`);
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!twoFACode.trim()) return;
    setLoading(true);
    try {
      const result = await verify2FA(twoFAPending.pending_token, twoFACode.trim());
      if (result?.redirectTo) navigate(result.redirectTo);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover2FA = async () => {
    if (!twoFAPending?.email) return;
    setLoading(true);
    try {
      await axios.post(`${API}/auth/2fa/recover-start`, { email: twoFAPending.email });
      setSuccessMessage('Nếu email này tồn tại và đã bật 2FA, một link khôi phục đã được gửi. Kiểm tra hộp thư.');
      setShowRecover(false);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    { icon: Store, text: 'Quản lý gian hàng toàn diện' },
    { icon: ShoppingCart, text: 'Hệ thống đặt hàng thông minh' },
    { icon: BarChart3, text: 'Phân tích doanh thu realtime' },
    { icon: Globe, text: 'Tên miền riêng & SSL miễn phí' },
    { icon: Smartphone, text: 'Tối ưu mọi thiết bị' },
    { icon: Shield, text: 'Bảo mật & bảo hành trọn đời' },
  ];

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#1A0A0A]">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#CC0000]/20 via-transparent to-[#FF4444]/10" />
          <div className="absolute top-[15%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#CC0000]/8 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-[#FF4444]/8 blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo - removed */}

          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-5">
              Nền tảng thương mại
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2020] to-[#FF6B6B]">điện tử thông minh</span>
            </h1>
            <p className="text-[#C49A9A] text-sm leading-relaxed mb-10">
              Giải pháp tạo website bán hàng chuyên nghiệp, tự chủ nội dung 100%, tối ưu cho mọi doanh nghiệp Việt Nam.
            </p>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#CC0000]/20 group-hover:border-[#CC0000]/30 transition-all">
                    <h.icon className="w-4 h-4 text-[#FF6B6B]" />
                  </div>
                  <span className="text-xs text-[#C49A9A] leading-snug">{h.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-10">
            {[{ val: '500+', label: 'Khách hàng' }, { val: '50+', label: 'Dự án' }, { val: '24/7', label: 'Hỗ trợ' }].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-extrabold text-white">{s.val}</p>
                <p className="text-[10px] text-[#8B6464] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center p-5 border-b border-[#E2E8F0]">
          <img src="/proid-logo.png" alt="Pro ID" className="h-9 w-auto" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            {/* ===== 2FA VERIFY MODE ===== */}
            {mode === '2fa' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight" data-testid="twofa-title">
                    Xác thực hai bước
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1.5">
                    Nhập mã 6 số từ ứng dụng xác thực (Google Authenticator / Authy) cho <b>{twoFAPending?.email}</b>
                  </p>
                </div>
                <form onSubmit={handle2FASubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="twofa-code" className="text-xs font-medium text-[#334155]">Mã xác thực</Label>
                    <Input id="twofa-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                      value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)}
                      required autoFocus maxLength={16}
                      className="h-12 rounded-xl bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white text-center text-lg tracking-widest font-mono"
                      placeholder="123456" data-testid="twofa-code-input" />
                    <p className="text-[11px] text-[#94A3B8]">Có thể dùng mã backup (ví dụ: ABCD-1234)</p>
                  </div>
                  {error && <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100" data-testid="twofa-error">{error}</div>}
                  {successMessage && <div className="text-green-700 text-xs bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{successMessage}</div>}
                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-[#CC0000] to-[#FF4444] hover:opacity-90 rounded-xl text-sm font-semibold shadow-lg shadow-[#CC0000]/20" disabled={loading} data-testid="twofa-submit-button">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4 mr-2" /> Xác nhận</>}
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button type="button" onClick={() => { setMode('login'); setTwoFAPending(null); setTwoFACode(''); setError(''); }} className="text-[#64748B] hover:underline" data-testid="twofa-back-btn">
                      Đăng nhập lại
                    </button>
                    {!showRecover ? (
                      <button type="button" onClick={() => setShowRecover(true)} className="text-[#CC0000] font-medium hover:underline" data-testid="twofa-lost-btn">
                        Mất thiết bị?
                      </button>
                    ) : (
                      <button type="button" onClick={handleRecover2FA} disabled={loading} className="text-[#CC0000] font-medium hover:underline" data-testid="twofa-recover-btn">
                        Gửi link khôi phục
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}

            {/* ===== FORGOT PASSWORD MODE ===== */}
            {mode === 'forgot' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight" data-testid="forgot-password-title">
                    Quên mật khẩu
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1.5">
                    Nhập email của bạn để nhận link đặt lại mật khẩu
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-xs font-medium text-[#334155]">Email</Label>
                    <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required className="h-11 rounded-xl bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white text-sm" placeholder="email@example.com" data-testid="forgot-email-input" />
                  </div>

                  {error && <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100" data-testid="forgot-error">{error}</div>}
                  {successMessage && <div className="text-green-700 text-xs bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2" data-testid="forgot-success"><CheckCircle className="w-4 h-4" />{successMessage}</div>}

                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-[#CC0000] to-[#FF4444] hover:opacity-90 rounded-xl text-sm font-semibold shadow-lg shadow-[#CC0000]/20" disabled={loading} data-testid="forgot-submit-button">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" /> Gửi yêu cầu đặt lại</>}
                  </Button>

                  <p className="text-center text-sm text-[#64748B]">
                    <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }} className="text-[#CC0000] font-semibold hover:underline" data-testid="back-to-login">
                      Quay lại đăng nhập
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ===== RESET PASSWORD MODE ===== */}
            {mode === 'reset' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight" data-testid="reset-password-title">
                    Đặt lại mật khẩu
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1.5">
                    Nhập mật khẩu mới cho tài khoản của bạn
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-medium text-[#334155]">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input id="new-password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        required minLength={6} className="h-11 rounded-xl bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white text-sm pr-10" placeholder="Nhập mật khẩu mới" data-testid="new-password-input" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100" data-testid="reset-error">{error}</div>}
                  {successMessage && <div className="text-green-700 text-xs bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2" data-testid="reset-success"><CheckCircle className="w-4 h-4" />{successMessage}</div>}

                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-[#CC0000] to-[#FF4444] hover:opacity-90 rounded-xl text-sm font-semibold shadow-lg shadow-[#CC0000]/20" disabled={loading} data-testid="reset-submit-button">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4 mr-2" /> Đặt lại mật khẩu</>}
                  </Button>
                </form>
              </>
            )}

            {/* ===== LOGIN / REGISTER MODE ===== */}
            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="mb-8">
                  <img src="/proid-logo.png" alt="Pro ID" className="h-12 w-auto mb-5 hidden lg:block" data-testid="login-logo" />
                  <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight" data-testid="login-title">
                    {mode === 'login' ? t.login : t.register}
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1.5">
                    {mode === 'login' ? t.loginToManage : t.createAccount}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-[#334155]">{t.name}</Label>
                      <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                        required={mode === 'register'} className="h-11 rounded-xl bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white text-sm" placeholder="Nguyen Van A" data-testid="name-input" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-[#334155]">{t.email}</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required className="h-11 rounded-xl bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white text-sm" placeholder="email@example.com" data-testid="email-input" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs font-medium text-[#334155]">{t.password}</Label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMessage(''); }} className="text-[11px] text-[#CC0000] font-medium hover:underline" data-testid="forgot-password-link">
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        required className="h-11 rounded-xl bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white text-sm pr-10" placeholder="••••••••" data-testid="password-input" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100" data-testid="auth-error">{error}</div>
                  )}

                  {mode === 'login' && (
                    <button type="button" onClick={() => { setPassword('iLoveProID@'); }}
                      className="w-full h-9 rounded-xl border border-dashed border-[#CBD5E1] text-xs font-medium text-[#64748B] hover:border-[#CC0000] hover:text-[#CC0000] hover:bg-[#FFF5F5] transition-all"
                      data-testid="demo-autofill-btn">
                      Autofill Password
                    </button>
                  )}

                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-[#CC0000] to-[#FF4444] hover:opacity-90 rounded-xl text-sm font-semibold shadow-lg shadow-[#CC0000]/20" disabled={loading} data-testid="auth-submit-button">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>{mode === 'login' ? t.login : t.register} <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>

                  <p className="text-center text-sm text-[#64748B]">
                    {mode === 'login' ? (
                      <>{t.noAccount}{' '}<button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-[#CC0000] font-semibold hover:underline" data-testid="switch-to-register">{t.registerNow}</button></>
                    ) : (
                      <>{t.hasAccount}{' '}<button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[#CC0000] font-semibold hover:underline" data-testid="switch-to-login">{t.login}</button></>
                    )}
                  </p>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="p-5 text-center border-t border-[#E2E8F0]">
          <p className="text-[11px] text-[#94A3B8]">&copy; 2026 Pro ID Shop. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
