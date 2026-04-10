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
  Bell, BellOff, Smartphone, Download, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import NotificationBell from '../components/NotificationBell';
import MediaLibrary from '../components/MediaLibrary';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LINK_TYPES = [
  { value: 'external', label: 'URL', icon: '🔗' },
  { value: 'page', label: 'Trang', icon: '📄' },
  { value: 'category', label: 'Danh mục', icon: '📁' },
  { value: 'post', label: 'Bài viết', icon: '📝' },
  { value: 'product', label: 'Sản phẩm', icon: '📦' },
];

const FooterLinkPicker = ({ value, linkType, onChange, shopSlug, categories, products, posts, customPages, testIdPrefix }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const type = linkType || 'external';

  const getItems = () => {
    const q = search.toLowerCase();
    switch (type) {
      case 'page': return (customPages || []).filter(p => p.title?.toLowerCase().includes(q)).map(p => ({ id: p.id, name: p.title, url: `/shop/${shopSlug}/page/${p.slug || p.id}` }));
      case 'category': {
        const allCatOption = { id: 'all-categories', name: 'Tất cả danh mục', url: `/shop/${shopSlug}/categories` };
        const catItems = (categories || []).filter(c => c.name?.toLowerCase().includes(q)).map(c => ({ id: c.id, name: c.name, url: `/shop/${shopSlug}/category/${c.id}` }));
        return [allCatOption, ...catItems].filter(i => i.name.toLowerCase().includes(q));
      }
      case 'post': return (posts || []).filter(p => p.title?.toLowerCase().includes(q)).map(p => ({ id: p.id, name: p.title, url: `/shop/${shopSlug}/posts/${p.id}` }));
      case 'product': return (products || []).filter(p => p.name?.toLowerCase().includes(q)).map(p => ({ id: p.id, name: p.name, url: `/shop/${shopSlug}?product=${p.id}` }));
      default: return [];
    }
  };

  if (type === 'external') {
    return (
      <div className="flex gap-1" data-testid={testIdPrefix}>
        <div className="flex border border-[#E2E8F0] rounded-md overflow-hidden flex-1">
          <select value={type} onChange={e => onChange('', e.target.value)} className="text-[10px] bg-[#F8FAFC] border-r border-[#E2E8F0] px-1.5 outline-none text-[#64748B] cursor-pointer" data-testid={`${testIdPrefix}-type`}>
            {LINK_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.icon} {lt.label}</option>)}
          </select>
          <input value={value} onChange={e => onChange(e.target.value, 'external')} placeholder="https://..." className="flex-1 text-xs h-7 px-2 outline-none min-w-0" data-testid={`${testIdPrefix}-input`} />
        </div>
      </div>
    );
  }

  const items = getItems();
  const selectedItem = items.find(i => i.url === value);

  return (
    <div className="relative" data-testid={testIdPrefix}>
      <div className="flex border border-[#E2E8F0] rounded-md overflow-hidden">
        <select value={type} onChange={e => { onChange('', e.target.value); setSearch(''); }} className="text-[10px] bg-[#F8FAFC] border-r border-[#E2E8F0] px-1.5 outline-none text-[#64748B] cursor-pointer" data-testid={`${testIdPrefix}-type`}>
          {LINK_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.icon} {lt.label}</option>)}
        </select>
        <div className="flex-1 relative">
          <input
            value={open ? search : (selectedItem?.name || value || '')}
            onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={`Tìm ${LINK_TYPES.find(l => l.value === type)?.label?.toLowerCase()}...`}
            className="w-full text-xs h-7 px-2 outline-none"
            data-testid={`${testIdPrefix}-search`}
          />
          {selectedItem && !open && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-green-600">&#10003;</span>}
        </div>
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-md shadow-lg max-h-40 overflow-y-auto" data-testid={`${testIdPrefix}-dropdown`}>
          {items.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#94A3B8]">Không tìm thấy kết quả</div>
          ) : items.map(item => (
            <button key={item.id} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#F1F5F9] transition-colors flex items-center justify-between ${value === item.url ? 'bg-[#F1F5F9] font-medium' : ''}`}
              onClick={() => { onChange(item.url, type); setOpen(false); setSearch(''); }}
              data-testid={`${testIdPrefix}-option-${item.id}`}
            >
              <span className="truncate">{item.name}</span>
              {value === item.url && <span className="text-green-600 text-[10px] ml-2 shrink-0">&#10003;</span>}
            </button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />}
    </div>
  );
};


const MENU_LINK_TYPES = [
  { value: 'external', label: 'URL', icon: '🔗' },
  { value: 'quick', label: 'Liên kết nhanh', icon: '⚡' },
  { value: 'page', label: 'Trang', icon: '📄' },
  { value: 'category', label: 'Danh mục', icon: '📁' },
  { value: 'post', label: 'Bài viết', icon: '📝' },
  { value: 'product', label: 'Sản phẩm', icon: '📦' },
];

const MenuLinkPicker = ({ value, linkType, onChange, shopSlug, categories, products, posts, customPages, testIdPrefix }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const type = linkType || 'external';

  const getItems = () => {
    const q = search.toLowerCase();
    switch (type) {
      case 'quick': return [
        { id: 'home', name: 'Trang chủ', url: `/shop/${shopSlug}` },
        { id: 'categories', name: 'Danh mục', url: `/shop/${shopSlug}/categories` },
        { id: 'posts', name: 'Bài viết', url: `/shop/${shopSlug}/posts` },
        { id: 'contact', name: 'Liên hệ', url: `/shop/${shopSlug}/contact` },
      ].filter(i => i.name.toLowerCase().includes(q));
      case 'page': return (customPages || []).filter(p => p.title?.toLowerCase().includes(q)).map(p => ({ id: p.id, name: p.title, url: `/shop/${shopSlug}/page/${p.slug || p.id}` }));
      case 'category': {
        const allCatOpt = { id: 'all-categories', name: 'Tất cả danh mục', url: `/shop/${shopSlug}/categories` };
        const catList = (categories || []).filter(c => c.name?.toLowerCase().includes(q)).map(c => ({ id: c.id, name: c.name, url: `/shop/${shopSlug}/category/${c.id}` }));
        return [allCatOpt, ...catList].filter(i => i.name.toLowerCase().includes(q));
      }
      case 'post': return (posts || []).filter(p => p.title?.toLowerCase().includes(q)).map(p => ({ id: p.id, name: p.title, url: `/shop/${shopSlug}/posts/${p.id}` }));
      case 'product': return (products || []).filter(p => p.name?.toLowerCase().includes(q)).map(p => ({ id: p.id, name: p.name, url: `/shop/${shopSlug}?product=${p.id}` }));
      default: return [];
    }
  };

  if (type === 'external') {
    return (
      <div data-testid={testIdPrefix}>
        <div className="flex border border-[#E2E8F0] rounded-md overflow-hidden">
          <select value={type} onChange={e => onChange('', e.target.value, null)} className="text-[10px] bg-[#F8FAFC] border-r border-[#E2E8F0] px-1.5 outline-none text-[#64748B] cursor-pointer" data-testid={`${testIdPrefix}-type`}>
            {MENU_LINK_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.icon} {lt.label}</option>)}
          </select>
          <input value={value} onChange={e => onChange(e.target.value, 'external', null)} placeholder="https://..." className="flex-1 text-xs h-8 px-2 outline-none min-w-0" data-testid={`${testIdPrefix}-input`} />
        </div>
      </div>
    );
  }

  const items = getItems();
  const selectedItem = items.find(i => i.url === value);

  return (
    <div className="relative" data-testid={testIdPrefix}>
      <div className="flex border border-[#E2E8F0] rounded-md overflow-hidden">
        <select value={type} onChange={e => { onChange('', e.target.value, null); setSearch(''); }} className="text-[10px] bg-[#F8FAFC] border-r border-[#E2E8F0] px-1.5 outline-none text-[#64748B] cursor-pointer" data-testid={`${testIdPrefix}-type`}>
          {MENU_LINK_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.icon} {lt.label}</option>)}
        </select>
        <div className="flex-1 relative">
          <input
            value={open ? search : (selectedItem?.name || value || '')}
            onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={`Tìm ${MENU_LINK_TYPES.find(l => l.value === type)?.label?.toLowerCase()}...`}
            className="w-full text-xs h-8 px-2 outline-none"
            data-testid={`${testIdPrefix}-search`}
          />
          {selectedItem && !open && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-green-600">&#10003;</span>}
        </div>
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-md shadow-lg max-h-48 overflow-y-auto" data-testid={`${testIdPrefix}-dropdown`}>
          {items.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#94A3B8]">Không tìm thấy kết quả</div>
          ) : items.map(item => (
            <button key={item.id} className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F1F5F9] transition-colors flex items-center justify-between ${value === item.url ? 'bg-[#F1F5F9] font-medium' : ''}`}
              onClick={() => { onChange(item.url, type, item.name); setOpen(false); setSearch(''); }}
              data-testid={`${testIdPrefix}-option-${item.id}`}
            >
              <span className="truncate">{item.name}</span>
              {value === item.url && <span className="text-green-600 text-[10px] ml-2 shrink-0">&#10003;</span>}
            </button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />}
    </div>
  );
};


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
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [themeColor, setThemeColor] = useState('#0055FF');

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailActiveImage, setDetailActiveImage] = useState(0);
  const [detailShowVideo, setDetailShowVideo] = useState(false);
  const [posts, setPosts] = useState([]);

  const [productForm, setProductForm] = useState({ name: '', price: '', category_id: '', description: '', image_url: '', images: [], stock: '', position: '', video_url: '', video_links: [], sku: '', is_featured: false });
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

  const openMediaLibrary = (callback, { multiple = false, maxSelect = 1 } = {}) => {
    setMediaCallback(() => callback);
    setMediaMultiple(multiple);
    setMediaMaxSelect(maxSelect);
    setMediaOpen(true);
  };

  // Custom Pages state
  const [customPages, setCustomPages] = useState([]);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pageForm, setPageForm] = useState({ title: '', sections: [], is_published: true });

  // Menu Manager state
  const [shopMenuItems, setShopMenuItems] = useState([]);
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
      const [statsRes, shopRes, productsRes, categoriesRes, ordersRes, postsRes, pagesRes, menuRes, megaMenuRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats${shopQuery}`),
        axios.get(`${API}/dashboard/shop${shopQuery}`),
        axios.get(`${API}/dashboard/products${shopQuery}`),
        axios.get(`${API}/dashboard/categories${shopQuery}`),
        axios.get(`${API}/dashboard/orders${shopQuery}`),
        axios.get(`${API}/dashboard/posts${shopQuery}`),
        axios.get(`${API}/dashboard/pages${shopQuery}`),
        axios.get(`${API}/dashboard/menu${shopQuery}`),
        axios.get(`${API}/dashboard/mega-menu${shopQuery}`)
      ]);
      setStats(statsRes.data);
      setShop(shopRes.data);
      setShopForm(shopRes.data);
      if (shopRes.data.theme_color) setThemeColor(shopRes.data.theme_color);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      setPosts(postsRes.data || []);
      setCustomPages(pagesRes.data || []);
      setShopMenuItems(menuRes.data || []);
      setMegaMenuItems(megaMenuRes.data || []);
    } catch (err) {
      toast.error(t.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const currentCount = (productForm.images || []).length;
    const remaining = 8 - currentCount;
    if (remaining <= 0) { toast.error('Tối đa 8 ảnh / Maximum 8 images'); return; }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) toast.info(`Chỉ upload ${remaining} ảnh (tối đa 8)`);
    try {
      setUploading(true);
      const uploaded = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axios.post(`${API}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploaded.push(data.url || `${API}/files/${data.id}`);
      }
      const newImages = [...(productForm.images || []), ...uploaded];
      setProductForm({ ...productForm, images: newImages, image_url: newImages[0] });
      toast.success(`${uploaded.length} ảnh đã tải lên`);
    } catch (err) {
      toast.error(err.response?.data?.detail || t.uploadFailed);
    } finally {
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeProductImage = (idx) => {
    const newImages = productForm.images.filter((_, i) => i !== idx);
    setProductForm({ ...productForm, images: newImages, image_url: newImages[0] || '' });
  };

  const setAsThumbnail = (idx) => {
    if (idx === 0) return;
    const newImages = [...productForm.images];
    const [moved] = newImages.splice(idx, 1);
    newImages.unshift(moved);
    setProductForm({ ...productForm, images: newImages, image_url: newImages[0] });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        ...productForm, 
        price: parseInt(productForm.price), 
        stock: parseInt(productForm.stock) || 0,
        position: parseInt(productForm.position) || 0,
        category_id: productForm.category_id === "none" ? null : productForm.category_id || null,
        images: productForm.images || [],
        video_url: productForm.video_url || '',
        video_links: (productForm.video_links || []).filter(v => v.trim()),
        sku: productForm.sku || '',
        is_featured: productForm.is_featured || false,
        image_url: productForm.images?.length > 0 ? productForm.images[0] : productForm.image_url
      };
      if (editingProduct) {
        await axios.put(`${API}/dashboard/products/${editingProduct.id}`, data);
        toast.success(t.productUpdated);
      } else {
        await axios.post(`${API}/dashboard/products`, data);
        toast.success(t.productCreated);
      }
      setShowProductModal(false);
      resetProductForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || t.failedToSave);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm(t.deleteConfirmProduct)) return;
    try {
      await axios.delete(`${API}/dashboard/products/${prodId}`);
      toast.success(t.productDeleted);
      fetchData();
    } catch (err) {
      toast.error(t.failedToDelete);
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || 'none',
      description: product.description || '',
      image_url: product.image_url,
      images: product.images || (product.image_url ? [product.image_url] : []),
      stock: (product.stock || 0).toString(),
      position: (product.position || 0).toString(),
      video_url: product.video_url || '',
      video_links: product.video_links || [],
      sku: product.sku || '',
      is_featured: product.is_featured || false
    });
    setShowProductModal(true);
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailActiveImage(0);
    setDetailShowVideo(false);
    setShowProductDetailModal(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', category_id: '', description: '', image_url: '', images: [], stock: '', position: '', video_url: '', video_links: [], sku: '', is_featured: false });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
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
      fetchData();
    } catch (err) {
      toast.error(t.failedToSave);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm(t.deleteConfirmCategory)) return;
    try {
      await axios.delete(`${API}/dashboard/categories/${catId}`);
      toast.success(t.categoryDeleted);
      fetchData();
    } catch (err) {
      toast.error(t.failedToDelete);
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
      fetchData();
    } catch (err) {
      toast.error(t.failedToSave);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/dashboard/orders/${orderId}/status`, { status });
      toast.success(t.orderStatusUpdated);
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
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
      fetchData();
    } catch (err) {
      toast.error(t.failedToUpdate);
    }
  };

  // Post methods
  const countWords = (html) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (countWords(postForm.description) > 2000) { toast.error(t.maxWordsReached); return; }
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
      fetchData();
    } catch (err) { toast.error(t.failedToSave); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm(t.deleteConfirmPost)) return;
    try {
      await axios.delete(`${API}/dashboard/posts/${postId}`);
      toast.success(t.postDeleted);
      fetchData();
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
    products: t.sectionProducts,
  };

  const sectionIcons = {
    banner: Image,
    categories: FolderOpen,
    blog: FileText,
    featured: TrendingUp,
    products: Package,
  };

  const getLayoutSections = () => {
    const sections = shopForm.layout_sections;
    return (sections && sections.length > 0) ? sections : [
      { id: 'banner', label: 'Banner', enabled: true },
      { id: 'categories', label: 'Categories', enabled: true },
      { id: 'blog', label: 'Blog', enabled: true },
      { id: 'featured', label: 'Featured Products', enabled: true },
      { id: 'products', label: 'Products', enabled: true }
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
    setShopForm({ ...shopForm, layout_sections: sections });
    try {
      await axios.put(`${API}/dashboard/shop`, { layout_sections: sections });
      toast.success(t.shopUpdated);
    } catch { toast.error(t.failedToSave); }
  };

  const menuItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'products', label: t.products, icon: Package },
    { id: 'categories', label: t.categories, icon: FolderOpen },
    { id: 'posts', label: t.posts, icon: FileText },
    { id: 'pages', label: t.customPages, icon: Globe },
    { id: 'orders', label: t.orders, icon: ShoppingCart },
    { id: 'menu', label: t.menuManager, icon: Navigation },
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

  if (authLoading || loading) {
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
      <aside className={`fixed top-0 left-0 h-full bg-[#0F172A] text-white z-50 transition-all duration-300 w-64 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}`}>
        <div className="p-4 flex items-center justify-between">
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
        
        <nav className="mt-4">
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

        {shop && (
          <div className={`px-4 mt-4 ${sidebarOpen ? '' : 'lg:hidden'}`}>
            <a href={`${window.location.origin}/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
              <ExternalLink className="w-4 h-4" />
              {t.previewShop}
            </a>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
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
                  {activeTab === 'pages' && t.customPages}
                  {activeTab === 'orders' && t.orders}
                  {activeTab === 'menu' && t.menuManager}
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
              <Button onClick={() => { resetProductForm(); setShowProductModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-product-btn">
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
            {activeTab === 'pages' && customPages.length < 10 && (
              <Button onClick={() => { setEditingPage(null); setPageForm({ title: '', sections: [], is_published: true }); setShowPageModal(true); }} style={{ backgroundColor: themeColor }} className="hover:opacity-90 text-sm" data-testid="add-page-btn">
                <Plus className="w-4 h-4 mr-2" /> {t.createPage}
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
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
          {activeTab === 'products' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <Input placeholder={t.searchShort} value={dashProductSearch} onChange={(e) => setDashProductSearch(e.target.value)} className="pl-9 h-9 text-sm rounded-[5px]" data-testid="dash-product-search" />
                  </div>
                  <Select value={dashProductCategory} onValueChange={setDashProductCategory}>
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
                  return filtered.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                      <p className="text-[#64748B] text-sm">{t.noProductsYet}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4" data-testid="products-grid">
                      {filtered.map((product) => (
                        <div key={product.id} className="border rounded-[5px] overflow-hidden bg-white hover:shadow-lg transition-shadow">
                          <div className="aspect-square bg-[#F8FAFC] cursor-pointer relative" onClick={() => openProductDetail(product)}>
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            {product.is_featured && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 text-white text-[9px] font-bold rounded-[3px]" style={{ backgroundColor: themeColor }} data-testid={`featured-badge-${product.id}`}>
                                <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />Featured
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
                              <p className="text-[10px] lg:text-xs text-[#64748B]">{t.stock}: {product.stock || 0}</p>
                              {product.sku && <p className="text-[10px] lg:text-xs text-[#94A3B8]">SKU: {product.sku}</p>}
                            </div>
                            <div className="flex gap-1 lg:gap-2 mt-2">
                              <Button variant="outline" size="sm" className="flex-1 text-[10px] lg:text-xs h-7 lg:h-8 px-1 lg:px-2 rounded-[5px]" onClick={() => openEditProduct(product)} data-testid={`edit-product-${product.id}`}>
                                <Pencil className="w-3 h-3 mr-1" /> {t.edit}
                              </Button>
                              <Button variant="destructive" size="sm" className="h-7 lg:h-8 px-1 lg:px-2 rounded-[5px]" onClick={() => handleDeleteProduct(product.id)} data-testid={`delete-product-${product.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Category Position Manager */}
              {categories.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{t.manageCategoryPositions}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2" data-testid="category-position-list">
                      {[...categories].sort((a, b) => (a.position || 0) - (b.position || 0)).map((cat, idx) => (
                        <div key={cat.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-lg" data-testid={`cat-position-${cat.id}`}>
                          <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm text-[#0055FF] border">{idx + 1}</span>
                          <span className="flex-1 font-medium text-sm text-[#0F172A]">{cat.name}</span>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={idx === 0}
                              onClick={() => handleMoveCategoryPosition(cat.id, 'up')} data-testid={`cat-move-up-${cat.id}`}>
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={idx === categories.length - 1}
                              onClick={() => handleMoveCategoryPosition(cat.id, 'down')} data-testid={`cat-move-down-${cat.id}`}>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
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
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteCategory(sub.id)}>
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
          {activeTab === 'orders' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">{t.noOrdersYet}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openOrderDetail(order)} data-testid={`order-row-${order.id}`}>
                          <p className="font-medium text-[#0F172A] text-sm hover:text-[#0055FF] transition-colors">{order.id}</p>
                          <p className="text-xs text-[#64748B]">{order.customer_name} - {order.customer_phone}</p>
                          <p className="text-xs text-[#64748B]">{order.items?.length || 0} {t.items}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-sm" style={{ color: themeColor }}>{formatVND(order.total_amount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => openOrderDetail(order)} data-testid={`view-order-${order.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
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


          {/* Custom Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-4" data-testid="pages-tab">
              {customPages.length >= 10 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-[5px] p-3 text-sm text-yellow-700">{t.maxPagesReached}</div>
              )}
              {customPages.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <Globe className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#64748B] text-sm">{t.noCustomPages}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {customPages.map(pg => (
                    <Card key={pg.id} className="border-0 shadow-sm" data-testid={`page-card-${pg.id}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-[#0F172A] truncate">{pg.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${pg.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {pg.is_published ? t.published : t.draft}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-0.5">/page/{pg.slug} &middot; {pg.sections?.length || 0} {t.pageSections.toLowerCase()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {pg.is_published && (
                            <a href={`/shop/${shop?.slug}/page/${pg.slug}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`view-page-${pg.id}`}><Eye className="w-3.5 h-3.5 text-[#64748B]" /></Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            const url = `${window.location.origin}/shop/${shop?.slug}/page/${pg.slug}`;
                            navigator.clipboard.writeText(url);
                            toast.success(t.linkCopied);
                          }} data-testid={`copy-page-link-${pg.id}`}><Copy className="w-3.5 h-3.5 text-[#64748B]" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingPage(pg);
                            setPageForm({ title: pg.title, sections: JSON.parse(JSON.stringify(pg.sections || [])), is_published: pg.is_published });
                            setShowPageModal(true);
                          }} data-testid={`edit-page-${pg.id}`}><Pencil className="w-3.5 h-3.5 text-[#64748B]" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                            if (!window.confirm(t.confirmDeletePage)) return;
                            try {
                              await axios.delete(`${API}/dashboard/pages/${pg.id}`);
                              toast.success(t.pageDeleted);
                              fetchData();
                            } catch { toast.error(t.failedToSave); }
                          }} data-testid={`delete-page-${pg.id}`}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Menu Manager Tab */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
            <Card className="border-0 shadow-sm" data-testid="menu-manager-tab">
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center gap-2"><Navigation className="w-4 h-4" /> {t.menuItems}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {shopMenuItems.length === 0 && (
                  <p className="text-sm text-[#64748B] text-center py-6">{t.noMenuItems}</p>
                )}
                {shopMenuItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border border-[#E2E8F0] rounded-[5px]" data-testid={`menu-item-${idx}`}>
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => {
                        const items = [...shopMenuItems];
                        [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
                        items.forEach((it, i) => it.position = i);
                        setShopMenuItems(items);
                      }} data-testid={`menu-up-${idx}`}><ArrowUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === shopMenuItems.length - 1} onClick={() => {
                        const items = [...shopMenuItems];
                        [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
                        items.forEach((it, i) => it.position = i);
                        setShopMenuItems(items);
                      }} data-testid={`menu-down-${idx}`}><ArrowDown className="w-3 h-3" /></Button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input value={item.label} onChange={(e) => {
                        const items = [...shopMenuItems]; items[idx] = { ...items[idx], label: e.target.value }; setShopMenuItems(items);
                      }} placeholder={t.menuItemLabel} className="text-sm h-8" data-testid={`menu-label-${idx}`} />
                      <MenuLinkPicker
                        value={item.url || ''}
                        linkType={item.link_type || (item.url?.startsWith('http') ? 'external' : item.url?.includes('/page/') ? 'page' : item.url?.includes('/posts/') ? 'post' : item.url?.includes('/category/') ? 'category' : item.url?.includes('?product=') ? 'product' : item.url ? 'quick' : 'external')}
                        onChange={(url, linkType, autoLabel) => {
                          const items = [...shopMenuItems];
                          items[idx] = { ...items[idx], url, link_type: linkType };
                          if (autoLabel && !items[idx].label) items[idx].label = autoLabel;
                          setShopMenuItems(items);
                        }}
                        shopSlug={shop?.slug}
                        categories={categories}
                        products={products}
                        posts={posts}
                        customPages={customPages}
                        testIdPrefix={`menu-link-${idx}`}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      const items = [...shopMenuItems]; items[idx] = { ...items[idx], enabled: !items[idx].enabled }; setShopMenuItems(items);
                    }} data-testid={`menu-toggle-${idx}`}>
                      {item.enabled ? <Eye className="w-3.5 h-3.5 text-green-600" /> : <EyeOff className="w-3.5 h-3.5 text-[#94A3B8]" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setShopMenuItems(shopMenuItems.filter((_, i) => i !== idx));
                    }} data-testid={`menu-remove-${idx}`}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  {shopMenuItems.length < 10 && (
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      const newItem = { id: `mi-${Date.now()}`, label: '', url: '', type: 'internal', enabled: true, position: shopMenuItems.length };
                      setShopMenuItems([...shopMenuItems, newItem]);
                    }} data-testid="add-menu-item-btn">
                      <Plus className="w-3 h-3 mr-1" /> {t.addMenuItem}
                    </Button>
                  )}
                  {shopMenuItems.length >= 10 && (
                    <span className="text-xs text-yellow-600">{t.maxMenuItemsReached}</span>
                  )}
                  <Button size="sm" className="text-xs hover:opacity-90" style={{ backgroundColor: themeColor }} onClick={async () => {
                    try {
                      await axios.put(`${API}/dashboard/menu`, { items: shopMenuItems });
                      toast.success(t.menuSaved);
                      fetchData();
                    } catch { toast.error(t.failedToSave); }
                  }} data-testid="save-menu-btn">
                    {t.saveChanges}
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                      fetchData();
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
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> {t.displayLayout}</CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">{t.layoutDescription}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2" data-testid="layout-sections">
                    {getLayoutSections().map((section, idx) => {
                      const IconComp = sectionIcons[section.id] || Package;
                      return (
                        <div key={section.id} className={`flex items-center gap-3 p-3 rounded-[5px] border transition-all ${section.enabled ? 'bg-white border-[#E2E8F0]' : 'bg-[#F8FAFC] border-dashed border-[#E2E8F0] opacity-60'}`} data-testid={`layout-section-${section.id}`}>
                          <GripVertical className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                          <div className="w-8 h-8 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: section.enabled ? themeColor + '15' : '#F1F5F9' }}>
                            <IconComp className="w-4 h-4" style={{ color: section.enabled ? themeColor : '#94A3B8' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#0F172A]">{sectionLabels[section.id] || section.label}</p>
                            <p className="text-[10px] text-[#94A3B8]">{t.position}: {idx + 1}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex flex-col gap-0.5">
                              <Button variant="ghost" size="icon" className="w-6 h-6" disabled={idx === 0} onClick={() => moveSection(idx, 'up')} data-testid={`move-up-${section.id}`}>
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-6 h-6" disabled={idx === getLayoutSections().length - 1} onClick={() => moveSection(idx, 'down')} data-testid={`move-down-${section.id}`}>
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                            <button onClick={() => toggleSection(idx)}
                              className={`w-[68px] h-8 rounded-full transition-all relative overflow-hidden ${section.enabled ? '' : 'bg-[#E2E8F0]'}`}
                              style={section.enabled ? { backgroundColor: themeColor } : {}}
                              data-testid={`toggle-section-${section.id}`}>
                              <span className={`absolute inset-0 flex items-center ${section.enabled ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
                                <span className="text-[10px] font-bold text-white tracking-wide select-none">{section.enabled ? 'BẬT' : ''}</span>
                                <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!section.enabled ? 'TẮT' : ''}</span>
                              </span>
                              <span className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-transform ${section.enabled ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

              {/* Footer Settings */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> {t.footerSettings}</CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">{t.footerDescription}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4" data-testid="footer-settings">
                  {(shopForm.footer_columns || []).map((col, idx) => (
                    <div key={idx} className="p-3 border border-[#E2E8F0] rounded-[5px] space-y-3" data-testid={`footer-col-editor-${idx}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#64748B]">{t.footerColumn} {idx + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-700" onClick={async () => {
                          const newCols = (shopForm.footer_columns || []).filter((_, i) => i !== idx);
                          setShopForm({ ...shopForm, footer_columns: newCols });
                          try {
                            await axios.put(`${API}/dashboard/shop`, { footer_columns: newCols });
                            toast.success(t.footerSaved);
                          } catch { toast.error(t.failedToSave); }
                        }} data-testid={`remove-footer-col-${idx}`}>
                          <Trash2 className="w-3 h-3 mr-1" /> {t.removeFooterColumn}
                        </Button>
                      </div>
                      <Input
                        value={col.title}
                        onChange={(e) => {
                          const newCols = [...(shopForm.footer_columns || [])];
                          newCols[idx] = { ...newCols[idx], title: e.target.value };
                          setShopForm({ ...shopForm, footer_columns: newCols });
                        }}
                        placeholder={t.footerColumnTitle}
                        className="text-sm"
                        data-testid={`footer-col-title-${idx}`}
                      />
                      {/* Footer items with text + optional link */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wide">{t.footerItems}</label>
                        {(col.items || []).map((item, itemIdx) => (
                          <div key={itemIdx} className="flex gap-2 items-start" data-testid={`footer-item-${idx}-${itemIdx}`}>
                            <div className="flex-1 space-y-1">
                              <Input
                                value={item.text}
                                onChange={(e) => {
                                  const newCols = [...(shopForm.footer_columns || [])];
                                  const newItems = [...(newCols[idx].items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], text: e.target.value };
                                  newCols[idx] = { ...newCols[idx], items: newItems };
                                  setShopForm({ ...shopForm, footer_columns: newCols });
                                }}
                                placeholder={t.footerItemText}
                                className="text-sm h-8"
                                data-testid={`footer-item-text-${idx}-${itemIdx}`}
                              />
                              <FooterLinkPicker
                                value={item.url || ''}
                                linkType={item.link_type || 'external'}
                                onChange={(url, linkType) => {
                                  const newCols = [...(shopForm.footer_columns || [])];
                                  const newItems = [...(newCols[idx].items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], url, link_type: linkType };
                                  newCols[idx] = { ...newCols[idx], items: newItems };
                                  setShopForm({ ...shopForm, footer_columns: newCols });
                                }}
                                shopSlug={shop?.slug}
                                categories={categories}
                                products={products}
                                posts={posts}
                                customPages={customPages}
                                testIdPrefix={`footer-item-url-${idx}-${itemIdx}`}
                              />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 flex-shrink-0 mt-0" onClick={() => {
                              const newCols = [...(shopForm.footer_columns || [])];
                              const newItems = (newCols[idx].items || []).filter((_, i) => i !== itemIdx);
                              newCols[idx] = { ...newCols[idx], items: newItems };
                              setShopForm({ ...shopForm, footer_columns: newCols });
                            }} data-testid={`remove-footer-item-${idx}-${itemIdx}`}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => {
                          const newCols = [...(shopForm.footer_columns || [])];
                          const newItems = [...(newCols[idx].items || []), { text: '', url: '' }];
                          newCols[idx] = { ...newCols[idx], items: newItems };
                          setShopForm({ ...shopForm, footer_columns: newCols });
                        }} data-testid={`add-footer-item-${idx}`}>
                          <Plus className="w-3 h-3 mr-1" /> {t.addFooterItem}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3">
                    {(shopForm.footer_columns || []).length < 4 && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                        const newCols = [...(shopForm.footer_columns || []), { title: '', items: [{ text: '', url: '' }] }];
                        setShopForm({ ...shopForm, footer_columns: newCols });
                      }} data-testid="add-footer-col-btn">
                        <Plus className="w-3 h-3 mr-1" /> {t.addFooterColumn}
                      </Button>
                    )}
                    <Button size="sm" className="text-xs hover:opacity-90" style={{ backgroundColor: themeColor }} onClick={async () => {
                      try {
                        await axios.put(`${API}/dashboard/shop`, { footer_columns: shopForm.footer_columns || [] });
                        toast.success(t.footerSaved);
                        fetchData();
                      } catch { toast.error(t.failedToSave); }
                    }} data-testid="save-footer-btn">
                      {t.saveChanges}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && shop && (
            <div className="space-y-6">
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
                        fetchData();
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
                        <Input value={`/${shop.slug}`} disabled className="bg-[#F8FAFC] text-sm" />
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

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto" hideClose data-testid="product-modal" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-lg">{editingProduct ? t.editProduct : t.addProduct}</DialogTitle>
            <DialogDescription className="text-sm">{t.fillProductDetails}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={() => setShowProductModal(false)}
            className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
            data-testid="product-modal-close-btn">
            <X className="w-4 h-4" />
          </button>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.productName} *</label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required className="text-sm" data-testid="product-name-input" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">{t.productPrice} *</label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required className="text-sm" data-testid="product-price-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.stock}</label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="text-sm" data-testid="product-stock-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SKU</label>
                <Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="text-sm" placeholder="e.g. WH-001" data-testid="product-sku-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t.position}</label>
                <Input type="number" value={productForm.position} onChange={(e) => setProductForm({ ...productForm, position: e.target.value })} className="text-sm" placeholder="0" data-testid="product-position-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.category}</label>
              <Select value={productForm.category_id || "none"} onValueChange={(val) => {
                if (val === '__create_new__') {
                  setCategoryForm({ name: '', description: '', parent_id: '', image_url: '' });
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                } else {
                  setProductForm({ ...productForm, category_id: val });
                }
              }}>
                <SelectTrigger className="text-sm" data-testid="product-category-select">
                  <SelectValue placeholder={t.selectCategory} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">{t.none}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.parent_id ? `└ ${cat.name}` : cat.name}</SelectItem>
                  ))}
                  <div className="border-t border-[#E2E8F0] mt-1 pt-1">
                    <SelectItem value="__create_new__" className="text-[#0055FF] font-medium">
                      + {t.addCategory || 'Thêm danh mục mới'}
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-[5px]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: productForm.is_featured ? themeColor : '#94A3B8' }} />
                <span className="text-sm font-medium text-[#0F172A]">{t.featuredProducts || 'Featured Product'}</span>
              </div>
              <button type="button" onClick={() => setProductForm({ ...productForm, is_featured: !productForm.is_featured })}
                className={`w-[68px] h-8 rounded-full transition-all relative overflow-hidden ${productForm.is_featured ? '' : 'bg-[#E2E8F0]'}`}
                style={productForm.is_featured ? { backgroundColor: themeColor } : {}}
                data-testid="product-featured-toggle">
                <span className={`absolute inset-0 flex items-center ${productForm.is_featured ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
                  <span className="text-[10px] font-bold text-white tracking-wide select-none">{productForm.is_featured ? 'BẬT' : ''}</span>
                  <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!productForm.is_featured ? 'TẮT' : ''}</span>
                </span>
                <span className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-transform ${productForm.is_featured ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.productImages}</label>
              <div className="space-y-2">
                {productForm.images?.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="product-images-preview">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F8FAFC] group cursor-pointer"
                        onClick={() => setAsThumbnail(idx)} title={idx === 0 ? '' : (t.setAsThumbnail || 'Set as thumbnail')}>
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeProductImage(idx); }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          data-testid={`remove-image-${idx}`}>
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#0055FF]/80 text-white text-[9px] text-center py-0.5" data-testid="thumbnail-badge">Thumbnail</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openMediaLibrary((urls) => {
                    const current = productForm.images || [];
                    const newImages = Array.isArray(urls) ? urls : [urls];
                    const combined = [...current, ...newImages].slice(0, 8);
                    setProductForm({ ...productForm, images: combined, image_url: combined[0] || '' });
                  }, { multiple: true, maxSelect: 8 - (productForm.images || []).length })} disabled={(productForm.images || []).length >= 8} className="text-xs" data-testid="upload-image-btn">
                    <Image className="w-4 h-4 mr-1" /> {t.addMoreImages} ({(productForm.images || []).length}/8)
                  </Button>
                </div>
                <Input
                  placeholder={t.orPasteUrl}
                  className="text-sm"
                  data-testid="product-image-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const url = e.target.value.trim();
                      if (url) {
                        const newImages = [...(productForm.images || []), url];
                        setProductForm({ ...productForm, images: newImages, image_url: newImages[0] });
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.videoLinks}</label>
              <p className="text-[10px] text-[#94A3B8] mb-2">{t.videoLinksDesc}</p>
              <div className="space-y-2">
                {(productForm.video_links || []).map((vl, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={vl} onChange={(e) => {
                      const newLinks = [...(productForm.video_links || [])];
                      newLinks[idx] = e.target.value;
                      setProductForm({ ...productForm, video_links: newLinks });
                    }} placeholder={t.videoLinkPlaceholder} className="text-sm flex-1" data-testid={`product-video-link-${idx}`} />
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400" type="button" onClick={() => {
                      const newLinks = (productForm.video_links || []).filter((_, i) => i !== idx);
                      setProductForm({ ...productForm, video_links: newLinks });
                    }} data-testid={`remove-video-link-${idx}`}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                {(productForm.video_links || []).length < 4 && (
                  <Button variant="outline" size="sm" className="text-xs" type="button" onClick={() => {
                    setProductForm({ ...productForm, video_links: [...(productForm.video_links || []), ''] });
                  }} data-testid="add-video-link-btn">
                    <Plus className="w-3 h-3 mr-1" /> {t.addVideoLink}
                  </Button>
                )}
                {(productForm.video_links || []).length >= 4 && (
                  <span className="text-[10px] text-yellow-600">{t.maxVideoLinks}</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t.description}</label>
              <ReactQuill theme="snow" value={productForm.description} onChange={(val) => setProductForm({ ...productForm, description: val })} modules={quillModulesProduct} className="bg-white [&_.ql-container]:min-h-[120px]" data-testid="product-description-input" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 text-sm" onClick={() => setShowProductModal(false)}>{t.cancel}</Button>
              <Button type="submit" className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} data-testid="save-product-btn">{t.save}</Button>
            </div>
          </form>
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
              <div className="flex justify-between items-center p-3 bg-[#F8FAFC] rounded-lg">
                <span className="font-medium text-sm">{t.total}</span>
                <span className="text-xl font-bold" style={{ color: themeColor }}>{formatVND(selectedOrder.total_amount)}</span>
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

      {/* Product Detail Modal */}
      <Dialog open={showProductDetailModal} onOpenChange={(v) => { setShowProductDetailModal(v); if (!v) { setDetailActiveImage(0); setDetailShowVideo(false); } }}>
        <DialogContent className="sm:max-w-3xl bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto" data-testid="product-detail-modal">
          <DialogDescription className="sr-only">{t.productDetail}</DialogDescription>
          {selectedProduct && (() => {
            const images = selectedProduct.images?.length > 0 ? selectedProduct.images : [selectedProduct.image_url];
            const getVideoEmbed = (url) => {
              if (!url) return null;
              const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
              const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
              if (ttMatch) return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
              return null;
            };
            const allVideoEmbeds = [];
            const mainEmbed = getVideoEmbed(selectedProduct.video_url);
            if (mainEmbed) allVideoEmbeds.push(mainEmbed);
            (selectedProduct.video_links || []).forEach(vl => {
              const embed = getVideoEmbed(vl);
              if (embed) allVideoEmbeds.push(embed);
            });
            return (
              <div className="grid md:grid-cols-2">
                <div className="flex flex-col">
                  <div className="aspect-square bg-[#F8FAFC] relative overflow-hidden">
                    {detailShowVideo !== false && allVideoEmbeds[detailShowVideo] ? (
                      <iframe src={allVideoEmbeds[detailShowVideo]} title="Product video" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : (
                      <img src={images[detailActiveImage]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  {(images.length > 1 || allVideoEmbeds.length > 0) && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button key={idx} onClick={() => { setDetailActiveImage(idx); setDetailShowVideo(false); }}
                          className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${detailShowVideo === false && detailActiveImage === idx ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-transparent hover:border-[#E2E8F0]'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {allVideoEmbeds.map((_, vidIdx) => (
                        <button key={`vid-${vidIdx}`} onClick={() => setDetailShowVideo(vidIdx)}
                          className={`w-14 h-14 rounded-lg flex-shrink-0 border-2 transition-all flex items-center justify-center bg-[#0F172A] ${detailShowVideo === vidIdx ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-transparent hover:border-[#E2E8F0]'}`}>
                          <Play className="w-5 h-5 text-white fill-white" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col">
                  <h2 className="text-xl font-bold text-[#0F172A] mb-2">{selectedProduct.name}</h2>
                  <p className="text-2xl font-bold mb-4" style={{ color: themeColor }}>{formatVND(selectedProduct.price)}</p>
                  <p className="text-sm text-[#64748B] mb-2">{t.stock}: {selectedProduct.stock || 0}</p>
                  {selectedProduct.description && (
                    <div className="text-sm text-[#334155] mb-4 flex-1 prose prose-sm max-w-none break-words [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                  )}
                  <div className="flex gap-3 mt-auto pt-4">
                    <Button variant="outline" className="flex-1 text-sm" onClick={(e) => { e.stopPropagation(); setShowProductDetailModal(false); setTimeout(() => openEditProduct(selectedProduct), 100); }} data-testid="product-detail-edit-btn">
                      <Pencil className="w-4 h-4 mr-2" /> {t.editProduct}
                    </Button>
                    <Button className="flex-1 text-sm hover:opacity-90" style={{ backgroundColor: themeColor }} onClick={() => setShowProductDetailModal(false)}>
                      {t.close}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
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
                <span className={`text-[10px] ${countWords(postForm.description) > 2000 ? 'text-red-500 font-bold' : 'text-[#94A3B8]'}`}>
                  {countWords(postForm.description)}/2000 {t.wordCount}
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

      {/* Custom Page Modal */}
      <Dialog open={showPageModal} onOpenChange={setShowPageModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white" hideClose data-testid="page-modal" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-lg">{editingPage ? t.editPage : t.createPage}</DialogTitle>
            <DialogDescription className="text-sm">{t.customPages}</DialogDescription>
          </DialogHeader>
          <button type="button" onClick={() => setShowPageModal(false)}
            className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
            data-testid="page-modal-close-btn">
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">{t.pageTitleLabel} *</label>
              <Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} placeholder={t.pageTitleLabel} className="text-sm" data-testid="page-title-input" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium">{t.published}:</label>
              <button type="button" onClick={() => setPageForm({ ...pageForm, is_published: !pageForm.is_published })}
                className={`relative w-[68px] h-8 rounded-full transition-all overflow-hidden ${pageForm.is_published ? '' : 'bg-[#E2E8F0]'}`}
                style={{ backgroundColor: pageForm.is_published ? themeColor : undefined }}
                data-testid="page-publish-toggle">
                <span className={`absolute inset-0 flex items-center ${pageForm.is_published ? 'justify-start pl-2.5' : 'justify-end pr-2.5'}`}>
                  <span className="text-[10px] font-bold text-white tracking-wide select-none">{pageForm.is_published ? 'BẬT' : ''}</span>
                  <span className="text-[10px] font-bold text-[#94A3B8] tracking-wide select-none">{!pageForm.is_published ? 'TẮT' : ''}</span>
                </span>
                <span className={`absolute top-[3px] w-[26px] h-[26px] rounded-full bg-white shadow-md transition-transform ${pageForm.is_published ? 'translate-x-[38px]' : 'translate-x-[3px]'}`} />
              </button>
              <span className="text-xs text-[#64748B]">{pageForm.is_published ? t.published : t.draft}</span>
            </div>

            {/* Sections */}
            <div>
              <label className="block text-xs font-medium mb-2">{t.pageSections} ({pageForm.sections.length})</label>
              <div className="space-y-3">
                {pageForm.sections.map((section, idx) => (
                  <div key={idx} className="p-3 border border-[#E2E8F0] rounded-[5px] space-y-2" data-testid={`page-section-editor-${idx}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {section.type === 'text' && <Type className="w-3.5 h-3.5 text-[#64748B]" />}
                        {section.type === 'image' && <Image className="w-3.5 h-3.5 text-[#64748B]" />}
                        {section.type === 'link' && <Link2 className="w-3.5 h-3.5 text-[#64748B]" />}
                        {section.type === 'video' && <Video className="w-3.5 h-3.5 text-[#64748B]" />}
                        <span className="text-xs font-medium text-[#64748B] capitalize">{t[`section${section.type.charAt(0).toUpperCase() + section.type.slice(1)}`] || section.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => {
                          const secs = [...pageForm.sections]; [secs[idx - 1], secs[idx]] = [secs[idx], secs[idx - 1]]; setPageForm({ ...pageForm, sections: secs });
                        }}><ArrowUp className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === pageForm.sections.length - 1} onClick={() => {
                          const secs = [...pageForm.sections]; [secs[idx], secs[idx + 1]] = [secs[idx + 1], secs[idx]]; setPageForm({ ...pageForm, sections: secs });
                        }}><ArrowDown className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => {
                          setPageForm({ ...pageForm, sections: pageForm.sections.filter((_, i) => i !== idx) });
                        }} data-testid={`remove-section-${idx}`}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>

                    {section.type === 'text' && (
                      <ReactQuill theme="snow" value={section.content || ''} onChange={(val) => {
                        const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], content: val }; setPageForm({ ...pageForm, sections: secs });
                      }} modules={quillModulesProduct} className="bg-white [&_.ql-container]:min-h-[100px]" data-testid={`section-text-editor-${idx}`} />
                    )}

                    {section.type === 'image' && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input value={section.url || ''} onChange={(e) => {
                            const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], url: e.target.value }; setPageForm({ ...pageForm, sections: secs });
                          }} placeholder={t.imageUrl} className="text-sm flex-1" data-testid={`section-image-url-${idx}`} />
                          <Button type="button" variant="outline" size="sm" className="text-xs shrink-0" onClick={() => {
                            openMediaLibrary((url) => {
                              const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], url }; setPageForm({ ...pageForm, sections: secs });
                            });
                          }} data-testid={`section-image-upload-${idx}`}>
                            <Image className="w-3 h-3 mr-1" /> Chọn ảnh
                          </Button>
                        </div>
                        <Input value={section.caption || ''} onChange={(e) => {
                          const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], caption: e.target.value }; setPageForm({ ...pageForm, sections: secs });
                        }} placeholder="Caption (optional)" className="text-xs" />
                        {section.url && <img src={section.url} alt="" className="w-full max-h-40 object-cover rounded-[5px]" />}
                      </div>
                    )}

                    {section.type === 'link' && (
                      <div className="space-y-2">
                        <Input value={section.text || ''} onChange={(e) => {
                          const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], text: e.target.value }; setPageForm({ ...pageForm, sections: secs });
                        }} placeholder={t.linkText} className="text-sm" data-testid={`section-link-text-${idx}`} />
                        <Input value={section.url || ''} onChange={(e) => {
                          const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], url: e.target.value }; setPageForm({ ...pageForm, sections: secs });
                        }} placeholder={t.linkUrl} className="text-sm" data-testid={`section-link-url-${idx}`} />
                      </div>
                    )}

                    {section.type === 'video' && (
                      <Input value={section.url || ''} onChange={(e) => {
                        const secs = [...pageForm.sections]; secs[idx] = { ...secs[idx], url: e.target.value }; setPageForm({ ...pageForm, sections: secs });
                      }} placeholder={t.videoUrl} className="text-sm" data-testid={`section-video-url-${idx}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Add Section Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { type: 'text', icon: Type, label: t.sectionText },
                  { type: 'image', icon: Image, label: t.sectionImage },
                  { type: 'link', icon: Link2, label: t.sectionLink },
                  { type: 'video', icon: Video, label: t.sectionVideo }
                ].map(({ type, icon: Icon, label }) => (
                  <Button key={type} variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
                    setPageForm({ ...pageForm, sections: [...pageForm.sections, { type, content: '', url: '', text: '' }] });
                  }} data-testid={`add-section-${type}`}>
                    <Icon className="w-3 h-3" /> {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setShowPageModal(false)}>{t.cancel}</Button>
              <Button className="flex-1 hover:opacity-90 text-sm" style={{ backgroundColor: themeColor }} onClick={async () => {
                if (!pageForm.title.trim()) return toast.error(t.pageTitleLabel + ' is required');
                try {
                  if (editingPage) {
                    await axios.put(`${API}/dashboard/pages/${editingPage.id}`, pageForm);
                  } else {
                    await axios.post(`${API}/dashboard/pages`, pageForm);
                  }
                  toast.success(t.pageSaved);
                  setShowPageModal(false);
                  fetchData();
                } catch (err) { toast.error(err.response?.data?.detail || t.failedToSave); }
              }} data-testid="save-page-btn">{t.save}</Button>
            </div>
          </div>
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
