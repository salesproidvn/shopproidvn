import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Shield, ShieldCheck, ShieldOff, Copy, Key, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TwoFactorAuthCard = () => {
  const [status, setStatus] = useState(null); // { enabled, backup_codes_remaining, enabled_at }
  const [loading, setLoading] = useState(false);

  // Setup flow
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState(null); // { secret, otpauth_url }
  const [setupCode, setSetupCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);

  // Disable flow
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  // Regenerate backup codes
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenCode, setRegenCode] = useState('');

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/2fa/status`);
      setStatus(data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchStatus(); }, []);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/2fa/setup`);
      setSetupData(data);
      setBackupCodes(null);
      setSetupCode('');
      setSetupOpen(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Lỗi khởi tạo 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!setupCode.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/2fa/verify-setup`, { code: setupCode.trim() });
      setBackupCodes(data.backup_codes);
      toast.success('Đã bật 2FA thành công!');
      fetchStatus();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Mã không đúng');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disableCode.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/auth/2fa/disable`, { code: disableCode.trim() });
      toast.success('Đã tắt 2FA');
      setDisableOpen(false);
      setDisableCode('');
      fetchStatus();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Mã không đúng');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!regenCode.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/2fa/backup-codes/regenerate`, { code: regenCode.trim() });
      setBackupCodes(data.backup_codes);
      setRegenCode('');
      setRegenOpen(false);
      setSetupOpen(true); // reuse setup modal's backup codes UI
      toast.success('Đã tạo lại mã backup. Các mã cũ không còn dùng được.');
      fetchStatus();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Mã không đúng');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Đã copy mã backup');
  };

  const closeSetup = () => {
    setSetupOpen(false);
    setSetupData(null);
    setSetupCode('');
    setBackupCodes(null);
  };

  return (
    <>
      <Card className="border-0 shadow-sm max-w-lg" data-testid="twofa-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0055FF]" />
            Xác thực 2 bước (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {status === null ? (
            <p className="text-sm text-[#94A3B8]">Đang tải...</p>
          ) : status.enabled ? (
            <>
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">2FA đang BẬT</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Kích hoạt: {status.enabled_at ? new Date(status.enabled_at).toLocaleString('vi-VN') : 'N/A'}
                  </p>
                  <p className="text-xs text-green-700">Mã backup còn lại: <b>{status.backup_codes_remaining}/8</b></p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setRegenOpen(true)} data-testid="twofa-regen-btn">
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Tạo lại mã backup
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDisableOpen(true)} data-testid="twofa-disable-btn">
                  <ShieldOff className="w-4 h-4 mr-1.5" /> Tắt 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">2FA chưa được bật</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Để bảo mật tài khoản Super Admin, bật 2FA để yêu cầu mã từ Google Authenticator / Authy mỗi lần đăng nhập.
                  </p>
                </div>
              </div>
              <Button className="bg-[#0055FF] hover:bg-[#0040CC]" onClick={startSetup} disabled={loading} data-testid="twofa-enable-btn">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                Bật 2FA ngay
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={(v) => { if (!v) closeSetup(); }}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="twofa-setup-modal">
          <DialogHeader>
            <DialogTitle>Bật xác thực 2 bước</DialogTitle>
            <DialogDescription>
              {backupCodes ? 'Lưu các mã backup này ngay! Chỉ hiển thị 1 lần.' : '1. Quét mã QR bằng Google Authenticator / Authy / Microsoft Authenticator'}
            </DialogDescription>
          </DialogHeader>

          {!backupCodes && setupData && (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-white border-2 border-[#E2E8F0] rounded-lg">
                <QRCodeSVG value={setupData.otpauth_url} size={200} level="M" />
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Hoặc nhập thủ công secret:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs font-mono break-all">{setupData.secret}</code>
                  <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(setupData.secret); toast.success('Đã copy'); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#334155] mb-1">2. Nhập mã 6 số từ app xác thực</label>
                <Input type="text" inputMode="numeric" maxLength={6} autoFocus value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456" className="text-center text-lg tracking-widest font-mono"
                  data-testid="twofa-setup-code-input" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={closeSetup} data-testid="twofa-setup-cancel">Hủy</Button>
                <Button className="flex-1 bg-[#0055FF] hover:bg-[#0040CC]" onClick={verifySetup} disabled={loading || setupCode.length !== 6} data-testid="twofa-setup-verify">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận & Bật'}
                </Button>
              </div>
            </div>
          )}

          {backupCodes && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Lưu ngay các mã này!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Mỗi mã chỉ dùng được 1 lần. Dùng khi mất thiết bị xác thực. Chỉ hiển thị lần này.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2" data-testid="twofa-backup-codes">
                {backupCodes.map((c) => (
                  <code key={c} className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-sm font-mono text-center">{c}</code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={copyBackupCodes}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy tất cả
                </Button>
                <Button className="flex-1 bg-[#0055FF]" onClick={closeSetup} data-testid="twofa-setup-done">
                  Đã lưu xong
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="twofa-disable-modal">
          <DialogHeader>
            <DialogTitle>Tắt xác thực 2 bước</DialogTitle>
            <DialogDescription>
              Nhập mã TOTP hiện tại hoặc 1 mã backup để xác nhận tắt 2FA. Tài khoản sẽ giảm mức bảo mật.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="text" inputMode="numeric" maxLength={16} autoFocus value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="123456 hoặc ABCD-1234" className="text-center text-lg tracking-widest font-mono"
              data-testid="twofa-disable-code-input" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDisableOpen(false)}>Hủy</Button>
              <Button variant="destructive" className="flex-1" onClick={disable2FA} disabled={loading} data-testid="twofa-disable-confirm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tắt 2FA'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="twofa-regen-modal">
          <DialogHeader>
            <DialogTitle>Tạo lại mã backup</DialogTitle>
            <DialogDescription>
              Nhập mã TOTP hiện tại. Các mã backup cũ sẽ bị vô hiệu hóa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="text" inputMode="numeric" maxLength={6} autoFocus value={regenCode}
              onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456" className="text-center text-lg tracking-widest font-mono"
              data-testid="twofa-regen-code-input" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRegenOpen(false)}>Hủy</Button>
              <Button className="flex-1 bg-[#0055FF]" onClick={regenerateBackupCodes} disabled={loading || regenCode.length !== 6} data-testid="twofa-regen-confirm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo lại'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorAuthCard;
