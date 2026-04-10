import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Upload, Check, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MediaLibrary({ open, onClose, onSelect, multiple = false, maxSelect = 1 }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [portalReady, setPortalReady] = useState(false);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Portal: create container outside Radix's reach
  useEffect(() => {
    if (open) {
      const container = document.createElement('div');
      container.id = 'media-library-portal';
      document.body.appendChild(container);
      containerRef.current = container;
      setPortalReady(true);
      const interval = setInterval(() => {
        if (container.hasAttribute('inert')) container.removeAttribute('inert');
        if (container.hasAttribute('aria-hidden')) container.removeAttribute('aria-hidden');
      }, 30);
      return () => { clearInterval(interval); setPortalReady(false); container.remove(); containerRef.current = null; };
    }
  }, [open]);

  const fetchMedia = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/dashboard/media?page=${p}&limit=40`);
      setMedia(data.items || []);
      setTotalPages(data.pages || 1);
      setPage(p);
    } catch { toast.error('Không thể tải thư viện ảnh'); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && portalReady) { setSelected([]); fetchMedia(1); }
  }, [open, portalReady, fetchMedia]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded++;
      } catch { toast.error(`Lỗi upload: ${file.name}`); }
    }
    if (uploaded > 0) {
      toast.success(`Đã upload ${uploaded} ảnh`);
      fetchMedia(1);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSelect = (item) => {
    const url = item.url;
    if (selected.includes(url)) {
      setSelected(selected.filter(s => s !== url));
    } else {
      if (multiple) {
        if (selected.length < maxSelect) setSelected([...selected, url]);
        else toast.error(`Tối đa ${maxSelect} ảnh`);
      } else {
        setSelected([url]);
      }
    }
  };

  const handleConfirm = () => {
    if (!selected.length) return;
    onSelect(multiple ? selected : selected[0]);
    onClose();
  };

  const handleDelete = async (e, fileId) => {
    e.stopPropagation();
    if (!window.confirm('Xóa ảnh này?')) return;
    try {
      await axios.delete(`${API}/dashboard/media/${fileId}`);
      setMedia(media.filter(m => m.id !== fileId));
      setSelected(selected.filter(s => s !== `/api/files/${fileId}`));
      toast.success('Đã xóa');
    } catch { toast.error('Lỗi xóa ảnh'); }
  };

  if (!open || !portalReady || !containerRef.current) return null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 99999 }} data-testid="media-library-overlay">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        data-testid="media-library-modal">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">Thư viện ảnh</h2>
            <p className="text-xs text-[#94A3B8]">Chọn ảnh từ thư viện hoặc upload mới</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" multiple className="hidden" />
            <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs gap-1 bg-white" data-testid="media-upload-btn">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Upload mới
            </Button>
            <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-white" data-testid="media-grid-container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#94A3B8]" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
              <ImageIcon className="w-16 h-16 mb-3" />
              <p className="text-sm font-medium">Chưa có ảnh nào</p>
              <p className="text-xs mt-1">Bấm "Upload mới" để tải ảnh lên</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2" data-testid="media-grid">
              {media.map(item => {
                const isSelected = selected.includes(item.url);
                return (
                  <div key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-[#CBD5E1]'}`}
                    data-testid={`media-item-${item.id}`}>
                    <img src={`${API}/files/${item.id}`} alt={item.original_filename} className="w-full h-full object-cover" loading="lazy" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={(e) => handleDelete(e, item.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity flex"
                      data-testid={`media-delete-${item.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate">{item.original_filename}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button key={i} type="button" variant={page === i + 1 ? 'default' : 'outline'} size="sm"
                  className="w-8 h-8 text-xs bg-white" onClick={() => fetchMedia(i + 1)}>
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-[#F8FAFC] flex-shrink-0">
          <p className="text-xs text-[#64748B]">{selected.length} ảnh đã chọn</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs bg-white">Hủy</Button>
            <Button type="button" size="sm" onClick={handleConfirm} disabled={!selected.length}
              className="text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40" data-testid="media-confirm-btn">
              <Check className="w-3 h-3" /> Chọn ảnh
            </Button>
          </div>
        </div>
      </div>
    </div>,
    containerRef.current
  );
}
