import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Images, Loader2, Play, AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MediaBackupCard = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/backups/media`);
      setBackups(data || []);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Lỗi tải danh sách');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBackups(); }, []);

  const runBackup = async () => {
    setRunning(true);
    const toastId = toast.loading('Đang snapshot media lên R2... (~10-30 giây)');
    try {
      const { data } = await axios.post(`${API}/admin/backups/media/run`, null, { timeout: 180000 });
      toast.success(`Đã backup ${data.copied} file (${data.total_size_mb} MB)`, { id: toastId });
      fetchBackups();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Backup thất bại', { id: toastId });
    } finally { setRunning(false); }
  };

  const doRestore = async () => {
    if (confirmText !== 'RESTORE') { toast.error('Gõ RESTORE để xác nhận'); return; }
    setRestoring(true);
    try {
      const { data } = await axios.post(`${API}/admin/restore/media`, { timestamp: restoreTarget.timestamp, confirm: 'RESTORE' }, { timeout: 180000 });
      toast.success(`Đã restore ${data.restored} file từ snapshot ${restoreTarget.timestamp}`);
      setRestoreTarget(null);
      setConfirmText('');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Restore thất bại');
    } finally { setRestoring(false); }
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return iso; }
  };

  return (
    <Card className="border-0 shadow-sm" data-testid="media-backup-card">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Images className="w-5 h-5 text-[#0055FF]" />
          Backup Media Files (ảnh / video)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <Images className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-blue-800">Snapshot toàn bộ ảnh/video đã upload</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Copy tất cả file từ prefix <code>{'{app}/products/'}</code> sang <code>backups/media/YYYYMMDD-HHMMSS/</code>. Giữ 4 snapshot gần nhất. Có thể restore từng snapshot.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-[#64748B]">{backups.length} snapshot</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchBackups} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" className="bg-[#0055FF] hover:bg-[#0040CC]" onClick={runBackup} disabled={running} data-testid="media-backup-run-btn">
              {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang backup...</> : <><Play className="w-4 h-4 mr-2" /> Backup ngay</>}
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto border border-[#E2E8F0] rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Đang tải...</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">Chưa có snapshot nào. Bấm "Backup ngay" để tạo.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] sticky top-0">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Snapshot</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Files</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Size</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Thời gian</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Restore</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.timestamp} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="px-3 py-2 font-mono text-xs">{b.timestamp}</td>
                    <td className="px-3 py-2 text-xs">{b.file_count}</td>
                    <td className="px-3 py-2 text-xs">{b.total_size_mb} MB</td>
                    <td className="px-3 py-2 text-xs text-[#64748B]">{formatDate(b.created_at)}</td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setRestoreTarget(b); setConfirmText(''); }} data-testid={`media-restore-${b.timestamp}`}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Restore
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-[11px] text-[#94A3B8]">
          💡 Mỗi snapshot copy toàn bộ file sang prefix mới → chiếm thêm dung lượng R2. Giữ tối đa 4 snapshot (xoay vòng). Restore chỉ copy lại file gốc, không xóa file mới thêm.
        </p>
      </CardContent>

      {/* Restore dialog */}
      <Dialog open={!!restoreTarget} onOpenChange={(v) => { if (!v) { setRestoreTarget(null); setConfirmText(''); } }}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="media-restore-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Xác nhận restore media
            </DialogTitle>
            <DialogDescription className="text-sm">
              File mới (upload sau snapshot) sẽ <b>KHÔNG</b> bị xóa. Nhưng file đã chỉnh sửa sau snapshot sẽ bị <b>ghi đè</b> bằng bản cũ.
            </DialogDescription>
          </DialogHeader>
          {restoreTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-semibold text-amber-800">Restore từ snapshot:</p>
                <p className="font-mono text-xs mt-1 text-amber-700">{restoreTarget.timestamp}</p>
                <p className="text-xs text-amber-700 mt-1">{restoreTarget.file_count} files · {restoreTarget.total_size_mb} MB</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#334155]">Gõ <b>RESTORE</b> để xác nhận:</label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESTORE" className="mt-1 font-mono" autoFocus data-testid="media-restore-confirm-input" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setRestoreTarget(null); setConfirmText(''); }}>Hủy</Button>
                <Button variant="destructive" className="flex-1" onClick={doRestore} disabled={restoring || confirmText !== 'RESTORE'} data-testid="media-restore-confirm-btn">
                  {restoring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang restore...</> : 'Restore ngay'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MediaBackupCard;
