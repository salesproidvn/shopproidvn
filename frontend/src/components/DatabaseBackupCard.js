import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Database, Download, Loader2, Play, CheckCircle2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DatabaseBackupCard = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/backups`);
      setBackups(data || []);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Lỗi tải danh sách backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const runBackupNow = async () => {
    setRunning(true);
    try {
      const { data } = await axios.post(`${API}/admin/backups/run`);
      toast.success(`Backup tạo thành công: ${data.archive} (${data.size_mb} MB)`);
      fetchBackups();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Backup thất bại');
    } finally {
      setRunning(false);
    }
  };

  const downloadBackup = async (key) => {
    try {
      const { data } = await axios.get(`${API}/admin/backups/download`, { params: { key } });
      window.open(data.url, '_blank');
    } catch (e) {
      toast.error('Không tạo được link tải');
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return iso; }
  };

  const totalSize = backups.reduce((s, b) => s + (b.size_mb || 0), 0);

  return (
    <Card className="border-0 shadow-sm" data-testid="db-backup-card">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-[#0055FF]" />
          Backup Database (Cloudflare R2)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-blue-800">Auto backup đang hoạt động</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Tự động backup hàng ngày lúc <b>02:00 UTC (09:00 giờ VN)</b>. Giữ lại <b>14 bản</b> gần nhất, xoay vòng tự động.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-[#64748B]">
            {backups.length} bản backup · {totalSize.toFixed(2)} MB total
          </div>
          <Button size="sm" className="bg-[#0055FF] hover:bg-[#0040CC]" onClick={runBackupNow} disabled={running} data-testid="backup-run-now-btn">
            {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang backup...</> : <><Play className="w-4 h-4 mr-2" /> Backup ngay</>}
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto border border-[#E2E8F0] rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải...</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">Chưa có bản backup nào. Bấm "Backup ngay" để tạo.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] sticky top-0">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Tên file</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Thời gian</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Kích thước</th>
                  <th className="px-3 py-2 font-medium text-xs text-[#64748B]">Tải</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.key} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                    <td className="px-3 py-2 font-mono text-xs truncate max-w-[240px]" title={b.name}>{b.name}</td>
                    <td className="px-3 py-2 text-xs text-[#64748B]">{formatDate(b.created_at)}</td>
                    <td className="px-3 py-2 text-xs">{b.size_mb} MB</td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadBackup(b.key)} data-testid={`backup-download-${b.name}`}>
                        <Download className="w-3 h-3 mr-1" /> Tải về
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-[11px] text-[#94A3B8]">
          💡 Link tải dùng <b>presigned URL</b> từ Cloudflare R2 (hiệu lực 1 giờ). File nén định dạng <code>.tar.gz</code>, giải nén bằng <code>tar -xzf</code> và import bằng <code>mongorestore</code>.
        </p>
      </CardContent>
    </Card>
  );
};

export default DatabaseBackupCard;
