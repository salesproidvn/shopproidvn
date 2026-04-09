import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';

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

const AuthModal = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { t } = useLanguage();

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

  const handleSocialLogin = (provider) => {
    // Social login not yet implemented with backend
    setError(`${provider} login coming soon`);
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
            {mode === 'login' ? t.login : t.register}
          </DialogTitle>
          <DialogDescription className="text-center text-[#64748B]">
            {mode === 'login' ? t.loginToManage : t.createAccount}
          </DialogDescription>
        </DialogHeader>

        {/* Social Login Buttons */}
        <div className="space-y-3 mt-2">
          <Button variant="outline" className="w-full rounded-full py-5 text-sm font-medium" onClick={() => handleSocialLogin('google')} data-testid="google-login-btn">
            <GoogleIcon />
            <span className="ml-3">{t.continueWithGoogle}</span>
          </Button>
          <Button variant="outline" className="w-full rounded-full py-5 text-sm font-medium" onClick={() => handleSocialLogin('facebook')} data-testid="facebook-login-btn">
            <FacebookIcon />
            <span className="ml-3">{t.continueWithFacebook}</span>
          </Button>
        </div>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-[#94A3B8]">{t.orLoginWith}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                required={mode === 'register'} data-testid="name-input" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required data-testid="email-input" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required data-testid="password-input" />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg" data-testid="auth-error">{error}</div>
          )}

          <Button type="submit" className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-full py-6" disabled={loading} data-testid="auth-submit-button">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? t.login : t.register}
          </Button>

          <div className="text-center text-sm text-[#64748B]">
            {mode === 'login' ? (
              <>
                {t.noAccount}{' '}
                <button type="button" onClick={switchMode} className="text-[#0055FF] font-medium hover:underline" data-testid="switch-to-register">
                  {t.registerNow}
                </button>
              </>
            ) : (
              <>
                {t.hasAccount}{' '}
                <button type="button" onClick={switchMode} className="text-[#0055FF] font-medium hover:underline" data-testid="switch-to-login">
                  {t.login}
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
