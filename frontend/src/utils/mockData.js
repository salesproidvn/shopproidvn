// Mock data for fully standalone frontend - no backend/database needed

let currentUser = JSON.parse(localStorage.getItem('mockUser') || 'null');

// ── Users ──────────────────────────────────────────────
export let mockUsers = [
  { id: 'user-admin', email: 'admin@thewishop.com', password: 'admin123', name: 'Admin', role: 'super_admin', status: 'active', shop_name: null },
  { id: 'user-demo', email: 'demo@thewishop.com', password: 'demo123', name: 'Demo Shop Owner', role: 'shop_owner', shop_id: 'shop-1', status: 'active', shop_name: 'The Elite Shop' },
];

// ── Shops ──────────────────────────────────────────────
export let mockShops = [
  {
    id: 'shop-1', owner_id: 'user-demo', name: 'The Elite Shop', slug: 'the-elite-shop',
    theme_color: '#0055FF', is_active: true, status: 'active',
    description: 'Premium products curated for the modern lifestyle',
    logo_url: '', contact_phone: '0912 345 678', contact_email: 'hello@theeliteshop.com',
    address: '123 Nguyen Hue, Q1, TP.HCM', social_facebook: 'https://facebook.com/theeliteshop', social_instagram: 'https://instagram.com/theeliteshop',
    order_count: 4, owner: { email: 'demo@thewishop.com' },
    expiry_date: null,
    created_at: '2025-12-01T00:00:00Z'
  }
];

// ── Categories ─────────────────────────────────────────
export let mockCategories = [
  { id: 'cat-1', shop_id: 'shop-1', name: 'Electronics', description: 'Gadgets and devices', position: 1 },
  { id: 'cat-2', shop_id: 'shop-1', name: 'Fashion', description: 'Clothing and accessories', position: 2 },
  { id: 'cat-3', shop_id: 'shop-1', name: 'Home & Garden', description: 'Home decor and plants', position: 3 },
  { id: 'cat-4', shop_id: 'shop-1', name: 'Kitchen', description: 'Kitchen tools and equipment', position: 4 },
];

