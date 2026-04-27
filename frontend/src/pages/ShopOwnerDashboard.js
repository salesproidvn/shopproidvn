import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { setAdminViewShopId } from '../utils/adminContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { 
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Settings, 
  LogOut, Menu, X, Plus, Pencil, Trash2, TrendingUp, Clock, Eye, Palette, Upload, ExternalLink,
  Bold, Italic, List, ChevronUp, ChevronDown, Play, FileText, Image, Calendar, Search, LayoutGrid, GripVertical,
  Globe, Navigation, Link2, Video, Type, ArrowUp, ArrowDown, EyeOff, Copy, Grid3X3,
  Bell, BellOff, Smartphone, Download, Mail, Loader2, Check, Ticket, Users, Lock, Phone,
  AlignLeft, AlignCenter, AlignRight, ChevronLeft, ChevronRight,
  Facebook, Instagram, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import NotificationBell from '../components/NotificationBell';
import MediaLibrary from '../components/MediaLibrary';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function SortableLayoutItem({ section, sectionLabels, sectionIcons, themeColor, onToggle, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.85 : 1 };
  const isCustom = typeof section.id === 'string' && section.id.startsWith('custom:');
  const IconComp = isCustom ? LayoutGrid : (sectionIcons[section.id] || Package);
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all ${section.enabled ? 'bg-white border-[#E2E8F0]' : 'bg-[#F8FAFC] border-dashed border-[#E2E8F0] opacity-60'} ${isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}`}
      data-testid={`layout-section-${section.id}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
      </div>
      <div className="w-8 h-8 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: section.enabled ? themeColor + '15' : '#F1F5F9' }}>
        <IconComp className="w-4 h-4" style={{ color: section.enabled ? themeColor : '#94A3B8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#0F172A] truncate">{sectionLabels[section.id] || section.label}</p>
        {isCustom && <p className="text-[10px] text-[#94A3B8]">Section tùy chỉnh</p>}
      </div>
      {isCustom && onEdit && (
        <button onClick={onEdit} className="w-8 h-8 rounded-[5px] border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] flex items-center justify-center flex-shrink-0" data-testid={`edit-custom-section-${section.id}`} title="Chỉnh sửa">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={onToggle}
        className={`w-[68px] h-8 rounded-full transition-all relative overflow-hidden flex-shrink-0 ${section.enabled ? '' : 'bg-[#E2E8F0]'}`}
        style={section.enabled ? { backgroundColor: themeColor } : {}}
        data-testid={`toggle-section-${section.id}`}>
        <span className={`absolute inset-0 flex items-center ${section.enabled ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
          <span className="text-[10px] font-bold text-white tracking-wide select-none">{section.enabled ? 'BẬT' : ''}</span>
          <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!section.enabled ? 'TẮT' : ''}</span>
        </span>
        <span className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-transform ${section.enabled ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
      </button>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange, themeColor, testIdPrefix = 'pagination' }) {
  if (totalPages <= 1) return null;
  const maxButtons = 5;
  const start = Math.max(1, Math.min(page - Math.floor(maxButtons / 2), totalPages - maxButtons + 1));
  const pages = [];
  for (let i = start; i < Math.min(start + maxButtons, totalPages + 1); i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4 mt-3 border-t border-[#E2E8F0]" data-testid={`${testIdPrefix}-pagination`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 text-xs"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        data-testid={`${testIdPrefix}-prev`}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Button>
      {start > 1 && (
        <>
          <button type="button" className="h-8 w-8 rounded-[5px] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]" onClick={() => onPageChange(1)} data-testid={`${testIdPrefix}-page-1`}>1</button>
          {start > 2 && <span className="text-xs text-[#94A3B8]">…</span>}
        </>
      )}
      {pages.map((p) => {
        const active = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-[5px] text-xs font-semibold transition-colors ${active ? 'text-white' : 'text-[#475569] hover:bg-[#F1F5F9]'}`}
            style={active ? { backgroundColor: themeColor } : {}}
            data-testid={`${testIdPrefix}-page-${p}`}
          >
            {p}
          </button>
        );
      })}
      {start + maxButtons - 1 < totalPages && (
        <>
          {start + maxButtons < totalPages && <span className="text-xs text-[#94A3B8]">…</span>}
          <button type="button" className="h-8 w-8 rounded-[5px] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]" onClick={() => onPageChange(totalPages)} data-testid={`${testIdPrefix}-page-${totalPages}`}>{totalPages}</button>
        </>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 text-xs"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        data-testid={`${testIdPrefix}-next`}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function SortableElementRow({ elKey, themeColor }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: elKey });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.85 : 1 };
  const meta = {
    title: { label: 'Tiêu đề', Icon: Type },
    image: { label: 'Ảnh minh họa', Icon: Image },
    video: { label: 'Video YouTube', Icon: Play },
    content: { label: 'Nội dung (rich text)', Icon: FileText },
  }[elKey] || { label: elKey, Icon: Package };
  const { Icon } = meta;
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2 p-2.5 rounded-[5px] bg-white border border-[#E2E8F0] ${isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}`}
      data-testid={`element-row-${elKey}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-[#94A3B8]" />
      </div>
      <div className="w-7 h-7 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeColor + '15' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: themeColor }} />
      </div>
      <span className="text-sm text-[#0F172A] font-medium">{meta.label}</span>
    </div>
  );
}

function SortableCategoryItem({ cat, idx, themeColor, parentName }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.85 : 1 };
  const isSub = !!cat.parent_id;
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 p-3 rounded-lg ${isSub ? 'ml-6 bg-white border border-dashed border-[#E2E8F0]' : 'bg-[#F8FAFC]'} ${isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}`}
      data-testid={`cat-position-${cat.id}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
      </div>
      <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm border" style={{ color: themeColor }}>{idx + 1}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm text-[#0F172A]">{cat.name}</span>
        {isSub && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded font-medium">{parentName ? `↳ ${parentName}` : '↳ danh mục con'}</span>}
      </div>
    </div>
  );
}



const ShopOwnerDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { t, lang, switchLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Admin viewing mode: super_admin can view any shop
  const adminViewShopId = user?.role === 'super_admin' ? searchParams.get('shop') : null;
  const isAdminViewing = !!adminViewShopId;
  const shopQuery = adminViewShopId ? `?shop_id=${adminViewShopId}` : '';

  const [stats, setStats] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderPage, setOrderPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const ORDERS_PER_PAGE = 10;
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [themeColor, setThemeColor] = useState('#0055FF');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [posts, setPosts] = useState([]);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_id: '', image_url: '' });
  const [shopForm, setShopForm] = useState({});
  const [postForm, setPostForm] = useState({ title: '', description: '', thumbnail: '', images: [], attached_products: [] });
  const postFileInputRef = useRef(null);
  const postImagesInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [dashProductSearch, setDashProductSearch] = useState('');
  const [dashProductCategory, setDashProductCategory] = useState('all');

  // Media Library state
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaCallback, setMediaCallback] = useState(null);
  const [mediaMultiple, setMediaMultiple] = useState(false);
  const [mediaMaxSelect, setMediaMaxSelect] = useState(1);

  // Media Tab state
  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaSelected, setMediaSelected] = useState([]);
  const mediaBulkInputRef = useRef(null);

  const fetchMediaList = async (p = 1) => {
    setMediaLoading(true);
    try {
      const { data } = await axios.get(`${API}/dashboard/media?page=${p}&limit=40`);
      setMediaList(data.items || []);
      setMediaTotalPages(data.pages || 1);
      setMediaTotal(data.total || 0);
      setMediaPage(p);
    } catch { toast.error(t.failedToLoad); }
    setMediaLoading(false);
  };

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setMediaUploading(true);
    let uploaded = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded++;
      } catch { toast.error(`Lỗi: ${file.name}`); }
    }
    if (uploaded > 0) toast.success(`Đã upload ${uploaded}/${files.length} ảnh`);
    setMediaUploading(false);
    if (mediaBulkInputRef.current) mediaBulkInputRef.current.value = '';
    fetchMediaList(1);
  };

  const handleDeleteMedia = async (fileId) => {
    try {
      await axios.delete(`${API}/dashboard/media/${fileId}`);
      setMediaList(mediaList.filter(m => m.id !== fileId));
      setMediaSelected(mediaSelected.filter(s => s !== fileId));
      setMediaTotal(prev => prev - 1);
      toast.success('Đã xóa');
    } catch { toast.error('Lỗi xóa ảnh'); }
  };

  const handleBulkDeleteMedia = async () => {
    if (!mediaSelected.length) return;
    let deleted = 0;
    for (const id of mediaSelected) {
      try { await axios.delete(`${API}/dashboard/media/${id}`); deleted++; } catch {}
    }
    toast.success(`Đã xóa ${deleted} ảnh`);
    setMediaSelected([]);
    fetchMediaList(mediaPage);
  };

  useEffect(() => {
    if (activeTab === 'media') fetchMediaList(1);
  }, [activeTab]);

  const openMediaLibrary = (callback, { multiple = false, maxSelect = 1 } = {}) => {
    setMediaCallback(() => callback);
    setMediaMultiple(multiple);
    setMediaMaxSelect(maxSelect);
    setMediaOpen(true);
  };

  // Mega Menu state
  const [megaMenuItems, setMegaMenuItems] = useState([]);

  // Push Notification & PWA Install state
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifDevices, setNotifDevices] = useState(0);
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(false);
  const [emailNotifLoading, setEmailNotifLoading] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Set admin view context for mock handler when admin views a shop
  useEffect(() => {
    setAdminViewShopId(adminViewShopId);
    return () => setAdminViewShopId(null);
  }, [adminViewShopId]);

  // PWA Install prompt capture
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsAppInstalled(!!isStandalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsAppInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Sync activeTab to URL search params
  useEffect(() => {
    const current = searchParams.get('tab');
    if (activeTab !== 'overview' && current !== activeTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', activeTab);
      setSearchParams(newParams, { replace: true });
    } else if (activeTab === 'overview' && current) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      setSearchParams(newParams, { replace: true });
    }
  }, [activeTab]);

  // Fetch notification status
  useEffect(() => {
    if (!user || !activeTab.includes('settings')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    import('../utils/pushNotifications').then(({ getNotificationStatus }) => {
      getNotificationStatus(token).then(status => {
        setNotifEnabled(status.enabled);
        setNotifDevices(status.subscribed_devices);
        setEmailNotifEnabled(status.email_enabled || false);
      });
    });
  }, [user, activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'shop_owner' && user.role !== 'super_admin')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, authLoading, navigate, adminViewShopId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, shopRes, productsRes, categoriesRes, ordersRes, bookingsRes, postsRes, megaMenuRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats${shopQuery}`),
        axios.get(`${API}/dashboard/shop${shopQuery}`),
        axios.get(`${API}/dashboard/products${shopQuery}`),
        axios.get(`${API}/dashboard/categories${shopQuery}`),
        axios.get(`${API}/dashboard/orders${shopQuery}`),
        axios.get(`${API}/dashboard/bookings${shopQuery}`).catch(() => ({ data: [] })),
        axios.get(`${API}/dashboard/posts${shopQuery}`),
        axios.get(`${API}/dashboard/mega-menu${shopQuery}`)
      ]);
      setStats(statsRes.data);
      setShop(shopRes.data);
      setShopForm(shopRes.data);
      if (shopRes.data.theme_color) setThemeColor(shopRes.data.theme_color);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      setBookings(bookingsRes.data || []);
      setPosts(postsRes.data || []);
      setMegaMenuItems(megaMenuRes.data || []);
    } catch (err) {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  // Lightweight fetch: only reload specific data instead of everything
  const fetchProductsOnly = async () => {
    try {
      const [productsRes, statsRes] = await Promise.all([
        axios.get(`${API}/dashboard/products${shopQuery}`),
        axios.get(`${API}/dashboard/stats${shopQuery}`),
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
    } catch { }
  };

  const fetchCategoriesOnly = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/categories${shopQuery}`);
      setCategories(data);
    } catch { }
  };

  const fetchOrdersOnly = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/orders${shopQuery}`);
      setOrders(data);
    } catch { }
  };

  const fetchBookingsOnly = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/bookings${shopQuery}`);
      setBookings(data || []);
    } catch { }
  };

  const fetchPostsOnly = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/posts${shopQuery}`);
      setPosts(data || []);
    } catch { }
  };

  const fetchMenuOnly = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/mega-menu${shopQuery}`);
      setMegaMenuItems(data || []);
    } catch { }
  };

  const fetchDataKeepScroll = async () => {
    const scrollY = window.scrollY;
    await fetchData();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };



  const [productToDelete, setProductToDelete] = useState(null);
  const handleDeleteProduct = async (prodId) => {
    const target = prodId || productToDelete;
    if (!target) return;
    try {
      await axios.delete(`${API}/dashboard/products/${target}`);
      toast.success(t.productDeleted);
      fetchProductsOnly();
    } catch (err) {
      toast.error(t.failedToDelete);
    } finally {
      setProductToDelete(null);
    }
  };

  const handleCopyProductLink = async (productId) => {
    if (!shop?.slug) return;
    const url = `${window.location.origin}/shop/${shop.slug}/product/${productId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã copy link sản phẩm');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast.success('Đã copy link sản phẩm'); }
      catch { toast.error('Copy thất bại'); }
      document.body.removeChild(ta);
    }
  };


  const openProductDetail = (product) => {
    if (!shop?.slug || !product?.id) return;
    window.open(`/shop/${shop.slug}/product/${product.id}`, '_blank', 'noopener,noreferrer');
  };


  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const savedScrollY = window.scrollY;
    try {
      if (editingCategory) {
        await axios.put(`${API}/dashboard/categories/${editingCategory.id}`, categoryForm);
        toast.success(t.categoryUpdated);
      } else {
        await axios.post(`${API}/dashboard/categories`, categoryForm);
        toast.success(t.categoryCreated);
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      await fetchCategoriesOnly();
      await fetchMenuOnly();
      requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
    } catch (err) {
      toast.error(t.failedToSave);
    }
  };

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const handleDeleteCategory = async (catId) => {
    const target = catId || categoryToDelete;
    if (!target) return;
    try {
      await axios.delete(`${API}/dashboard/categories/${target}`);
      toast.success(t.categoryDeleted);
      fetchCategoriesOnly();
      fetchMenuOnly();
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToDelete);
    } finally {
      setCategoryToDelete(null);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', parent_id: '', image_url: '' });
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/dashboard/shop`, shopForm);
      toast.success(t.shopUpdated);
      const { data: updatedShop } = await axios.get(`${API}/dashboard/shop${shopQuery}`);
      setShop(updatedShop); setShopForm(updatedShop);
      if (updatedShop.theme_color) setThemeColor(updatedShop.theme_color);
    } catch (err) {
      toast.error(t.failedToSave);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/dashboard/orders/${orderId}/status`, { status });
      toast.success(t.orderStatusUpdated);
      fetchOrdersOnly();
      // Refresh agent sales if agents enabled
      if (shop?.agents_enabled) fetchAgentSales();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`${API}/dashboard/bookings/${bookingId}/status`, { status });
      toast.success('Đã cập nhật trạng thái đặt lịch');
      fetchBookingsOnly();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Xóa đơn đặt lịch này?')) return;
    try {
      await axios.delete(`${API}/dashboard/bookings/${bookingId}`);
      toast.success('Đã xóa đơn đặt lịch');
      fetchBookingsOnly();
    } catch (err) {
      toast.error(t.failedToDelete);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleToggleNotifications = async () => {
    setNotifLoading(true);
    const token = localStorage.getItem('token');
    try {
      const { isPushSupported, subscribeToPush, unsubscribeFromPush, getNotificationStatus } = await import('../utils/pushNotifications');
      if (!isPushSupported()) {
        toast.error(t.pushNotSupported || 'Trình duyệt không hỗ trợ thông báo đẩy');
        setNotifLoading(false);
        return;
      }
      if (!notifEnabled) {
        await subscribeToPush(token);
        toast.success(t.notificationsEnabled || 'Đã bật thông báo đơn hàng mới!');
      } else {
        await unsubscribeFromPush(token);
        toast.success(t.notificationsDisabled || 'Đã tắt thông báo');
      }
      const status = await getNotificationStatus(token);
      setNotifEnabled(status.enabled);
      setNotifDevices(status.subscribed_devices);
    } catch (err) {
      toast.error(err.message || 'Không thể thay đổi cài đặt thông báo');
    }
    setNotifLoading(false);
  };

  const handleToggleEmailNotifications = async () => {
    setEmailNotifLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API}/dashboard/notifications/email-toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailNotifEnabled(res.data.email_enabled);
      toast.success(res.data.email_enabled
        ? (t.emailNotifEnabled || 'Đã bật thông báo email đơn hàng!')
        : (t.emailNotifDisabled || 'Đã tắt thông báo email'));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lỗi');
    }
    setEmailNotifLoading(false);
  };

  const handleInstallPWA = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
        toast.success(t.appInstalled || 'Ứng dụng đã được cài đặt!');
      }
      setDeferredInstallPrompt(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleMoveCategoryPosition = async (catId, direction) => {
    const sorted = [...categories].sort((a, b) => (a.position || 0) - (b.position || 0));
    const idx = sorted.findIndex(c => c.id === catId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const tempPos = sorted[idx].position;
    sorted[idx].position = sorted[swapIdx].position;
    sorted[swapIdx].position = tempPos;
    try {
      await axios.put(`${API}/dashboard/categories/positions`, {
        positions: sorted.map(c => ({ id: c.id, position: c.position }))
      });
      toast.success(t.positionSaved);
      fetchCategoriesOnly();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  const handleCategoryDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = [...categories].sort((a, b) => (a.position || 0) - (b.position || 0));
    const oldIndex = sorted.findIndex(c => c.id === active.id);
    const newIndex = sorted.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }));
    // Optimistic update - show new order immediately
    setCategories(reordered);
    try {
      await axios.put(`${API}/dashboard/categories/positions`, {
        positions: reordered.map(c => ({ id: c.id, position: c.position }))
      });
      toast.success(t.positionSaved);
    } catch {
      toast.error(t.failedToUpdate);
      fetchCategoriesOnly(); // revert on error
    }
  };

  // Post methods
  const countWords = (html) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (countWords(postForm.description) > 1000) { toast.error(t.maxWordsReached); return; }
    const savedScrollY = window.scrollY;
    try {
      const data = { ...postForm, images: postForm.images || [], attached_products: postForm.attached_products || [] };
      if (editingPost) {
        await axios.put(`${API}/dashboard/posts/${editingPost.id}`, data);
        toast.success(t.postUpdated);
      } else {
        await axios.post(`${API}/dashboard/posts`, data);
        toast.success(t.postCreated);
      }
      setShowPostModal(false);
      resetPostForm();
      await fetchPostsOnly();
      requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
    } catch (err) { toast.error(t.failedToSave); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm(t.deleteConfirmPost)) return;
    try {
      await axios.delete(`${API}/dashboard/posts/${postId}`);
      toast.success(t.postDeleted);
      fetchPostsOnly();
    } catch { toast.error(t.failedToDelete); }
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setPostForm({ title: post.title, description: post.description, thumbnail: post.thumbnail || '', images: post.images || [], attached_products: post.attached_products || [] });
    setShowPostModal(true);
  };

  const resetPostForm = () => {
    setEditingPost(null);
    setPostForm({ title: '', description: '', thumbnail: '', images: [], attached_products: [] });
  };

  const handlePostThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data.url || `${API}/files/${data.id}`;
      setPostForm(prev => ({ ...prev, thumbnail: url }));
      toast.success(t.uploadSuccess);
    } catch { toast.error(t.uploadFailed); }
    if (postFileInputRef.current) postFileInputRef.current.value = '';
  };

  const handlePostImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const currentCount = (postForm.images || []).length;
    const remaining = 3 - currentCount;
    if (remaining <= 0) { toast.error('Tối đa 3 ảnh / Max 3 images'); return; }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) toast.info(`Chỉ upload ${remaining} ảnh (tối đa 3)`);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(data.url || `${API}/files/${data.id}`);
      }
      setPostForm(prev => ({ ...prev, images: [...(prev.images || []), ...uploaded] }));
      toast.success(`${uploaded.length} ảnh đã tải lên`);
    } catch { toast.error(t.uploadFailed); }
    if (postImagesInputRef.current) postImagesInputRef.current.value = '';
  };

  const toggleProductAttach = (prodId) => {
    setPostForm(prev => {
      const current = prev.attached_products || [];
      return { ...prev, attached_products: current.includes(prodId) ? current.filter(id => id !== prodId) : [...current, prodId] };
    });
  };

  const quillModules = { toolbar: [[{ size: ['small', false, 'large', 'huge'] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] };

  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const currentBanners = shopForm.banners || [];
    const remaining = 8 - currentBanners.length;
    if (remaining <= 0) { toast.error(t.bannerMaxReached); return; }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) toast.info(`Chỉ upload ${remaining} ảnh (tối đa 8)`);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axios.post(`${API}/upload/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(data.url || `${API}/files/${data.id}`);
      }
      const newBanners = [...currentBanners, ...uploaded];
      setShopForm({ ...shopForm, banners: newBanners });
      await axios.put(`${API}/dashboard/shop`, { banners: newBanners });
      toast.success(`${uploaded.length} banner đã tải lên`);
    } catch { toast.error(t.uploadFailed); }
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const removeBanner = async (idx) => {
    const newBanners = (shopForm.banners || []).filter((_, i) => i !== idx);
    setShopForm({ ...shopForm, banners: newBanners });
    try {
      await axios.put(`${API}/dashboard/shop`, { banners: newBanners });
      toast.success(t.shopUpdated);
    } catch { toast.error(t.failedToSave); }
  };

  const toggleShopSetting = async (field) => {
    const newVal = !shopForm[field];
    setShopForm({ ...shopForm, [field]: newVal });
    try {
      await axios.put(`${API}/dashboard/shop`, { [field]: newVal });
      toast.success(t.shopUpdated);
    } catch { toast.error(t.failedToSave); }
  };

  const sectionLabels = {
    banner: t.sectionBanner,
    categories: t.categories,
    blog: t.sectionBlog,
    featured: t.sectionFeatured,
    services: 'Dịch vụ',
    products: t.sectionProducts,
  };

  // Build labels for custom: sections on-the-fly
  const buildSectionLabels = () => {
    const base = { ...sectionLabels };
    (shopForm.custom_sections || []).forEach(cs => {
      base[`custom:${cs.id}`] = cs.title || 'Section tùy chỉnh';
    });
    return base;
  };

  const sectionIcons = {
    banner: Image,
    categories: FolderOpen,
    blog: FileText,
    featured: TrendingUp,
    services: Calendar,
    products: Package,
  };

  const VALID_SECTION_IDS = ['banner', 'categories', 'blog', 'featured', 'services', 'products'];
  const customSections = shopForm.custom_sections || [];
  const isCustomSectionId = (id) => typeof id === 'string' && id.startsWith('custom:');

  const getLayoutSections = () => {
    const sections = shopForm.layout_sections;
    const customItems = customSections.map(cs => ({ id: `custom:${cs.id}`, label: cs.title || 'Section tùy chỉnh', enabled: cs.enabled !== false }));
    if (sections && sections.length > 0) {
      // Filter invalid + append 'services' if missing (migrate existing shops)
      const valid = sections.filter(s => VALID_SECTION_IDS.includes(s.id) || isCustomSectionId(s.id));
      if (!valid.some(s => s.id === 'services')) {
        const prodIdx = valid.findIndex(s => s.id === 'products');
        const insertAt = prodIdx >= 0 ? prodIdx : valid.length;
        valid.splice(insertAt, 0, { id: 'services', label: 'Dịch vụ', enabled: true });
      }
      // Append newly-created custom sections that aren't in layout yet
      customItems.forEach(ci => {
        if (!valid.some(v => v.id === ci.id)) valid.push(ci);
      });
      // Drop stale custom: entries whose source was deleted
      return valid.filter(s => !isCustomSectionId(s.id) || customItems.some(c => c.id === s.id));
    }
    return [
      { id: 'banner', label: 'Banner', enabled: true },
      { id: 'categories', label: 'Categories', enabled: true },
      { id: 'blog', label: 'Blog', enabled: true },
      { id: 'featured', label: 'Featured Products', enabled: true },
      { id: 'services', label: 'Dịch vụ', enabled: true },
      { id: 'products', label: 'Products', enabled: true },
      ...customItems,
    ];
  };

  const moveSection = async (idx, direction) => {
    const sections = [...getLayoutSections()];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    [sections[idx], sections[swapIdx]] = [sections[swapIdx], sections[idx]];
    setShopForm({ ...shopForm, layout_sections: sections });
    try {
      await axios.put(`${API}/dashboard/shop`, { layout_sections: sections });
      toast.success(t.shopUpdated);
    } catch { toast.error(t.failedToSave); }
  };

  const toggleSection = async (idx) => {
    const sections = [...getLayoutSections()];
    sections[idx] = { ...sections[idx], enabled: !sections[idx].enabled };
    const patch = { layout_sections: sections };
    // If toggling a custom section, also sync enabled flag in custom_sections
    if (isCustomSectionId(sections[idx].id)) {
      const csId = sections[idx].id.replace('custom:', '');
      const updatedCs = (shopForm.custom_sections || []).map(cs => cs.id === csId ? { ...cs, enabled: sections[idx].enabled } : cs);
      patch.custom_sections = updatedCs;
      setShopForm({ ...shopForm, layout_sections: sections, custom_sections: updatedCs });
    } else {
      setShopForm({ ...shopForm, layout_sections: sections });
    }
    try {
      await axios.put(`${API}/dashboard/shop`, patch);
      toast.success(t.shopUpdated);
    } catch { toast.error(t.failedToSave); }
  };

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLayoutDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sections = getLayoutSections();
    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setShopForm({ ...shopForm, layout_sections: reordered });
    try {
      await axios.put(`${API}/dashboard/shop`, { layout_sections: reordered });
      toast.success(t.shopUpdated);
    } catch { toast.error(t.failedToSave); }
  };

  // ==================== Custom Sections ====================
  const [showCustomSectionModal, setShowCustomSectionModal] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState(null);
  const [customSectionForm, setCustomSectionForm] = useState({ title: '', image_url: '', content: '', video_url: '', title_level: 'h2', title_align: 'left', element_order: ['title', 'image', 'video', 'content'] });

  const openCreateCustomSection = () => {
    if ((shopForm.custom_sections || []).length >= 5) {
      toast.error('Đã đạt giới hạn tối đa 5 section tùy chỉnh');
      return;
    }
    setEditingCustomSection(null);
    setCustomSectionForm({ title: '', image_url: '', content: '', video_url: '', title_level: 'h2', title_align: 'left', element_order: ['title', 'image', 'video', 'content'] });
    setShowCustomSectionModal(true);
  };

  const openEditCustomSection = (cs) => {
    setEditingCustomSection(cs);
    setCustomSectionForm({
      title: cs.title || '',
      image_url: cs.image_url || '',
      content: cs.content || '',
      video_url: cs.video_url || '',
      title_level: cs.title_level || 'h2',
      title_align: cs.title_align || 'left',
      element_order: Array.isArray(cs.element_order) && cs.element_order.length
        ? cs.element_order.filter(x => ['title', 'image', 'video', 'content'].includes(x))
        : ['title', 'image', 'video', 'content'],
    });
    setShowCustomSectionModal(true);
  };

  const handleSaveCustomSection = async (e) => {
    e?.preventDefault?.();
    if (!customSectionForm.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (countWords(customSectionForm.content) > 1000) { toast.error(t.maxWordsReached || 'Nội dung vượt quá 1000 từ'); return; }
    const current = shopForm.custom_sections || [];
    const payloadExtras = {
      title_level: customSectionForm.title_level || 'h2',
      title_align: customSectionForm.title_align || 'left',
      video_url: (customSectionForm.video_url || '').trim(),
      element_order: customSectionForm.element_order || ['title', 'image', 'video', 'content'],
    };
    let next;
    let newSectionId = null;
    if (editingCustomSection) {
      next = current.map(cs => cs.id === editingCustomSection.id ? { ...cs, title: customSectionForm.title.trim(), image_url: customSectionForm.image_url, content: customSectionForm.content, ...payloadExtras } : cs);
    } else {
      newSectionId = `cs-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      next = [...current, { id: newSectionId, title: customSectionForm.title.trim(), image_url: customSectionForm.image_url, content: customSectionForm.content, enabled: true, ...payloadExtras }];
    }
    // Also append to layout_sections if it's a new one and not already listed
    let nextLayout = shopForm.layout_sections ? [...shopForm.layout_sections] : [...getLayoutSections()];
    if (newSectionId && !nextLayout.some(s => s.id === `custom:${newSectionId}`)) {
      nextLayout.push({ id: `custom:${newSectionId}`, label: customSectionForm.title.trim(), enabled: true });
    }
    try {
      await axios.put(`${API}/dashboard/shop`, { custom_sections: next, layout_sections: nextLayout });
      setShopForm({ ...shopForm, custom_sections: next, layout_sections: nextLayout });
      toast.success(editingCustomSection ? 'Đã cập nhật section' : 'Đã tạo section');
      setShowCustomSectionModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToSave);
    }
  };

  const [customSectionToDelete, setCustomSectionToDelete] = useState(null);
  const handleDeleteCustomSection = async (cs) => {
    const target = cs || customSectionToDelete;
    if (!target) return;
    const nextCs = (shopForm.custom_sections || []).filter(x => x.id !== target.id);
    const nextLayout = getLayoutSections().filter(s => s.id !== `custom:${target.id}`);
    try {
      await axios.put(`${API}/dashboard/shop`, { custom_sections: nextCs, layout_sections: nextLayout });
      setShopForm({ ...shopForm, custom_sections: nextCs, layout_sections: nextLayout });
      toast.success('Đã xóa section');
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToSave);
    } finally {
      setCustomSectionToDelete(null);
    }
  };

  const menuItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'products', label: t.products, icon: Package },
    { id: 'categories', label: t.categories, icon: FolderOpen },
    { id: 'posts', label: t.posts, icon: FileText },
    { id: 'orders', label: t.orders, icon: ShoppingCart },
    { id: 'media', label: t.mediaLibrary || 'Thư viện ảnh', icon: Image },
    { id: 'megamenu', label: t.megaMenu || 'Mega Menu', icon: Grid3X3 },
    { id: 'layout', label: t.displayLayout, icon: LayoutGrid },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    pending: t.pending, confirmed: t.confirmed, processing: t.processing,
    shipped: t.shipped, completed: t.completed, cancelled: t.cancelled
  };

  const themeColors = [
    // Blues
    { name: 'Blue', value: '#0055FF' },
    { name: 'Sky Blue', value: '#0EA5E9' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Navy', value: '#1E3A5F' },
    { name: 'Indigo', value: '#4F46E5' },
    // Purples
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Violet', value: '#7C3AED' },
    { name: 'Fuchsia', value: '#D946EF' },
    // Pinks & Reds
    { name: 'Pink', value: '#EC4899' },
    { name: 'Rose', value: '#F43F5E' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Crimson', value: '#DC2626' },
    // Oranges & Yellows
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Yellow', value: '#EAB308' },
    // Greens
    { name: 'Green', value: '#10B981' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Teal', value: '#14B8A6' },
    // Neutrals & Dark
    { name: 'Slate', value: '#475569' },
    { name: 'Zinc', value: '#71717A' },
    { name: 'Stone', value: '#78716C' },
    { name: 'Black', value: '#18181B' },
    { name: 'Brown', value: '#92400E' },
  ];

  const insertFormatting = (format) => {};

  const quillModulesProduct = { toolbar: [[{ size: ['small', false, 'large', 'huge'] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] };

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const filteredProductsForAttach = products.filter(p =>
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-[#0055FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="shop-owner-dashboard" style={{ '--theme-color': themeColor }}>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} data-testid="sidebar-backdrop" />
      )}

      {/* Sidebar - Desktop: toggle width, Mobile: overlay slide-in */}
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white z-50 transition-all duration-300 w-64 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'} flex flex-col`}>
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <div className={`min-w-0 ${sidebarOpen ? '' : 'lg:hidden'}`}>
            <span className="font-bold text-base truncate block">{shop?.name || t.dashboard}</span>
            <p className="text-xs text-[#94A3B8] truncate">/{shop?.slug}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-white/10 flex-shrink-0 hidden lg:inline-flex">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} className="text-white hover:bg-white/10 flex-shrink-0 lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="flex-1 overflow-y-auto mt-2 pb-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors"
              style={{ backgroundColor: activeTab === item.id ? themeColor : 'transparent' }}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={sidebarOpen ? '' : 'lg:hidden'}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-white/10">
          {shop && (
            <div className={`px-4 pt-3 ${sidebarOpen ? '' : 'lg:hidden'}`}>
              <a href={`${window.location.origin}/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                <ExternalLink className="w-4 h-4" />
                {t.previewShop}
              </a>
            </div>
          )}
          <button onClick={() => { handleLogout(); setMobileSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-red-400 text-sm" data-testid="logout-btn">
            <LogOut className="w-5 h-5" />
            <span className={sidebarOpen ? '' : 'lg:hidden'}>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all p-4 lg:p-6 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <div className="max-w-[1600px] mx-auto">
          {/* Admin Viewing Banner */}
          {isAdminViewing && (
            <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3" data-testid="admin-viewing-banner">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {t.viewingShopAs}: <strong>{shop?.name || '...'}</strong>
                </span>
                {shop?.slug && (
                  <Link to={`/shop/${shop.slug}`} className="text-xs text-amber-600 hover:text-amber-800 underline ml-2" data-testid="admin-view-storefront-link">
                    {t.previewShop}
                  </Link>
                )}
              </div>
              <Link to="/admin">
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" data-testid="back-to-admin-btn">
                  {t.backToAdmin}
                </Button>
              </Link>
            </div>
          )}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)} data-testid="mobile-sidebar-toggle">
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A]">
                  {activeTab === 'overview' && t.dashboard}
                  {activeTab === 'products' && t.products}
                  {activeTab === 'categories' && t.categories}
                  {activeTab === 'posts' && t.posts}
                  {activeTab === 'orders' && t.orders}
                  {activeTab === 'media' && (t.mediaLibrary || 'Thư viện ảnh')}
                  {activeTab === 'megamenu' && (t.megaMenu || 'Mega Menu')}
                  {activeTab === 'layout' && t.displayLayout}
                  {activeTab === 'settings' && t.settings}
                </h1>
                <p className="text-sm text-[#64748B] mt-1">{t.welcomeBack}, {user?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#F1F5F9] rounded-full p-0.5" data-testid="lang-switcher">
                  <button onClick={() => switchLanguage('vi')} className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${lang === 'vi' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`} data-testid="lang-vi">VI</button>
                  <button onClick={() => switchLanguage('en')} className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8] hover:text-[#64748B]'}`} data-testid="lang-en">EN</button>
                </div>
                <NotificationBell className="text-[#64748B] ml-2" />
              </div>
            </div>
            {activeTab === 'products' && (
              <Button onClick={() => navigate('/dashboard/product/new')} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.addProduct}
              </Button>
            )}
            {activeTab === 'categories' && (
              <Button onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.addCategory}
              </Button>
            )}
            {activeTab === 'posts' && (
              <Button onClick={() => { resetPostForm(); setShowPostModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-post-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.addPost}
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && loading && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <Card key={i} className="border-0 shadow-sm"><CardHeader className="p-4 pb-2"><div className="h-3 w-20 bg-[#E2E8F0] rounded animate-pulse" /></CardHeader><CardContent className="p-4 pt-0"><div className="h-7 w-16 bg-[#E2E8F0] rounded animate-pulse" /></CardContent></Card>
                ))}
              </div>
              <Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#F1F5F9] rounded-lg animate-pulse" />)}</CardContent></Card>
            </div>
          )}
          {activeTab === 'overview' && !loading && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.totalProducts}</CardTitle>
                    <Package className="w-4 h-4" style={{ color: themeColor }} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.total_products}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.totalOrders}</CardTitle>
                    <ShoppingCart className="w-4 h-4" style={{ color: themeColor }} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.total_orders}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.pendingOrders}</CardTitle>
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold text-[#0F172A]">{stats.pending_orders}</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                    <CardTitle className="text-xs font-medium text-[#64748B]">{t.totalRevenue}</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-lg lg:text-2xl font-bold text-[#0F172A]">{formatVND(stats.total_revenue)}</div>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{t.recentOrders}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {orders.length === 0 ? (
                    <p className="text-[#64748B] text-center py-8 text-sm">{t.noOrdersYet}</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg cursor-pointer hover:bg-[#EFF6FF]" onClick={() => openOrderDetail(order)}>
                          <div>
                            <p className="font-medium text-[#0F172A] text-sm">{order.id}</p>
                            <p className="text-xs text-[#64748B]">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(order.total_amount)}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && loading && (
            <Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-3"><div className="h-9 w-full bg-[#F1F5F9] rounded animate-pulse" /><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-48 bg-[#F1F5F9] rounded-xl animate-pulse" />)}</div></CardContent></Card>
          )}
          {activeTab === 'products' && !loading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <Input placeholder={t.searchShort} value={dashProductSearch} onChange={(e) => { setDashProductSearch(e.target.value); setProductPage(1); }} className="pl-9 h-9 text-sm rounded-[5px]" data-testid="dash-product-search" />
                  </div>
                  <Select value={dashProductCategory} onValueChange={(v) => { setDashProductCategory(v); setProductPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm rounded-[5px]" data-testid="dash-product-category-filter">
                      <SelectValue placeholder={t.allCategories} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">{t.allCategories}</SelectItem>
                      {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {(() => {
                  let filtered = products;
                  if (dashProductSearch) {
                    const q = dashProductSearch.toLowerCase();
                    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
                  }
                  if (dashProductCategory !== 'all') filtered = filtered.filter(p => p.category_id === dashProductCategory);
                  const PRODUCTS_PER_PAGE = 20;
                  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
                  const currentPage = Math.min(productPage, Math.max(1, totalPages));
                  const paginated = filtered.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);
                  return filtered.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                      <p className="text-[#64748B] text-sm">{t.noProductsYet}</p>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4" data-testid="products-grid">
                      {paginated.map((product) => (
                        <div key={product.id} className="border rounded-[5px] overflow-hidden bg-white hover:shadow-lg transition-shadow">
                          <div className="aspect-square bg-[#F8FAFC] cursor-pointer relative" onClick={() => openProductDetail(product)}>
                            <img src={product.image_url || '/product-fallback.png'} alt={product.name} onError={(e) => { e.target.src = '/product-fallback.png'; }} className="w-full h-full object-cover" />
                            {product.is_featured && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 text-white text-[9px] font-bold rounded-[3px]" style={{ backgroundColor: themeColor }} data-testid={`featured-badge-${product.id}`}>
                                <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />Featured
                              </span>
                            )}
                            {product.type === 'service' && (
                              <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#0F172A] text-white text-[9px] font-bold rounded-[3px]" data-testid={`service-badge-${product.id}`}>
                                Dịch vụ
                              </span>
                            )}
                          </div>
                          <div className="p-2 lg:p-3">
                            <h3 className="font-medium text-[#0F172A] text-xs lg:text-sm truncate cursor-pointer hover:text-[#0055FF]" onClick={() => openProductDetail(product)}>{product.name}</h3>
                            <p className="font-bold mt-1 text-xs lg:text-sm" style={{ color: themeColor }}>{formatVND(product.price)}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {product.category_id && categories.find(c => c.id === product.category_id) && (
                                <span className="text-[10px] lg:text-xs px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] rounded">{categories.find(c => c.id === product.category_id)?.name}</span>
                              )}
                              {product.sku && <p className="text-[10px] lg:text-xs text-[#94A3B8]">SKU: {product.sku}</p>}
                            </div>
                            <div className="flex gap-1 lg:gap-2 mt-2">
                              <Button variant="outline" size="sm" className="flex-1 text-[10px] lg:text-xs h-7 lg:h-8 px-1 lg:px-2 rounded-[5px]" onClick={() => navigate(`/dashboard/product/${product.id}/edit`)} data-testid={`edit-product-${product.id}`}>
                                <Pencil className="w-3 h-3 mr-1" /> {t.edit}
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 lg:h-8 px-1 lg:px-2 rounded-[5px]" onClick={() => handleCopyProductLink(product.id)} data-testid={`copy-product-link-${product.id}`} title="Copy link sản phẩm">
                                <Link2 className="w-3 h-3" />
                              </Button>
                              <Button variant="destructive" size="sm" className="h-7 lg:h-8 px-1 lg:px-2 rounded-[5px]" onClick={() => setProductToDelete(product.id)} data-testid={`delete-product-${product.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => { setProductPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        themeColor={themeColor}
                        testIdPrefix="products"
                      />
                    )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && loading && (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#F1F5F9] rounded-xl animate-pulse" />)}</div>
          )}
          {activeTab === 'categories' && !loading && (
            <div className="space-y-6">
              {/* Category Position Manager */}
              {categories.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{t.manageCategoryPositions}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                      <SortableContext items={[...categories].sort((a, b) => (a.position || 0) - (b.position || 0)).map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2" data-testid="category-position-list">
                          {[...categories].sort((a, b) => (a.position || 0) - (b.position || 0)).map((cat, idx) => (
                            <SortableCategoryItem key={cat.id} cat={cat} idx={idx} themeColor={themeColor} parentName={cat.parent_id ? (categories.find(c => c.id === cat.parent_id)?.name || '') : ''} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              )}

              {/* Category Cards */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {categories.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                      <p className="text-[#64748B] text-sm">{t.noCategoriesYet}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="categories-grid">
                      {[...categories].filter(c => !c.parent_id).sort((a, b) => (a.position || 0) - (b.position || 0)).map((cat) => {
                        const subs = categories.filter(c => c.parent_id === cat.id).sort((a, b) => (a.position || 0) - (b.position || 0));
                        return (
                          <div key={cat.id} className="space-y-1">
                            <div className="p-3 border rounded-lg bg-white flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-[#94A3B8]">#{cat.position || 0}</span>
                                  <h3 className="font-medium text-[#0F172A] text-sm">{cat.name}</h3>
                                </div>
                                <p className="text-xs text-[#64748B]">{cat.description || t.noDescription}</p>
                                {subs.length > 0 && <p className="text-[10px] text-[#94A3B8] mt-1">{subs.length} {t.subCategories.toLowerCase()}</p>}
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '', parent_id: cat.parent_id || '', image_url: cat.image_url || '' }); setShowCategoryModal(true); }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setCategoryToDelete(cat.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {subs.map(sub => (
                              <div key={sub.id} className="p-2.5 ml-4 border border-dashed rounded-lg bg-[#F8FAFC] flex justify-between items-center" data-testid={`sub-cat-${sub.id}`}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#94A3B8]">└</span>
                                    <h3 className="font-medium text-[#0F172A] text-xs">{sub.name}</h3>
                                  </div>
                                  {sub.description && <p className="text-[10px] text-[#64748B] ml-4">{sub.description}</p>}
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(sub); setCategoryForm({ name: sub.name, description: sub.description || '', parent_id: sub.parent_id || '', image_url: sub.image_url || '' }); setShowCategoryModal(true); }}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setCategoryToDelete(sub.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && loading && (
            <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><div className="h-20 bg-[#F1F5F9] rounded-lg animate-pulse" /></CardContent></Card>)}</div>
          )}
          {activeTab === 'orders' && !loading && (
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#0F172A]">Đơn hàng sản phẩm</h3>
                    <span className="text-xs text-[#94A3B8]">{orders.length}</span>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                      <p className="text-[#64748B] text-sm">{t.noOrdersYet}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE).map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                        <div key={order.id} className="border rounded-lg bg-white" data-testid={`order-card-${order.id}`}>
                          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} data-testid={`order-row-${order.id}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-[#0F172A] text-sm hover:text-[#0055FF] transition-colors">{order.id}</p>
                              </div>
                              <p className="text-xs text-[#64748B] mt-0.5">{order.customer_name} - {order.customer_phone}</p>
                              <p className="text-[10px] text-[#94A3B8]">{order.items?.length || 0} {t.items} - {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(order.total_amount)}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                {statusLabels[order.status] || order.status}
                              </span>
                              {order.status === 'pending' && (
                                <Button size="sm" className="h-7 text-xs text-white" style={{ backgroundColor: '#22C55E' }}
                                  onClick={(e) => { e.stopPropagation(); handleOrderStatus(order.id, 'confirmed'); }}
                                  data-testid={`approve-order-${order.id}`}>
                                  <Check className="w-3 h-3 mr-1" /> Duyệt
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} data-testid={`toggle-order-${order.id}`}>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span className="text-[11px]">{isExpanded ? 'Ẩn' : 'Chi tiết'}</span>
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-4" data-testid={`order-details-${order.id}`}>
                              {/* Customer Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-[#E2E8F0]">
                                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase mb-2">Thông tin khách hàng</p>
                                  <div className="space-y-1.5 text-sm">
                                    <p className="text-[#0F172A]"><span className="text-[#64748B]">Tên:</span> <span className="font-medium">{order.customer_name}</span></p>
                                    <p className="text-[#0F172A]">
                                      <span className="text-[#64748B]">SĐT:</span>{' '}
                                      <a href={`tel:${order.customer_phone}`} className="font-medium hover:underline" style={{ color: themeColor }}>{order.customer_phone}</a>
                                    </p>
                                    {order.customer_email && (
                                      <p className="text-[#0F172A] break-all">
                                        <span className="text-[#64748B]">Email:</span>{' '}
                                        <a href={`mailto:${order.customer_email}`} className="font-medium hover:underline" style={{ color: themeColor }}>{order.customer_email}</a>
                                      </p>
                                    )}
                                    {order.customer_address && (
                                      <p className="text-[#0F172A]"><span className="text-[#64748B]">Địa chỉ:</span> <span className="font-medium">{order.customer_address}</span></p>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-[#E2E8F0]">
                                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase mb-2">Thanh toán</p>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-[#64748B]">Tạm tính:</span>
                                      <span className="font-medium text-[#0F172A]">{formatVND(order.subtotal || order.total_amount)}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-[#64748B]">Giảm giá:</span>
                                        <span className="font-medium text-red-500">-{formatVND(order.discount_amount)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between border-t border-[#F1F5F9] pt-1.5">
                                      <span className="text-[#0F172A] font-semibold">Tổng cộng:</span>
                                      <span className="font-bold" style={{ color: themeColor }}>{formatVND(order.total_amount)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Items list */}
                              <div className="bg-white rounded-lg p-3 border border-[#E2E8F0]">
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase mb-2">Sản phẩm ({order.items?.length || 0})</p>
                                <div className="space-y-2" data-testid={`order-items-${order.id}`}>
                                  {(order.items || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded bg-[#F8FAFC]">
                                      <img src={item.image_url || '/product-fallback.png'} alt={item.name} onError={(e) => { e.target.src = '/product-fallback.png'; }} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#0F172A] truncate">{item.name}</p>
                                        <p className="text-xs text-[#64748B]">{formatVND(item.price)} × {item.quantity}</p>
                                      </div>
                                      <p className="text-sm font-semibold" style={{ color: themeColor }}>{formatVND(item.subtotal)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Note */}
                              {order.note && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-amber-700 uppercase mb-1">Ghi chú của khách</p>
                                  <p className="text-sm text-[#0F172A] italic">{order.note}</p>
                                </div>
                              )}

                              {/* Status action bar */}
                              <div className="flex flex-wrap gap-2 pt-1">
                                {['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'].map(s => (
                                  <Button key={s} size="sm" variant={order.status === s ? 'default' : 'outline'}
                                    className={`h-7 text-xs ${order.status === s ? 'text-white' : ''}`}
                                    style={order.status === s ? { backgroundColor: themeColor } : {}}
                                    disabled={order.status === s}
                                    onClick={() => handleOrderStatus(order.id, s)}
                                    data-testid={`set-status-${s}-${order.id}`}>
                                    {statusLabels[s] || s}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Orders Pagination */}
                  {orders.length > ORDERS_PER_PAGE && (
                    <Pagination
                      page={orderPage}
                      totalPages={Math.ceil(orders.length / ORDERS_PER_PAGE)}
                      onPageChange={(p) => { setOrderPage(p); setExpandedOrderId(null); }}
                      themeColor={themeColor}
                      testIdPrefix="orders"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Bookings Section */}
              <Card className="border-0 shadow-sm" data-testid="bookings-section">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#0F172A]">Đơn đặt lịch dịch vụ</h3>
                    <span className="text-xs text-[#94A3B8]">{bookings.length}</span>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                      <p className="text-[#64748B] text-sm">Chưa có đơn đặt lịch nào</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice((bookingPage - 1) * ORDERS_PER_PAGE, bookingPage * ORDERS_PER_PAGE).map((bk) => {
                        const bkStatusColors = {
                          pending: 'bg-amber-100 text-amber-700',
                          confirmed: 'bg-blue-100 text-blue-700',
                          completed: 'bg-green-100 text-green-700',
                          cancelled: 'bg-red-100 text-red-700',
                        };
                        const bkStatusLabels = {
                          pending: 'Chờ xác nhận',
                          confirmed: 'Đã xác nhận',
                          completed: 'Hoàn thành',
                          cancelled: 'Đã hủy',
                        };
                        return (
                          <div key={bk.id} className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-testid={`booking-row-${bk.id}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-[#0F172A] text-sm">{bk.id}</p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0F172A] text-white font-medium">Dịch vụ</span>
                              </div>
                              <p className="text-xs text-[#0F172A] mt-1 font-medium">{bk.service_name} · {formatVND(bk.service_price || 0)}</p>
                              <p className="text-xs text-[#64748B] mt-0.5">{bk.customer_name} - {bk.customer_phone}</p>
                              <p className="text-[11px] text-[#64748B]">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {(() => {
                                  try {
                                    const d = new Date(bk.preferred_datetime);
                                    if (!isNaN(d.getTime())) return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
                                  } catch { }
                                  return bk.preferred_datetime;
                                })()}
                              </p>
                              {bk.note && <p className="text-[11px] text-[#94A3B8] mt-0.5 italic line-clamp-2">Ghi chú: {bk.note}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${bkStatusColors[bk.status] || 'bg-gray-100 text-gray-700'}`}>
                                {bkStatusLabels[bk.status] || bk.status}
                              </span>
                              {bk.status === 'pending' && (
                                <Button size="sm" className="h-7 text-xs text-white" style={{ backgroundColor: '#22C55E' }}
                                  onClick={() => handleBookingStatus(bk.id, 'confirmed')}
                                  data-testid={`confirm-booking-${bk.id}`}>
                                  <Check className="w-3 h-3 mr-1" /> Duyệt
                                </Button>
                              )}
                              {bk.status === 'confirmed' && (
                                <Button size="sm" className="h-7 text-xs text-white" style={{ backgroundColor: themeColor }}
                                  onClick={() => handleBookingStatus(bk.id, 'completed')}
                                  data-testid={`complete-booking-${bk.id}`}>
                                  Hoàn thành
                                </Button>
                              )}
                              {(bk.status === 'pending' || bk.status === 'confirmed') && (
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  onClick={() => handleBookingStatus(bk.id, 'cancelled')}
                                  data-testid={`cancel-booking-${bk.id}`}>
                                  Hủy
                                </Button>
                              )}
                              {bk.customer_phone && (
                                <a href={`tel:${bk.customer_phone}`} className="inline-flex items-center justify-center h-7 w-7 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC]" data-testid={`call-booking-${bk.id}`}>
                                  <Phone className="w-3 h-3 text-[#0F172A]" />
                                </a>
                              )}
                              <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteBooking(bk.id)} data-testid={`delete-booking-${bk.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {bookings.length > ORDERS_PER_PAGE && (
                    <Pagination
                      page={bookingPage}
                      totalPages={Math.ceil(bookings.length / ORDERS_PER_PAGE)}
                      onPageChange={setBookingPage}
                      themeColor={themeColor}
                      testIdPrefix="bookings"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && loading && (
            <Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-[#F1F5F9] rounded-lg animate-pulse" />)}</CardContent></Card>
          )}
          {activeTab === 'posts' && !loading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">{t.noPostsYet}</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="posts-list">
                    {posts.map((post) => (
                      <div key={post.id} className="p-3 border rounded-lg bg-white flex gap-4 items-start" data-testid={`post-row-${post.id}`}>
                        {post.thumbnail && (
                          <img src={post.thumbnail} alt={post.title} className="w-20 h-14 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[#0F172A] text-sm truncate">{post.title}</h4>
                          <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1" dangerouslySetInnerHTML={{ __html: post.description.replace(/<[^>]+>/g, '') }} />
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-[#94A3B8] flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                            {post.attached_products?.length > 0 && (
                              <span className="text-[10px] text-[#94A3B8]">{post.attached_products.length} {t.products.toLowerCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Link to={`/shop/${shop?.slug}/posts/${post.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs" data-testid={`view-post-${post.id}`}>
                              <Eye className="w-3 h-3 mr-1" /> {t.view || 'View'}
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditPost(post)} data-testid={`edit-post-${post.id}`}>
                            <Pencil className="w-3 h-3 mr-1" /> {t.edit}
                          </Button>
                          <Button variant="destructive" size="sm" className="h-8" onClick={() => handleDeletePost(post.id)} data-testid={`delete-post-${post.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}



          {/* Media Library Tab */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">{t.mediaLibrary || 'Thư viện ảnh'}</h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{mediaTotal} ảnh đã upload</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mediaSelected.length > 0 && (
                        <Button type="button" variant="destructive" size="sm" className="text-xs gap-1" onClick={handleBulkDeleteMedia} data-testid="media-bulk-delete-btn">
                          <Trash2 className="w-3 h-3" /> Xóa {mediaSelected.length} ảnh
                        </Button>
                      )}
                      <input type="file" ref={mediaBulkInputRef} onChange={handleBulkUpload} accept="image/*" multiple className="hidden" />
                      <Button type="button" size="sm" style={{ backgroundColor: themeColor }} className="text-xs gap-1 text-white hover:opacity-90" onClick={() => mediaBulkInputRef.current?.click()} disabled={mediaUploading} data-testid="media-bulk-upload-btn">
                        {mediaUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload ảnh
                      </Button>
                    </div>
                  </div>

                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-[#94A3B8]" />
                    </div>
                  ) : mediaList.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#94A3B8] transition-colors" onClick={() => mediaBulkInputRef.current?.click()} data-testid="media-empty-upload">
                      <Image className="w-16 h-16 text-[#E2E8F0] mx-auto mb-3" />
                      <p className="text-sm font-medium text-[#64748B]">Chưa có ảnh nào</p>
                      <p className="text-xs text-[#94A3B8] mt-1">Click để upload hoặc kéo thả ảnh vào đây</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <button type="button" onClick={() => {
                          if (mediaSelected.length === mediaList.length) setMediaSelected([]);
                          else setMediaSelected(mediaList.map(m => m.id));
                        }} className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors" data-testid="media-select-all">
                          {mediaSelected.length === mediaList.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3" data-testid="media-tab-grid">
                        {mediaList.map(item => {
                          const isSelected = mediaSelected.includes(item.id);
                          return (
                            <div key={item.id} className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
                              onClick={() => setMediaSelected(prev => prev.includes(item.id) ? prev.filter(s => s !== item.id) : [...prev, item.id])}
                              data-testid={`media-tab-item-${item.id}`}>
                              <img src={`${API}/files/${item.id}`} alt={item.original_filename} className="w-full h-full object-cover" loading="lazy" />
                              {isSelected && (
                                <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteMedia(item.id); }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`media-tab-delete-${item.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[10px] text-white truncate">{item.original_filename}</p>
                                <p className="text-[9px] text-white/70">{(item.size / 1024).toFixed(0)} KB</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {mediaTotalPages > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
                          {Array.from({ length: mediaTotalPages }, (_, i) => (
                            <Button key={i} type="button" variant={mediaPage === i + 1 ? 'default' : 'outline'} size="sm"
                              className="w-8 h-8 text-xs" onClick={() => fetchMediaList(i + 1)}
                              style={mediaPage === i + 1 ? { backgroundColor: themeColor } : {}}>
                              {i + 1}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {mediaUploading && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-[#64748B]">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang upload...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mega Menu Manager Tab */}
          {activeTab === 'megamenu' && (
            <div className="space-y-6">
            {/* Mega Menu Manager */}
            <Card className="border-0 shadow-sm" data-testid="mega-menu-manager">
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center gap-2"><Grid3X3 className="w-4 h-4" /> {t.megaMenu || 'Mega Menu'}</CardTitle>
                <p className="text-xs text-[#64748B] mt-1">{t.megaMenuDesc || 'Chọn danh mục hiển thị trên thanh mega menu (desktop)'}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {megaMenuItems.length === 0 && (
                  <p className="text-sm text-[#64748B] text-center py-4">{t.noCategories || 'Chưa có danh mục nào'}</p>
                )}
                {megaMenuItems.map((item, idx) => (
                  <div key={item.category_id} className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all ${item.enabled ? 'bg-white border-[#E2E8F0]' : 'bg-[#F8FAFC] border-dashed border-[#E2E8F0] opacity-60'}`} data-testid={`mega-item-${idx}`}>
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => {
                        const items = [...megaMenuItems];
                        [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
                        items.forEach((it, i) => it.position = i);
                        setMegaMenuItems(items);
                      }} data-testid={`mega-up-${idx}`}><ArrowUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === megaMenuItems.length - 1} onClick={() => {
                        const items = [...megaMenuItems];
                        [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
                        items.forEach((it, i) => it.position = i);
                        setMegaMenuItems(items);
                      }} data-testid={`mega-down-${idx}`}><ArrowDown className="w-3 h-3" /></Button>
                    </div>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor + '15' }}>
                        <FolderOpen className="w-4 h-4" style={{ color: themeColor }} />
                      </div>
                    )}
                    <span className="flex-1 text-sm font-medium text-[#0F172A]">{item.name}</span>
                    <button onClick={() => {
                      const items = [...megaMenuItems];
                      items[idx] = { ...items[idx], enabled: !items[idx].enabled };
                      setMegaMenuItems(items);
                    }} className={`w-[68px] h-8 rounded-full transition-all relative overflow-hidden ${item.enabled ? '' : 'bg-[#E2E8F0]'}`}
                      style={item.enabled ? { backgroundColor: themeColor } : {}}
                      data-testid={`mega-toggle-${idx}`}>
                      <span className={`absolute inset-0 flex items-center ${item.enabled ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
                        <span className="text-[10px] font-bold text-white tracking-wide select-none">{item.enabled ? 'BẬT' : ''}</span>
                        <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!item.enabled ? 'TẮT' : ''}</span>
                      </span>
                      <span className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-transform ${item.enabled ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                ))}
                <div className="pt-2">
                  <Button size="sm" className="text-xs hover:opacity-90" style={{ backgroundColor: themeColor }} onClick={async () => {
                    try {
                      await axios.put(`${API}/dashboard/mega-menu${shopQuery}`, { items: megaMenuItems.map(it => ({ category_id: it.category_id, enabled: it.enabled, position: it.position })) });
                      toast.success(t.megaMenuSaved || 'Mega menu đã lưu');
                      fetchMenuOnly();
                    } catch { toast.error(t.failedToSave); }
                  }} data-testid="save-mega-menu-btn">
                    {t.saveChanges}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleLayoutDragEnd}>
                    <SortableContext items={getLayoutSections().map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2" data-testid="layout-sections">
                        {getLayoutSections().map((section, idx) => (
                          <SortableLayoutItem
                            key={section.id}
                            section={section}
                            sectionLabels={buildSectionLabels()}
                            sectionIcons={sectionIcons}
                            themeColor={themeColor}
                            onToggle={() => toggleSection(idx)}
                            onEdit={section.id.startsWith('custom:') ? () => {
                              const csId = section.id.replace('custom:', '');
                              const cs = (shopForm.custom_sections || []).find(x => x.id === csId);
                              if (cs) openEditCustomSection(cs);
                            } : null}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>

              {/* Custom Sections Manager */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> Section tùy chỉnh
                      </CardTitle>
                      <p className="text-sm text-[#64748B] mt-1">
                        Tạo section riêng (tiêu đề + ảnh + nội dung) để hiển thị chen giữa các khối khác ở trang chủ. Tối đa 5 section.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={openCreateCustomSection}
                      disabled={(shopForm.custom_sections || []).length >= 5}
                      className="text-sm flex-shrink-0"
                      style={{ backgroundColor: themeColor }}
                      data-testid="add-custom-section-btn"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Thêm section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2" data-testid="custom-sections-list">
                  {(shopForm.custom_sections || []).length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#94A3B8] border border-dashed border-[#E2E8F0] rounded-[5px]">
                      Chưa có section tùy chỉnh nào. Nhấn "Thêm section" để tạo mới.
                    </div>
                  ) : (
                    (shopForm.custom_sections || []).map((cs) => (
                      <div
                        key={cs.id}
                        className="flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-[5px] bg-white"
                        data-testid={`custom-section-row-${cs.id}`}
                      >
                        <div className="w-12 h-12 rounded-[5px] overflow-hidden bg-[#F8FAFC] flex-shrink-0">
                          {cs.image_url ? (
                            <img src={cs.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-5 h-5 text-[#94A3B8]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#0F172A] truncate">{cs.title || 'Section tùy chỉnh'}</p>
                          <p className="text-[11px] text-[#94A3B8]">
                            {cs.enabled === false ? 'Đã tắt' : 'Đang hiển thị'} · {countWords(cs.content || '')} từ
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => openEditCustomSection(cs)} data-testid={`edit-custom-section-btn-${cs.id}`}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                        </Button>
                        <Button variant="destructive" size="sm" className="text-xs" onClick={() => setCustomSectionToDelete(cs)} data-testid={`delete-custom-section-btn-${cs.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><Image className="w-4 h-4" /> {t.bannerSettings}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2">{t.banners} ({(shopForm.banners || []).length}/8)</label>
                    <div className="flex gap-3 flex-wrap">
                      {(shopForm.banners || []).map((url, idx) => (
                        <div key={idx} className="relative w-40 h-20 rounded-[5px] overflow-hidden bg-[#F8FAFC] border">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeBanner(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs" data-testid={`layout-remove-banner-${idx}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(shopForm.banners || []).length < 8 && (
                        <>
                          <button type="button" onClick={() => openMediaLibrary((urls) => {
                            const current = shopForm.banners || [];
                            const newUrls = Array.isArray(urls) ? urls : [urls];
                            const combined = [...current, ...newUrls].slice(0, 8);
                            setShopForm({ ...shopForm, banners: combined });
                            axios.put(`${API}/dashboard/shop`, { banners: combined });
                            toast.success(`Banner đã cập nhật`);
                          }, { multiple: true, maxSelect: 8 - (shopForm.banners || []).length })}
                            className="w-40 h-20 rounded-[5px] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center gap-1 text-[#94A3B8] hover:border-[#94A3B8] transition-colors"
                            data-testid="layout-add-banner-btn">
                            <Image className="w-5 h-5" />
                            <span className="text-[10px]">{t.addBanner}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && shop && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <Card className="border-0 shadow-sm" data-testid="change-password-card">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: themeColor }} />
                    {t.changePassword || 'Đổi mật khẩu'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const newPwd = e.target.newPassword.value;
                    const confirmPwd = e.target.confirmPassword.value;
                    if (newPwd.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
                    if (newPwd !== confirmPwd) { toast.error('Mật khẩu xác nhận không khớp'); return; }
                    try {
                      await axios.post(`${API}/auth/change-password`, { new_password: newPwd });
                      toast.success('Đổi mật khẩu thành công');
                      e.target.reset();
                    } catch (err) { toast.error(err.response?.data?.detail || 'Lỗi'); }
                  }} className="space-y-3 max-w-sm">
                    <div>
                      <label className="text-xs font-medium text-[#334155] block mb-1">Mật khẩu mới</label>
                      <input name="newPassword" type="password" required minLength={6} placeholder="Nhập mật khẩu mới" className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" data-testid="new-password-input" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#334155] block mb-1">Xác nhận mật khẩu</label>
                      <input name="confirmPassword" type="password" required minLength={6} placeholder="Nhập lại mật khẩu" className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" data-testid="confirm-password-input" />
                    </div>
                    <Button type="submit" className="h-9 text-sm rounded-lg" style={{ backgroundColor: themeColor }} data-testid="change-password-btn">
                      Đổi mật khẩu
                    </Button>
                  </form>
                </CardContent>
              </Card>
              {/* Push Notifications Card */}
              <Card className="border-0 shadow-sm" data-testid="notification-settings-card">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{ color: themeColor }} />
                    {t.orderNotifications || 'Thông báo đơn hàng mới'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <p className="text-sm text-[#64748B]">
                    {t.notificationDesc || 'Nhận thông báo đẩy ngay khi có khách hàng đặt đơn hàng mới trên gian hàng của bạn.'}
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      {notifEnabled ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor + '15' }}>
                          <Bell className="w-5 h-5" style={{ color: themeColor }} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                          <BellOff className="w-5 h-5 text-[#94A3B8]" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {notifEnabled
                            ? (t.notificationsOn || 'Thông báo đang bật')
                            : (t.notificationsOff || 'Thông báo đang tắt')}
                        </p>
                        {notifEnabled && notifDevices > 0 && (
                          <p className="text-xs text-[#64748B]">
                            {notifDevices} {t.devicesSubscribed || 'thiết bị đã đăng ký'}
                          </p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={notifEnabled}
                      onCheckedChange={handleToggleNotifications}
                      disabled={notifLoading}
                      data-testid="notification-toggle"
                    />
                  </div>
                  {!('Notification' in window) && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      {t.pushNotSupported || 'Trình duyệt này không hỗ trợ thông báo đẩy. Hãy sử dụng Chrome, Edge hoặc Firefox.'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Email Notification Card */}
              <Card className="border-0 shadow-sm" data-testid="email-notification-card">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: themeColor }} />
                    {t.emailNotifications || 'Thông báo email đơn hàng'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <p className="text-sm text-[#64748B]">
                    {t.emailNotifDesc || 'Nhận email chi tiết đơn hàng mới gửi đến email liên hệ của gian hàng mỗi khi có khách đặt hàng.'}
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emailNotifEnabled ? '' : 'bg-[#F1F5F9]'}`}
                        style={emailNotifEnabled ? { backgroundColor: themeColor + '15' } : {}}>
                        <Mail className="w-5 h-5" style={{ color: emailNotifEnabled ? themeColor : '#94A3B8' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {emailNotifEnabled
                            ? (t.emailNotifOn || 'Email thông báo đang bật')
                            : (t.emailNotifOff || 'Email thông báo đang tắt')}
                        </p>
                        {emailNotifEnabled && shop?.contact_email && (
                          <p className="text-xs text-[#64748B]">
                            {t.sendTo || 'Gửi đến'}: {shop.contact_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={emailNotifEnabled}
                      onCheckedChange={handleToggleEmailNotifications}
                      disabled={emailNotifLoading}
                      data-testid="email-notification-toggle"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Install App Card */}
              <Card className="border-0 shadow-sm" data-testid="install-app-card">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smartphone className="w-4 h-4" style={{ color: themeColor }} />
                    {t.installApp || 'Cài đặt ứng dụng'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {isAppInstalled ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">{t.appAlreadyInstalled || 'Ứng dụng đã được cài đặt!'}</p>
                        <p className="text-xs text-green-600">{t.appInstalledDesc || 'Bạn có thể mở ứng dụng từ màn hình chính.'}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[#64748B]">
                        {t.installAppDesc || 'Cài đặt ứng dụng lên màn hình chính điện thoại để truy cập nhanh và nhận thông báo đơn hàng ngay cả khi đóng trình duyệt.'}
                      </p>
                      {deferredInstallPrompt ? (
                        <Button
                          onClick={handleInstallPWA}
                          style={{ backgroundColor: themeColor }}
                          className="hover:opacity-90 w-full sm:w-auto"
                          data-testid="install-app-btn"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t.installNow || 'Cài đặt ngay'}
                        </Button>
                      ) : (
                        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <p className="text-sm font-medium text-[#0F172A] mb-2">{t.howToInstall || 'Cách cài đặt:'}</p>
                          <div className="space-y-2 text-xs text-[#64748B]">
                            <p><strong>Android/Chrome:</strong> {t.installAndroid || 'Nhấn vào menu (⋮) → "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng"'}</p>
                            <p><strong>iPhone/Safari:</strong> {t.installIOS || 'Nhấn vào nút Chia sẻ (□↑) → "Thêm vào Màn hình chính"'}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="w-4 h-4" /> {t.shopPreview}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-[#64748B]">{t.shopLiveAt}</p>
                      <p className="font-medium text-[#0F172A]">{window.location.origin}/shop/{shop.slug}</p>
                    </div>
                    <a href={`${window.location.origin}/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm">
                        <ExternalLink className="w-4 h-4 mr-2" /> {t.openShop}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="w-4 h-4" /> {t.customDomain}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-[#94A3B8] mb-3">{t.customDomainHint}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={shopForm.custom_domain || ''} onChange={(e) => setShopForm({ ...shopForm, custom_domain: e.target.value })} placeholder={t.customDomainPlaceholder} className="text-sm flex-1" data-testid="custom-domain-input" />
                    <Button onClick={async () => {
                      try {
                        await axios.put(`${API}/dashboard/shop`, { custom_domain: shopForm.custom_domain || '' });
                        toast.success(t.shopUpdated);
                        const { data: s } = await axios.get(`${API}/dashboard/shop${shopQuery}`);
                        setShop(s); setShopForm(s);
                      } catch (err) { toast.error(t.failedToSave); }
                    }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="save-domain-btn">
                      {t.saveChanges}
                    </Button>
                  </div>
                  {shopForm.custom_domain && (
                    <div className="mt-3 p-3 bg-[#F0F9FF] rounded-lg">
                      <p className="text-xs text-[#0369A1]">CNAME: <code className="bg-white px-2 py-0.5 rounded text-[#0F172A]">{shopForm.custom_domain}</code> → <code className="bg-white px-2 py-0.5 rounded text-[#0F172A]">your-server.com</code></p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> {t.themeColor}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {themeColors.map((color) => (
                      <button key={color.value} onClick={async () => {
                        setThemeColor(color.value);
                        try {
                          await axios.put(`${API}/dashboard/shop`, { theme_color: color.value });
                          toast.success(t.shopUpdated);
                        } catch (err) { toast.error(t.failedToSave); }
                      }}
                        className={`w-8 h-8 rounded-full border-[3px] transition-all hover:scale-110 ${themeColor === color.value ? 'border-[#0F172A] scale-110 ring-2 ring-offset-1 ring-[#0F172A]/20' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }} title={color.name} data-testid={`theme-${color.name.toLowerCase().replace(/\s/g, '-')}`} />
                    ))}
                  </div>
                  {/* Custom hex color */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
                    <div className="relative">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        onBlur={async (e) => {
                          try {
                            await axios.put(`${API}/dashboard/shop`, { theme_color: e.target.value });
                            toast.success(t.shopUpdated);
                          } catch (err) { toast.error(t.failedToSave); }
                        }}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 appearance-none"
                        style={{ WebkitAppearance: 'none' }}
                        data-testid="custom-color-picker"
                      />
                    </div>
                    <Input
                      value={themeColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setThemeColor(v);
                      }}
                      onBlur={async () => {
                        if (/^#[0-9A-Fa-f]{6}$/.test(themeColor)) {
                          try {
                            await axios.put(`${API}/dashboard/shop`, { theme_color: themeColor });
                            toast.success(t.shopUpdated);
                          } catch (err) { toast.error(t.failedToSave); }
                        }
                      }}
                      className="h-8 w-28 text-xs font-mono uppercase"
                      placeholder="#0055FF"
                      maxLength={7}
                      data-testid="custom-color-hex"
                    />
                    <span className="text-xs text-[#94A3B8]">{t.customColor || 'Màu tùy chỉnh'}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> {t.postCarouselPosition}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex gap-3">
                    {['top', 'bottom'].map(pos => (
                      <Button key={pos} variant={shopForm.post_carousel_position === pos ? 'default' : 'outline'}
                        className={`flex-1 text-sm ${shopForm.post_carousel_position === pos ? 'text-white' : ''}`}
                        style={shopForm.post_carousel_position === pos ? { backgroundColor: themeColor } : {}}
                        onClick={async () => {
                          setShopForm({ ...shopForm, post_carousel_position: pos });
                          try {
                            await axios.put(`${API}/dashboard/shop`, { post_carousel_position: pos });
                            toast.success(t.shopUpdated);
                          } catch { toast.error(t.failedToSave); }
                        }}
                        data-testid={`post-position-${pos}`}>
                        {pos === 'top' ? t.postPositionTop : t.postPositionBottom}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><Image className="w-4 h-4" /> {t.bannerSettings}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#334155]">{t.enableBanner}</span>
                    <button onClick={() => toggleShopSetting('banner_enabled')}
                      className={`w-[68px] h-8 rounded-full transition-all relative overflow-hidden ${shopForm.banner_enabled ? '' : 'bg-[#E2E8F0]'}`}
                      style={shopForm.banner_enabled ? { backgroundColor: themeColor } : {}}
                      data-testid="toggle-banner">
                      <span className={`absolute inset-0 flex items-center ${shopForm.banner_enabled ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
                        <span className="text-[10px] font-bold text-white tracking-wide select-none">{shopForm.banner_enabled ? 'BẬT' : ''}</span>
                        <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!shopForm.banner_enabled ? 'TẮT' : ''}</span>
                      </span>
                      <span className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-transform ${shopForm.banner_enabled ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#334155]">{t.enableBlog}</span>
                    <button onClick={() => toggleShopSetting('blog_enabled')}
                      className={`w-[68px] h-8 rounded-full transition-all relative overflow-hidden ${shopForm.blog_enabled ? '' : 'bg-[#E2E8F0]'}`}
                      style={shopForm.blog_enabled ? { backgroundColor: themeColor } : {}}
                      data-testid="toggle-blog">
                      <span className={`absolute inset-0 flex items-center ${shopForm.blog_enabled ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
                        <span className="text-[10px] font-bold text-white tracking-wide select-none">{shopForm.blog_enabled ? 'BẬT' : ''}</span>
                        <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!shopForm.blog_enabled ? 'TẮT' : ''}</span>
                      </span>
                      <span className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-transform ${shopForm.blog_enabled ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">{t.banners} ({(shopForm.banners || []).length}/8)</label>
                    <div className="flex gap-3 flex-wrap">
                      {(shopForm.banners || []).map((url, idx) => (
                        <div key={idx} className="relative w-40 h-20 rounded-[5px] overflow-hidden bg-[#F8FAFC] border">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => removeBanner(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs" data-testid={`remove-banner-${idx}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(shopForm.banners || []).length < 8 && (
                        <>
                          <button type="button" onClick={() => openMediaLibrary((urls) => {
                            const current = shopForm.banners || [];
                            const newUrls = Array.isArray(urls) ? urls : [urls];
                            const combined = [...current, ...newUrls].slice(0, 8);
                            setShopForm({ ...shopForm, banners: combined });
                            axios.put(`${API}/dashboard/shop`, { banners: combined });
                            toast.success(`Banner đã cập nhật`);
                          }, { multiple: true, maxSelect: 8 - (shopForm.banners || []).length })}
                            className="w-40 h-20 rounded-[5px] border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center gap-1 text-[#94A3B8] hover:border-[#94A3B8] transition-colors"
                            data-testid="add-banner-btn">
                            <Image className="w-5 h-5" />
                            <span className="text-[10px]">{t.addBanner}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">{t.shopProfile}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <form onSubmit={handleSaveShop} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.shopName}</label>
                        <Input value={shopForm.name || ''} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} className="text-sm" data-testid="shop-name-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.shopUrl}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#64748B]">/shop/</span>
                          <Input value={shopForm.slug || shop?.slug || ''} onChange={(e) => setShopForm({ ...shopForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })} className="text-sm flex-1" data-testid="shop-slug-input" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.description}</label>
                      <Textarea value={shopForm.description || ''} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} rows={3} className="text-sm" data-testid="shop-description-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.logoUrl}</label>
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#E2E8F0] overflow-hidden flex items-center justify-center bg-[#F8FAFC] shrink-0" data-testid="shop-logo-preview">
                          {shopForm.logo_url ? (
                            <img src={shopForm.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-[#94A3B8]">{shopForm.name?.[0] || '?'}</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input value={shopForm.logo_url || ''} onChange={(e) => setShopForm({ ...shopForm, logo_url: e.target.value })} placeholder="https://..." className="text-sm" data-testid="shop-logo-input" />
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => openMediaLibrary((url) => {
                              setShopForm({ ...shopForm, logo_url: url });
                            })} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E2E8F0] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors" data-testid="shop-logo-upload-btn">
                              <Image className="w-3.5 h-3.5" />
                              {t.uploadLogo || 'Chọn ảnh'}
                            </button>
                            {shopForm.logo_url && (
                              <button type="button" onClick={() => setShopForm({ ...shopForm, logo_url: '' })} className="text-xs text-red-500 hover:underline" data-testid="shop-logo-remove-btn">
                                {t.remove || 'Xóa'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.contactPhone}</label>
                        <Input value={shopForm.contact_phone || ''} onChange={(e) => setShopForm({ ...shopForm, contact_phone: e.target.value })} className="text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">{t.contactEmail}</label>
                        <Input value={shopForm.contact_email || ''} onChange={(e) => setShopForm({ ...shopForm, contact_email: e.target.value })} className="text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.shopAddress}</label>
                      <Input value={shopForm.address || ''} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} className="text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Google Maps URL</label>
                      <Input value={shopForm.google_map_url || ''} onChange={(e) => setShopForm({ ...shopForm, google_map_url: e.target.value })} className="text-sm" placeholder="https://maps.app.goo.gl/..." data-testid="google-map-url-input" />
                      <p className="text-[10px] text-[#94A3B8] mt-1">Dán link Google Maps để hiện nút Bản đồ chính xác trên storefront</p>
                    </div>

                    {/* Social / Marketplace Links */}
                    <div className="pt-3 border-t border-[#E2E8F0]">
                      <p className="text-sm font-semibold text-[#0F172A] mb-1">Mạng xã hội & Sàn TMĐT</p>
                      <p className="text-[11px] text-[#94A3B8] mb-3">Các link này hiển thị trên trang Liên hệ và footer để khách kết nối với bạn.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                            <Facebook className="w-3.5 h-3.5 text-[#1877F2]" /> Facebook
                          </label>
                          <Input
                            value={shopForm.social_facebook || ''}
                            onChange={(e) => setShopForm({ ...shopForm, social_facebook: e.target.value })}
                            placeholder="https://facebook.com/..."
                            className="text-sm"
                            data-testid="shop-social-facebook"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                            <span className="inline-block w-3.5 h-3.5 bg-black rounded-sm flex items-center justify-center text-white text-[8px] font-bold">T</span>
                            TikTok
                          </label>
                          <Input
                            value={shopForm.social_tiktok || ''}
                            onChange={(e) => setShopForm({ ...shopForm, social_tiktok: e.target.value })}
                            placeholder="https://tiktok.com/@..."
                            className="text-sm"
                            data-testid="shop-social-tiktok"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5 text-[#E4405F]" /> Instagram
                          </label>
                          <Input
                            value={shopForm.social_instagram || ''}
                            onChange={(e) => setShopForm({ ...shopForm, social_instagram: e.target.value })}
                            placeholder="https://instagram.com/..."
                            className="text-sm"
                            data-testid="shop-social-instagram"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#EE4D2D]" /> Shopee
                          </label>
                          <Input
                            value={shopForm.social_shopee || ''}
                            onChange={(e) => setShopForm({ ...shopForm, social_shopee: e.target.value })}
                            placeholder="https://shopee.vn/shop..."
                            className="text-sm"
                            data-testid="shop-social-shopee"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="save-shop-btn">
                      {t.saveChanges}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>


      {/* Custom Section Modal */}
      <Dialog open={showCustomSectionModal} onOpenChange={setShowCustomSectionModal}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto" data-testid="custom-section-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingCustomSection ? 'Sửa section tùy chỉnh' : 'Tạo section tùy chỉnh'}</DialogTitle>
            <DialogDescription className="text-sm">Section sẽ hiển thị trên trang chủ ở vị trí bạn sắp xếp trong danh sách bố cục.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCustomSection} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Tiêu đề section *</label>
              <Input
                value={customSectionForm.title}
                onChange={(e) => setCustomSectionForm({ ...customSectionForm, title: e.target.value })}
                required
                maxLength={200}
                placeholder="VD: Câu chuyện thương hiệu"
                className="text-sm"
                data-testid="custom-section-title-input"
              />
            </div>
            {/* Title level + alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-2">Cấp tiêu đề</label>
                <div className="flex gap-1" data-testid="custom-section-title-level">
                  {[
                    { k: 'h1', label: 'H1', cls: 'text-xl' },
                    { k: 'h2', label: 'H2', cls: 'text-lg' },
                    { k: 'h3', label: 'H3', cls: 'text-base' },
                  ].map(opt => {
                    const sel = customSectionForm.title_level === opt.k;
                    return (
                      <button key={opt.k} type="button"
                        onClick={() => setCustomSectionForm({ ...customSectionForm, title_level: opt.k })}
                        className={`flex-1 py-2 px-1 rounded-[5px] border font-semibold transition-colors ${opt.cls} ${sel ? 'text-white border-transparent' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
                        style={sel ? { backgroundColor: themeColor } : {}}
                        data-testid={`title-level-${opt.k}`}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2">Căn lề tiêu đề</label>
                <div className="flex gap-1" data-testid="custom-section-title-align">
                  {[
                    { k: 'left', label: 'Trái', Icon: AlignLeft },
                    { k: 'center', label: 'Giữa', Icon: AlignCenter },
                    { k: 'right', label: 'Phải', Icon: AlignRight },
                  ].map(({ k, label, Icon }) => {
                    const sel = customSectionForm.title_align === k;
                    return (
                      <button key={k} type="button"
                        onClick={() => setCustomSectionForm({ ...customSectionForm, title_align: k })}
                        className={`flex-1 py-2 rounded-[5px] border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${sel ? 'text-white border-transparent' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}
                        style={sel ? { backgroundColor: themeColor } : {}}
                        data-testid={`title-align-${k}`}>
                        <Icon className="w-3.5 h-3.5" /> <span className="text-[11px]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">Ảnh minh hoạ (tùy chọn)</label>
              {customSectionForm.image_url ? (
                <div className="relative w-40 h-28 rounded-[5px] overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] mb-2">
                  <img src={customSectionForm.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCustomSectionForm({ ...customSectionForm, image_url: '' })}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                    data-testid="custom-section-remove-image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => openMediaLibrary((url) => setCustomSectionForm((prev) => ({ ...prev, image_url: Array.isArray(url) ? url[0] : url })), { multiple: false, maxSelect: 1 })}
                data-testid="custom-section-pick-image"
              >
                <Image className="w-3.5 h-3.5 mr-1" /> {customSectionForm.image_url ? 'Đổi ảnh' : 'Chọn ảnh'}
              </Button>
            </div>
            {/* Video URL (YouTube) */}
            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-red-500" /> YouTube Video URL <span className="text-[#94A3B8] font-normal">(tùy chọn)</span>
              </label>
              <Input
                value={customSectionForm.video_url || ''}
                onChange={(e) => setCustomSectionForm({ ...customSectionForm, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                maxLength={500}
                className="text-sm"
                data-testid="custom-section-video-input"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Hỗ trợ URL youtube.com/watch, youtu.be hoặc youtube.com/embed.</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium">Nội dung</label>
                <span className={`text-[10px] ${countWords(customSectionForm.content) > 1000 ? 'text-red-500 font-bold' : 'text-[#94A3B8]'}`}>
                  {countWords(customSectionForm.content)}/1000 {t.wordCount || 'từ'}
                </span>
              </div>
              <ReactQuill
                theme="snow"
                value={customSectionForm.content}
                onChange={(val) => setCustomSectionForm({ ...customSectionForm, content: val })}
                modules={quillModulesProduct}
                className="bg-white [&_.ql-container]:min-h-[160px]"
                data-testid="custom-section-content-input"
              />
            </div>

            {/* Drag & drop element order */}
            <div>
              <label className="block text-xs font-medium mb-2">Thứ tự hiển thị các thành phần</label>
              <p className="text-[11px] text-[#94A3B8] mb-2">Kéo để sắp xếp — ẩn thành phần bằng cách để trống dữ liệu tương ứng.</p>
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const order = customSectionForm.element_order || ['title', 'image', 'video', 'content'];
                  const oldIdx = order.indexOf(active.id);
                  const newIdx = order.indexOf(over.id);
                  if (oldIdx < 0 || newIdx < 0) return;
                  const next = arrayMove(order, oldIdx, newIdx);
                  setCustomSectionForm({ ...customSectionForm, element_order: next });
                }}>
                <SortableContext items={customSectionForm.element_order || ['title', 'image', 'video', 'content']} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5" data-testid="custom-section-element-order">
                    {(customSectionForm.element_order || ['title', 'image', 'video', 'content']).map((elKey) => (
                      <SortableElementRow key={elKey} elKey={elKey} themeColor={themeColor} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowCustomSectionModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm text-white" style={{ backgroundColor: themeColor }} data-testid="save-custom-section-btn">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation */}
      <Dialog open={!!categoryToDelete} onOpenChange={(o) => !o && setCategoryToDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-white" data-testid="delete-category-dialog">
          <DialogHeader>
            <DialogTitle className="text-base">Xóa danh mục?</DialogTitle>
            <DialogDescription className="text-sm text-[#475569]">
              {t.deleteConfirmCategory || 'Bạn chắc chắn muốn xóa danh mục này? Các danh mục con và sản phẩm trong danh mục sẽ không bị xóa nhưng sẽ không còn được gán danh mục.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setCategoryToDelete(null)} data-testid="delete-category-cancel">{t.cancel}</Button>
            <Button type="button" variant="destructive" className="flex-1 text-sm" onClick={() => handleDeleteCategory()} data-testid="delete-category-confirm">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Delete Confirmation */}
      <Dialog open={!!productToDelete} onOpenChange={(o) => !o && setProductToDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-white" data-testid="delete-product-dialog">
          <DialogHeader>
            <DialogTitle className="text-base">Xóa sản phẩm?</DialogTitle>
            <DialogDescription className="text-sm text-[#475569]">
              {t.deleteConfirmProduct || 'Bạn chắc chắn muốn xóa sản phẩm này? Hành động không thể hoàn tác.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setProductToDelete(null)} data-testid="delete-product-cancel">{t.cancel}</Button>
            <Button type="button" variant="destructive" className="flex-1 text-sm" onClick={() => handleDeleteProduct()} data-testid="delete-product-confirm">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Section Delete Confirmation */}
      <Dialog open={!!customSectionToDelete} onOpenChange={(o) => !o && setCustomSectionToDelete(null)}>        <DialogContent className="sm:max-w-sm bg-white" data-testid="delete-custom-section-dialog">
          <DialogHeader>
            <DialogTitle className="text-base">Xóa section?</DialogTitle>
            <DialogDescription className="text-sm text-[#475569]">
              Section <strong className="text-[#0F172A]">"{customSectionToDelete?.title}"</strong> sẽ bị xóa khỏi cả danh sách bố cục và trang chủ. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setCustomSectionToDelete(null)} data-testid="delete-custom-section-cancel">{t.cancel}</Button>
            <Button type="button" variant="destructive" className="flex-1 text-sm" onClick={() => handleDeleteCustomSection()} data-testid="delete-custom-section-confirm">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="category-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingCategory ? t.editCategory : t.addCategory}</DialogTitle>
            <DialogDescription className="text-sm">{t.enterCategoryDetails}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.categoryName} *</label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required className="text-sm" data-testid="category-name-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.categoryDescription}</label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={2} className="text-sm" data-testid="category-description-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.parentCategory}</label>
              <Select value={categoryForm.parent_id || '__none__'} onValueChange={(val) => setCategoryForm({ ...categoryForm, parent_id: val === '__none__' ? '' : val })}>
                <SelectTrigger className="text-sm" data-testid="category-parent-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="__none__">{t.noParent}</SelectItem>
                  {categories.filter(c => !c.parent_id && c.id !== editingCategory?.id).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.categoryImage}</label>
              <div className="flex items-center gap-3">
                {categoryForm.image_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                    <img src={categoryForm.image_url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setCategoryForm({ ...categoryForm, image_url: '' })}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]" data-testid="category-image-remove">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#CBD5E1] flex items-center justify-center bg-[#F8FAFC] flex-shrink-0">
                    <Image className="w-5 h-5 text-[#94A3B8]" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <button type="button" onClick={() => openMediaLibrary((url) => {
                    setCategoryForm({ ...categoryForm, image_url: url });
                  })} className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors w-full">
                    <Image className="w-4 h-4 text-[#64748B]" />
                    <span className="text-xs text-[#334155]">{t.uploadImage || 'Chọn ảnh'}</span>
                  </button>
                  <Input value={categoryForm.image_url} onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })} placeholder="https://..." className="text-xs h-8" data-testid="category-image-input" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowCategoryModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-category-btn">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto" data-testid="order-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{t.orderDetails}</DialogTitle>
            <DialogDescription className="text-sm">{t.orderId}: {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg text-sm">
                <div>
                  <p className="text-xs text-[#64748B]">{t.customerName}</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{t.phone}</p>
                  <p className="font-medium">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{t.email}</p>
                  <p className="font-medium">{selectedOrder.customer_email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{t.address}</p>
                  <p className="font-medium">{selectedOrder.customer_address}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm">{t.items}</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[#64748B]">{t.quantity}: {item.quantity} x {formatVND(item.price)}</p>
                      </div>
                      <p className="font-bold" style={{ color: themeColor }}>{formatVND(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg space-y-1.5">
                {selectedOrder.subtotal && selectedOrder.discount_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Tạm tính</span>
                      <span>{formatVND(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Giảm giá</span>
                      <span className="text-green-600">-{formatVND(selectedOrder.discount_amount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{t.total}</span>
                  <span className="text-xl font-bold" style={{ color: themeColor }}>{formatVND(selectedOrder.total_amount)}</span>
                </div>
              </div>
              {selectedOrder.note && (
                <div className="p-3 border rounded-lg text-sm">
                  <p className="text-xs text-[#64748B]">{t.note}</p>
                  <p>{selectedOrder.note}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#64748B]">{t.status}:</span>
                <Select value={selectedOrder.status} onValueChange={(val) => { handleOrderStatus(selectedOrder.id, val); setSelectedOrder({ ...selectedOrder, status: val }); }}>
                  <SelectTrigger className="w-36 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="confirmed">{t.confirmed}</SelectItem>
                    <SelectItem value="processing">{t.processing}</SelectItem>
                    <SelectItem value="shipped">{t.shipped}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto" data-testid="post-modal">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingPost ? t.editPost : t.addPost}</DialogTitle>
            <DialogDescription className="text-sm">{t.postDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePost} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.postTitle} *</label>
              <Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required className="text-sm" data-testid="post-title-input" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.postThumbnail}</label>
              <div className="flex items-center gap-3">
                {postForm.thumbnail && (
                  <div className="relative w-24 h-16 rounded overflow-hidden bg-[#F8FAFC]">
                    <img src={postForm.thumbnail} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPostForm({ ...postForm, thumbnail: '' })} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => openMediaLibrary((url) => {
                  setPostForm({ ...postForm, thumbnail: url });
                })} data-testid="post-thumbnail-upload">
                  <Image className="w-3 h-3 mr-1" /> {t.uploadImage}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.postImages}</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(postForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative w-20 h-14 rounded overflow-hidden bg-[#F8FAFC]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPostForm({ ...postForm, images: postForm.images.filter((_, i) => i !== idx) })} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {(postForm.images || []).length < 3 && (
                  <>
                    <Button type="button" variant="outline" size="sm" className="text-xs h-14 w-20" onClick={() => openMediaLibrary((urls) => {
                      const current = postForm.images || [];
                      const newUrls = Array.isArray(urls) ? urls : [urls];
                      setPostForm({ ...postForm, images: [...current, ...newUrls].slice(0, 3) });
                    }, { multiple: true, maxSelect: 3 - (postForm.images || []).length })} data-testid="post-images-upload">
                      <Image className="w-4 h-4 mr-1" /> {(postForm.images || []).length}/3
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium">{t.postDescription} *</label>
                <span className={`text-[10px] ${countWords(postForm.description) > 1000 ? 'text-red-500 font-bold' : 'text-[#94A3B8]'}`} data-testid="post-word-count">
                  {countWords(postForm.description)}/1000 {t.wordCount}
                </span>
              </div>
              <ReactQuill theme="snow" value={postForm.description} onChange={(val) => setPostForm({ ...postForm, description: val })} modules={quillModules} className="bg-white [&_.ql-container]:min-h-[200px]" data-testid="post-editor" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">{t.attachProducts}</label>
              {(postForm.attached_products || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(postForm.attached_products || []).map(pid => {
                    const prod = products.find(p => p.id === pid);
                    if (!prod) return null;
                    return (
                      <div key={pid} className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5px] px-2 py-1">
                        <img src={prod.image_url} alt={prod.name} className="w-6 h-6 rounded object-cover" />
                        <span className="text-xs text-[#0F172A] max-w-[120px] truncate">{prod.name}</span>
                        <button type="button" onClick={() => toggleProductAttach(pid)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Input
                placeholder={t.searchShort || 'Search...'}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="text-sm mb-2 rounded-[5px]"
                data-testid="post-product-search"
              />
              <div className="max-h-40 overflow-y-auto border rounded-[5px] p-1" data-testid="post-product-attach">
                {filteredProductsForAttach.map(prod => {
                  const isAttached = (postForm.attached_products || []).includes(prod.id);
                  return (
                    <button type="button" key={prod.id} onClick={() => toggleProductAttach(prod.id)}
                      className={`w-full flex items-center gap-2 p-1.5 rounded-[5px] text-left transition-all mb-0.5 ${isAttached ? 'bg-blue-50 border border-blue-200' : 'hover:bg-[#F8FAFC]'}`}
                      data-testid={`attach-product-${prod.id}`}>
                      <img src={prod.image_url} alt={prod.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      <span className="text-xs text-[#0F172A] flex-1 truncate">{prod.name}</span>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0">{formatVND(prod.price)}</span>
                      {isAttached && <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0" style={{ backgroundColor: themeColor }}>✓</span>}
                    </button>
                  );
                })}
                {filteredProductsForAttach.length === 0 && (
                  <p className="text-xs text-[#94A3B8] text-center py-3">{t.noProducts}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowPostModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-post-btn">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      <MediaLibrary
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(urls) => { if (mediaCallback) mediaCallback(urls); }}
        multiple={mediaMultiple}
        maxSelect={mediaMaxSelect}
      />
    </div>
  );
};

export default ShopOwnerDashboard;