// ── Products ───────────────────────────────────────────
export let mockProducts = [
  { id: 'prod-1', shop_id: 'shop-1', name: 'Sony Wireless Headphones', price: 2490000, category: 'Electronics', category_id: 'cat-1', stock: 25, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', description: 'Premium wireless headphones with active noise cancellation and 30h battery life.' },
  { id: 'prod-2', shop_id: 'shop-1', name: 'Black Studio Headphones', price: 1850000, category: 'Electronics', category_id: 'cat-1', stock: 18, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop', description: 'Professional studio-grade headphones for music production.' },
  { id: 'prod-3', shop_id: 'shop-1', name: 'Grey Casual Sneakers', price: 1200000, category: 'Fashion', category_id: 'cat-2', stock: 40, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', description: 'Comfortable grey sneakers perfect for everyday wear.' },
  { id: 'prod-4', shop_id: 'shop-1', name: 'Minimalist Smartphone', price: 14500000, category: 'Electronics', category_id: 'cat-1', stock: 10, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', description: 'Sleek smartphone with edge-to-edge display and triple camera system.' },
  { id: 'prod-5', shop_id: 'shop-1', name: 'Minimalist Succulent Pot', price: 320000, category: 'Home & Garden', category_id: 'cat-3', stock: 60, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop', description: 'Modern ceramic pot perfect for small succulents and cacti.' },
  { id: 'prod-6', shop_id: 'shop-1', name: 'Handwoven Rattan Baskets', price: 450000, category: 'Home & Garden', category_id: 'cat-3', stock: 30, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=400&h=400&fit=crop', description: 'Beautifully handwoven rattan baskets for storage and decoration.' },
  { id: 'prod-7', shop_id: 'shop-1', name: 'Ceramic Coffee Set', price: 380000, category: 'Kitchen', category_id: 'cat-4', stock: 20, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop', description: 'Elegant ceramic coffee cup and saucer set, handmade.' },
  { id: 'prod-8', shop_id: 'shop-1', name: 'Smart Watch Pro', price: 3200000, category: 'Electronics', category_id: 'cat-1', stock: 15, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', description: 'Feature-packed smartwatch with health tracking and GPS.' },
  { id: 'prod-9', shop_id: 'shop-1', name: 'Leather Crossbody Bag', price: 890000, category: 'Fashion', category_id: 'cat-2', stock: 35, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', description: 'Genuine leather crossbody bag with adjustable strap.' },
  { id: 'prod-10', shop_id: 'shop-1', name: 'AirPods Pro Max', price: 6500000, category: 'Electronics', category_id: 'cat-1', stock: 8, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop', description: 'Over-ear headphones with spatial audio and transparency mode.' },
  { id: 'prod-11', shop_id: 'shop-1', name: 'Designer Sunglasses', price: 1650000, category: 'Fashion', category_id: 'cat-2', stock: 22, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', description: 'UV-protected designer sunglasses with polarized lenses.' },
  { id: 'prod-12', shop_id: 'shop-1', name: 'Japanese Kitchen Knife Set', price: 2100000, category: 'Kitchen', category_id: 'cat-4', stock: 12, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop', description: 'Professional-grade Japanese steel knife set with wooden block.' },
];

// ── Orders ─────────────────────────────────────────────
let orderCounter = 4;
export let mockOrders = [
  {
    id: 'ORD-F4D49DBAB80A', shop_id: 'shop-1', customer_name: 'Nguyen Van A', customer_phone: '0901234567',
    customer_email: 'nguyenvana@email.com', customer_address: '456 Le Loi, Q3, TP.HCM', note: '',
    status: 'pending', total_amount: 2490000,
    items: [{ product_id: 'prod-1', name: 'Sony Wireless Headphones', price: 2490000, quantity: 1, subtotal: 2490000 }],
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'ORD-C16575C7DDAF', shop_id: 'shop-1', customer_name: 'Tran Thi B', customer_phone: '0912345678',
    customer_email: 'tranthib@email.com', customer_address: '789 Hai Ba Trung, Q1, TP.HCM', note: 'Please deliver before 5pm',
    status: 'confirmed', total_amount: 3050000,
    items: [
      { product_id: 'prod-2', name: 'Black Studio Headphones', price: 1850000, quantity: 1, subtotal: 1850000 },
      { product_id: 'prod-3', name: 'Grey Casual Sneakers', price: 1200000, quantity: 1, subtotal: 1200000 }
    ],
    created_at: '2026-02-02T14:30:00Z'
  },
  {
    id: 'ORD-A475E878AB1A', shop_id: 'shop-1', customer_name: 'Le Van C', customer_phone: '0923456789',
    customer_email: '', customer_address: '12 Nguyen Trai, Q5, TP.HCM', note: '',
    status: 'pending', total_amount: 14500000,
    items: [{ product_id: 'prod-4', name: 'Minimalist Smartphone', price: 14500000, quantity: 1, subtotal: 14500000 }],
    created_at: '2026-02-03T09:15:00Z'
  },
  {
    id: 'ORD-749704096CB7', shop_id: 'shop-1', customer_name: 'Pham Thi D', customer_phone: '0934567890',
    customer_email: 'phamthid@email.com', customer_address: '34 Vo Van Tan, Q3, TP.HCM', note: 'Gift wrap please',
    status: 'completed', total_amount: 770000,
    items: [
      { product_id: 'prod-5', name: 'Minimalist Succulent Pot', price: 320000, quantity: 1, subtotal: 320000 },
      { product_id: 'prod-6', name: 'Handwoven Rattan Baskets', price: 450000, quantity: 1, subtotal: 450000 }
    ],
    created_at: '2026-01-28T16:45:00Z'
  },
];

// ── Session helpers ────────────────────────────────────
export const getCurrentUser = () => currentUser;

export const setCurrentUser = (user) => {
  currentUser = user;
  if (user) {
    localStorage.setItem('mockUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('mockUser');
  }
};

// ── ID generator ───────────────────────────────────────
const genId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ── Route handlers ─────────────────────────────────────
export const handleMockRequest = (method, path, body) => {
  const m = method.toLowerCase();

  // ─ AUTH ─
  if (m === 'post' && path === '/auth/login') {
    const user = mockUsers.find(u => u.email === body.email && u.password === body.password);
    if (!user) return { error: 'Invalid email or password', status: 401 };
    const safe = { id: user.id, email: user.email, name: user.name, role: user.role, shop_id: user.shop_id };
    setCurrentUser(safe);
    return { data: safe };
  }

  if (m === 'post' && path === '/auth/register') {
    if (mockUsers.find(u => u.email === body.email)) return { error: 'Email already registered', status: 400 };
    const newUser = { id: genId('user'), email: body.email, password: body.password, name: body.name, role: 'customer', status: 'active', shop_name: null };
    mockUsers.push(newUser);
    const safe = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    setCurrentUser(safe);
    return { data: safe };
  }

  if (m === 'get' && path === '/auth/me') {
    if (!currentUser) return { error: 'Not authenticated', status: 401 };
    return { data: currentUser };
  }

  if (m === 'post' && path === '/auth/logout') {
    setCurrentUser(null);
    return { data: { ok: true } };
  }

  // ─ DASHBOARD (shop owner) ─
  if (m === 'get' && path === '/dashboard/stats') {
    const shopProducts = mockProducts.filter(p => p.shop_id === 'shop-1');
    const shopOrders = mockOrders.filter(o => o.shop_id === 'shop-1');
    return { data: {
      total_products: shopProducts.length,
      total_orders: shopOrders.length,
      pending_orders: shopOrders.filter(o => o.status === 'pending').length,
      total_revenue: shopOrders.reduce((s, o) => s + o.total_amount, 0)
    }};
  }

  if (m === 'get' && path === '/dashboard/shop') {
    return { data: { ...mockShops[0] } };
  }

  if (m === 'get' && path === '/dashboard/products') {
    return { data: mockProducts.filter(p => p.shop_id === 'shop-1').map(p => ({ ...p })) };
  }

  if (m === 'get' && path === '/dashboard/categories') {
    return { data: mockCategories.filter(c => c.shop_id === 'shop-1').sort((a, b) => (a.position || 0) - (b.position || 0)).map(c => ({ ...c })) };
  }

  if (m === 'get' && path === '/dashboard/orders') {
    return { data: mockOrders.filter(o => o.shop_id === 'shop-1').map(o => ({ ...o })) };
  }

  if (m === 'post' && path === '/dashboard/products') {
    const cat = mockCategories.find(c => c.id === body.category_id);
    const newProd = { id: genId('prod'), shop_id: 'shop-1', ...body, category: cat?.name || '', is_active: true };
    mockProducts.push(newProd);
    return { data: newProd };
  }

  const prodMatch = path.match(/^\/dashboard\/products\/(.+)$/);
  if (prodMatch) {
    const pid = prodMatch[1];
    if (m === 'put') {
      const idx = mockProducts.findIndex(p => p.id === pid);
      if (idx === -1) return { error: 'Product not found', status: 404 };
      const cat = mockCategories.find(c => c.id === body.category_id);
      mockProducts[idx] = { ...mockProducts[idx], ...body, category: cat?.name || mockProducts[idx].category };
      return { data: mockProducts[idx] };
    }
    if (m === 'delete') {
      mockProducts = mockProducts.filter(p => p.id !== pid);
      return { data: { ok: true } };
    }
  }

  if (m === 'post' && path === '/dashboard/categories') {
    const maxPos = mockCategories.filter(c => c.shop_id === 'shop-1').reduce((m, c) => Math.max(m, c.position || 0), 0);
    const newCat = { id: genId('cat'), shop_id: 'shop-1', position: maxPos + 1, ...body };
    mockCategories.push(newCat);
    return { data: newCat };
  }

  // Category positions bulk update
  if (m === 'put' && path === '/dashboard/categories/positions') {
    const positions = body.positions || [];
    positions.forEach(({ id, position }) => {
      const idx = mockCategories.findIndex(c => c.id === id);
      if (idx !== -1) mockCategories[idx].position = position;
    });
    return { data: { ok: true } };
  }

  const catMatch = path.match(/^\/dashboard\/categories\/(.+)$/);
  if (catMatch) {
    const cid = catMatch[1];
    if (m === 'put') {
      const idx = mockCategories.findIndex(c => c.id === cid);
      if (idx === -1) return { error: 'Category not found', status: 404 };
      mockCategories[idx] = { ...mockCategories[idx], ...body };
      return { data: mockCategories[idx] };
    }
    if (m === 'delete') {
      mockCategories = mockCategories.filter(c => c.id !== cid);
      return { data: { ok: true } };
    }
  }

  if (m === 'put' && path === '/dashboard/shop') {
    mockShops[0] = { ...mockShops[0], ...body };
    return { data: mockShops[0] };
  }

  const orderStatusMatch = path.match(/^\/dashboard\/orders\/(.+)\/status$/);
  if (orderStatusMatch && m === 'put') {
    const oid = orderStatusMatch[1];
    const idx = mockOrders.findIndex(o => o.id === oid);
    if (idx !== -1) mockOrders[idx].status = body.status;
    return { data: { ok: true } };
  }

  if (m === 'post' && path === '/upload/image') {
    const imgUrl = `https://picsum.photos/seed/${Date.now()}/400/400`;
    return { data: { id: `mock-img-${Date.now()}`, url: imgUrl } };
  }

  // ─ ADMIN ─
  if (m === 'get' && path === '/admin/stats') {
    return { data: {
      total_shops: mockShops.length,
      active_shops: mockShops.filter(s => s.status === 'active').length,
      total_shop_owners: mockUsers.filter(u => u.role === 'shop_owner').length,
      total_orders: mockOrders.length,
      total_revenue: mockOrders.reduce((s, o) => s + o.total_amount, 0)
    }};
  }

  if (m === 'get' && path === '/admin/shops') {
    return { data: mockShops.map(s => ({ ...s })) };
  }

  if (m === 'get' && path === '/admin/users') {
    return { data: mockUsers.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, status: u.status, shop_name: u.shop_name })) };
  }

  if (m === 'post' && path === '/admin/users') {
    if (mockUsers.find(u => u.email === body.email)) return { error: 'Email already exists', status: 400 };
    const slug = body.shop_name.toLowerCase().replace(/\s+/g, '-');
    const newUser = { id: genId('user'), email: body.email, password: body.password, name: body.name, role: 'shop_owner', status: 'active', shop_id: genId('shop'), shop_name: body.shop_name };
    mockUsers.push(newUser);
    const newShop = { id: newUser.shop_id, owner_id: newUser.id, name: body.shop_name, slug, theme_color: '#0055FF', is_active: true, status: 'active', description: '', order_count: 0, owner: { email: newUser.email } };
    mockShops.push(newShop);
    return { data: newUser };
  }

  const blockMatch = path.match(/^\/admin\/users\/(.+)\/block$/);
  if (blockMatch && m === 'post') {
    const uid = blockMatch[1];
    const idx = mockUsers.findIndex(u => u.id === uid);
    if (idx !== -1) mockUsers[idx].status = mockUsers[idx].status === 'blocked' ? 'active' : 'blocked';
    return { data: { ok: true } };
  }

  const resetPwdMatch = path.match(/^\/admin\/users\/(.+)\/reset-password$/);
  if (resetPwdMatch && m === 'post') {
    const uid = resetPwdMatch[1];
    const idx = mockUsers.findIndex(u => u.id === uid);
    if (idx !== -1) mockUsers[idx].password = 'iLoveProID@';
    return { data: { ok: true } };
  }

  const deleteUserMatch = path.match(/^\/admin\/users\/(.+)$/);
  if (deleteUserMatch && m === 'delete') {
    const uid = deleteUserMatch[1];
    const user = mockUsers.find(u => u.id === uid);
    if (user?.shop_id) mockShops = mockShops.filter(s => s.id !== user.shop_id);
    mockUsers = mockUsers.filter(u => u.id !== uid);
    return { data: { ok: true } };
  }

  const shopStatusMatch = path.match(/^\/admin\/shops\/(.+)\/status$/);
  if (shopStatusMatch && m === 'post') {
    const sid = shopStatusMatch[1];
    const status = body._params?.status || 'active';
    const idx = mockShops.findIndex(s => s.id === sid);
    if (idx !== -1) mockShops[idx].status = status;
    return { data: { ok: true } };
  }

  const shopExpiryMatch = path.match(/^\/admin\/shops\/(.+)\/expiry$/);
  if (shopExpiryMatch && m === 'post') {
    const sid = shopExpiryMatch[1];
    const idx = mockShops.findIndex(s => s.id === sid);
    if (idx !== -1) mockShops[idx].expiry_date = body.expiry_date || null;
    return { data: { ok: true } };
  }

  // ─ STOREFRONT ─
  const shopSlugMatch = path.match(/^\/shop\/([^/]+)$/);
  if (shopSlugMatch && m === 'get') {
    const shop = mockShops.find(s => s.slug === shopSlugMatch[1]);
    if (!shop) return { error: 'Shop not found', status: 404 };
    return { data: { ...shop } };
  }

  const shopProductsMatch = path.match(/^\/shop\/([^/]+)\/products$/);
  if (shopProductsMatch && m === 'get') {
    const shop = mockShops.find(s => s.slug === shopProductsMatch[1]);
    if (!shop) return { error: 'Shop not found', status: 404 };
    let prods = mockProducts.filter(p => p.shop_id === shop.id).sort((a, b) => (a.position || 0) - (b.position || 0));
    if (body._params?.category) prods = prods.filter(p => p.category_id === body._params.category);
    if (body._params?.search) {
      const q = body._params.search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q));
    }
    return { data: prods };
  }

  const shopCatsMatch = path.match(/^\/shop\/([^/]+)\/categories$/);
  if (shopCatsMatch && m === 'get') {
    const shop = mockShops.find(s => s.slug === shopCatsMatch[1]);
    if (!shop) return { error: 'Shop not found', status: 404 };
    return { data: mockCategories.filter(c => c.shop_id === shop.id).sort((a, b) => (a.position || 0) - (b.position || 0)) };
  }

  const shopOrderMatch = path.match(/^\/shop\/([^/]+)\/orders$/);
  if (shopOrderMatch && m === 'post') {
    const shop = mockShops.find(s => s.slug === shopOrderMatch[1]);
    if (!shop) return { error: 'Shop not found', status: 404 };
    const items = (body.items || []).map(item => {
      const prod = mockProducts.find(p => p.id === item.product_id);
      return { product_id: item.product_id, name: prod?.name || '', price: prod?.price || 0, quantity: item.quantity, subtotal: (prod?.price || 0) * item.quantity };
    });
    const order = {
      id: `ORD-${Date.now().toString(16).toUpperCase()}`, shop_id: shop.id,
      customer_name: body.customer_name, customer_phone: body.customer_phone,
      customer_email: body.customer_email || '', customer_address: body.customer_address, note: body.note || '',
      status: 'pending', total_amount: items.reduce((s, i) => s + i.subtotal, 0), items,
      created_at: new Date().toISOString()
    };
    mockOrders.unshift(order);
    return { data: order };
  }

  // ─ PUBLIC HOMEPAGE ─
  if (m === 'get' && path === '/products') {
    let prods = [...mockProducts].sort((a, b) => (a.position || 0) - (b.position || 0));
    if (body._params?.category && body._params.category !== 'All Categories') {
      prods = prods.filter(p => p.category === body._params.category);
    }
    if (body._params?.search) {
      const q = body._params.search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q));
    }
    return { data: prods };
  }

  if (m === 'get' && path === '/categories') {
    const uniqueNames = [...new Set(mockProducts.map(p => p.category))];
    const catObjects = uniqueNames.map(name => {
      const cat = mockCategories.find(c => c.name === name);
      return cat ? { ...cat } : { id: name, name, position: 999 };
    }).sort((a, b) => (a.position || 0) - (b.position || 0));
    return { data: catObjects };
  }

  // ─ FILE PROXY ─
  const fileMatch = path.match(/^\/files\/(.+)$/);
  if (fileMatch && m === 'get') {
    return { data: null, redirect: `https://picsum.photos/seed/${fileMatch[1]}/400/400` };
  }

  // ─ FALLBACK ─
  console.warn(`[MockAPI] Unhandled: ${m.toUpperCase()} ${path}`);
  return { data: {} };
};
