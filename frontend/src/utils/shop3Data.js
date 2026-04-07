// Shop 3: "Chợ Xanh 365" - Vietnamese Organic Grocery Store
// Modeled after woodmart vegetables theme

export const shop3User = { id: 'user-choxanh', email: 'choxanh@thewishop.com', password: 'choxanh123', name: 'Nguyen Van Toan', role: 'shop_owner', shop_id: 'shop-3', status: 'active', shop_name: 'Chợ Xanh 365' };

export const shop3Data = {
  id: 'shop-3', owner_id: 'user-choxanh', name: 'Chợ Xanh 365', slug: 'cho-xanh-365',
  theme_color: '#16A34A', is_active: true, status: 'active',
  description: 'Siêu thị thực phẩm sạch, rau củ quả tươi, hải sản và đặc sản Việt Nam. Giao hàng tận nơi mỗi ngày.',
  logo_url: '', contact_phone: '0901 234 567', contact_email: 'hello@choxanh365.vn',
  address: '123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM', social_facebook: 'https://facebook.com/choxanh365', social_instagram: 'https://instagram.com/choxanh365',
  order_count: 8, owner: { email: 'choxanh@thewishop.com' },
  expiry_date: null, post_carousel_position: 'top', max_products: 200, max_posts: 50,
  banners: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&h=450&fit=crop',
    'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=1400&h=450&fit=crop'
  ],
  banner_enabled: true, blog_enabled: true,
  layout_sections: [
    { id: 'banner', label: 'Banner', enabled: true },
    { id: 'categories', label: 'Categories', enabled: true },
    { id: 'blog', label: 'Blog', enabled: true },
    { id: 'featured', label: 'Featured Products', enabled: true },
    { id: 'products', label: 'Products', enabled: true }
  ],
  footer_columns: [
    { title: 'Chợ Xanh 365', items: [{ text: 'Siêu thị thực phẩm sạch, tươi ngon mỗi ngày. Cam kết 100% nguồn gốc rõ ràng.', url: '' }] },
    { title: 'Hỗ trợ', items: [{ text: 'Hotline: 0901 234 567', url: 'tel:0901234567' }, { text: 'Email: hello@choxanh365.vn', url: 'mailto:hello@choxanh365.vn' }] },
    { title: 'Chính sách', items: [{ text: 'Đổi trả trong 24h', url: '' }, { text: 'Giao hàng miễn phí từ 300K', url: '' }] },
    { title: 'Mạng xã hội', items: [{ text: 'Facebook', url: 'https://facebook.com/choxanh365' }, { text: 'Instagram', url: 'https://instagram.com/choxanh365' }] }
  ],
  created_at: '2025-12-01T00:00:00Z',
  menu_items: [
    { id: 'mi-cx1', label: 'Trang chủ', url: '/shop/cho-xanh-365', type: 'internal', enabled: true, position: 0 },
    { id: 'mi-cx2', label: 'Cửa hàng', url: '/shop/cho-xanh-365', type: 'scroll_shop', enabled: true, position: 1 },
    { id: 'mi-cx3', label: 'Danh mục', url: '/shop/cho-xanh-365/categories', type: 'internal', enabled: true, position: 2 },
    { id: 'mi-cx4', label: 'Bài viết', url: '/shop/cho-xanh-365#blog', type: 'internal', enabled: true, position: 3 },
    { id: 'mi-cx5', label: 'Liên hệ', url: '/shop/cho-xanh-365/contact', type: 'internal', enabled: true, position: 4 }
  ],
  custom_pages: []
};

// ── CATEGORIES ──
export const shop3Categories = [
  // Parent categories
  { id: 'cat-cx1', shop_id: 'shop-3', name: 'Rau Củ Quả', description: 'Rau xanh, củ quả tươi sạch từ vườn', position: 1, parent_id: null, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop' },
  { id: 'cat-cx2', shop_id: 'shop-3', name: 'Trái Cây', description: 'Trái cây nhiệt đới và nhập khẩu', position: 2, parent_id: null, image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop' },
  { id: 'cat-cx3', shop_id: 'shop-3', name: 'Hải Sản', description: 'Cá, tôm, cua, mực tươi sống', position: 3, parent_id: null, image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=400&fit=crop' },
  { id: 'cat-cx4', shop_id: 'shop-3', name: 'Thịt & Đạm', description: 'Thịt tươi, trứng, đậu hũ', position: 4, parent_id: null, image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop' },
  { id: 'cat-cx5', shop_id: 'shop-3', name: 'Sữa & Bơ', description: 'Sữa tươi, sữa chua, phô mai', position: 5, parent_id: null, image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop' },
  { id: 'cat-cx6', shop_id: 'shop-3', name: 'Đồ Uống', description: 'Nước ép, trà, cà phê, nước ngọt', position: 6, parent_id: null, image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop' },
  { id: 'cat-cx7', shop_id: 'shop-3', name: 'Bánh & Ngũ Cốc', description: 'Bánh mì, bánh ngọt, ngũ cốc', position: 7, parent_id: null, image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop' },
  { id: 'cat-cx8', shop_id: 'shop-3', name: 'Gia Vị & Đồ Khô', description: 'Nước mắm, gia vị, mì, bún, miến', position: 8, parent_id: null, image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' },
  // Sub-categories
  { id: 'cat-cx1a', shop_id: 'shop-3', name: 'Rau Lá', description: 'Rau muống, rau cải, xà lách...', position: 1, parent_id: 'cat-cx1', image_url: '' },
  { id: 'cat-cx1b', shop_id: 'shop-3', name: 'Rau Củ', description: 'Cà rốt, khoai tây, bí...', position: 2, parent_id: 'cat-cx1', image_url: '' },
  { id: 'cat-cx1c', shop_id: 'shop-3', name: 'Nấm Tươi', description: 'Nấm rơm, nấm đùi gà, nấm kim châm', position: 3, parent_id: 'cat-cx1', image_url: '' },
  { id: 'cat-cx2a', shop_id: 'shop-3', name: 'Trái Cây Nhiệt Đới', description: 'Xoài, ổi, thanh long, sầu riêng...', position: 1, parent_id: 'cat-cx2', image_url: '' },
  { id: 'cat-cx2b', shop_id: 'shop-3', name: 'Trái Cây Nhập Khẩu', description: 'Nho, cherry, kiwi, lê...', position: 2, parent_id: 'cat-cx2', image_url: '' },
  { id: 'cat-cx3a', shop_id: 'shop-3', name: 'Cá Tươi', description: 'Cá hồi, cá thu, cá basa...', position: 1, parent_id: 'cat-cx3', image_url: '' },
  { id: 'cat-cx3b', shop_id: 'shop-3', name: 'Tôm & Cua', description: 'Tôm sú, tôm thẻ, cua...', position: 2, parent_id: 'cat-cx3', image_url: '' },
  { id: 'cat-cx3c', shop_id: 'shop-3', name: 'Hải Sản Đông Lạnh', description: 'Mực, bạch tuộc, cá fillet đông lạnh', position: 3, parent_id: 'cat-cx3', image_url: '' },
  { id: 'cat-cx4a', shop_id: 'shop-3', name: 'Thịt Heo', description: 'Ba rọi, sườn, nạc vai...', position: 1, parent_id: 'cat-cx4', image_url: '' },
  { id: 'cat-cx4b', shop_id: 'shop-3', name: 'Thịt Bò', description: 'Bò Úc, bò Mỹ, bắp bò...', position: 2, parent_id: 'cat-cx4', image_url: '' },
  { id: 'cat-cx4c', shop_id: 'shop-3', name: 'Thịt Gà & Vịt', description: 'Gà ta, gà công nghiệp, vịt', position: 3, parent_id: 'cat-cx4', image_url: '' },
  { id: 'cat-cx4d', shop_id: 'shop-3', name: 'Đậu Hũ & Chay', description: 'Đậu hũ, chả lụa chay, đạm thực vật', position: 4, parent_id: 'cat-cx4', image_url: '' },
  { id: 'cat-cx5a', shop_id: 'shop-3', name: 'Sữa Tươi', description: 'Sữa tươi, sữa hạt, sữa đậu nành', position: 1, parent_id: 'cat-cx5', image_url: '' },
  { id: 'cat-cx5b', shop_id: 'shop-3', name: 'Sữa Chua', description: 'Sữa chua ăn, sữa chua uống', position: 2, parent_id: 'cat-cx5', image_url: '' },
  { id: 'cat-cx5c', shop_id: 'shop-3', name: 'Phô Mai & Bơ', description: 'Phô mai lát, phô mai con bò cười, bơ', position: 3, parent_id: 'cat-cx5', image_url: '' },
  { id: 'cat-cx6a', shop_id: 'shop-3', name: 'Nước Ép & Sinh Tố', description: 'Nước ép cam, dừa, rau má...', position: 1, parent_id: 'cat-cx6', image_url: '' },
  { id: 'cat-cx6b', shop_id: 'shop-3', name: 'Trà & Cà Phê', description: 'Trà xanh, trà ô long, cà phê phin', position: 2, parent_id: 'cat-cx6', image_url: '' },
  { id: 'cat-cx6c', shop_id: 'shop-3', name: 'Nước Ngọt & Soda', description: 'Coca, Pepsi, nước khoáng', position: 3, parent_id: 'cat-cx6', image_url: '' },
  { id: 'cat-cx7a', shop_id: 'shop-3', name: 'Bánh Mì', description: 'Bánh mì sandwich, baguette, ổ', position: 1, parent_id: 'cat-cx7', image_url: '' },
  { id: 'cat-cx7b', shop_id: 'shop-3', name: 'Bánh Ngọt', description: 'Bánh kem, cupcake, croissant', position: 2, parent_id: 'cat-cx7', image_url: '' },
  { id: 'cat-cx7c', shop_id: 'shop-3', name: 'Ngũ Cốc & Granola', description: 'Yến mạch, granola, muesli', position: 3, parent_id: 'cat-cx7', image_url: '' },
  { id: 'cat-cx8a', shop_id: 'shop-3', name: 'Nước Chấm & Nước Mắm', description: 'Nước mắm, nước tương, tương ớt', position: 1, parent_id: 'cat-cx8', image_url: '' },
  { id: 'cat-cx8b', shop_id: 'shop-3', name: 'Gia Vị Nấu Ăn', description: 'Muối, tiêu, bột ngọt, hạt nêm', position: 2, parent_id: 'cat-cx8', image_url: '' },
  { id: 'cat-cx8c', shop_id: 'shop-3', name: 'Mì, Bún & Miến', description: 'Mì gói, bún khô, miến dong', position: 3, parent_id: 'cat-cx8', image_url: '' },
];

const S3 = 'shop-3';
const img = (q) => `https://images.unsplash.com/photo-${q}?w=400&h=400&fit=crop`;

// ── 100 PRODUCTS ──
export const shop3Products = [
  // ─── RAU CỦ QUẢ (13) ───
  { id: 'p3-01', shop_id: S3, name: 'Rau Muống Hữu Cơ', price: 18000, category: 'Rau Củ Quả', category_id: 'cat-cx1a', stock: 120, position: 1, is_active: true, is_featured: true, image_url: img('1622206151226-18ca2c9ab4a1'), images: [img('1622206151226-18ca2c9ab4a1')], video_url: '', video_links: [], description: 'Rau muống hữu cơ trồng tại Đà Lạt, không thuốc trừ sâu. Gói 300g.' },
  { id: 'p3-02', shop_id: S3, name: 'Cải Ngọt Baby', price: 22000, category: 'Rau Củ Quả', category_id: 'cat-cx1a', stock: 90, position: 2, is_active: true, image_url: img('1540420773420-3366772f4999'), images: [img('1540420773420-3366772f4999')], video_url: '', video_links: [], description: 'Cải ngọt baby non mềm, ngọt tự nhiên. Gói 250g.' },
  { id: 'p3-03', shop_id: S3, name: 'Xà Lách Lolo Xanh', price: 25000, category: 'Rau Củ Quả', category_id: 'cat-cx1a', stock: 80, position: 3, is_active: true, image_url: img('1556801712-76c8eb07af38'), images: [img('1556801712-76c8eb07af38')], video_url: '', video_links: [], description: 'Xà lách Lolo xanh giòn, phù hợp làm salad. Gói 200g.' },
  { id: 'p3-04', shop_id: S3, name: 'Cà Rốt Đà Lạt', price: 28000, category: 'Rau Củ Quả', category_id: 'cat-cx1b', stock: 150, position: 4, is_active: true, is_featured: true, image_url: img('1598170845058-32b9d6a5da37'), images: [img('1598170845058-32b9d6a5da37')], video_url: '', video_links: [], description: 'Cà rốt Đà Lạt tươi ngọt, giàu vitamin A. Túi 500g.' },
  { id: 'p3-05', shop_id: S3, name: 'Khoai Tây Sạch', price: 35000, category: 'Rau Củ Quả', category_id: 'cat-cx1b', stock: 100, position: 5, is_active: true, image_url: img('1518977676601-b32a3a0506fd'), images: [img('1518977676601-b32a3a0506fd')], video_url: '', video_links: [], description: 'Khoai tây sạch ruột vàng, phù hợp chiên, xào, nấu canh. 1kg.' },
  { id: 'p3-06', shop_id: S3, name: 'Bí Đỏ Hồ Lô', price: 32000, category: 'Rau Củ Quả', category_id: 'cat-cx1b', stock: 60, position: 6, is_active: true, image_url: img('1570586437263-ab629fccc818'), images: [img('1570586437263-ab629fccc818')], video_url: '', video_links: [], description: 'Bí đỏ hồ lô ngọt bùi, nấu canh, nấu chè đều ngon. 1kg.' },
  { id: 'p3-07', shop_id: S3, name: 'Cà Chua Beef', price: 42000, category: 'Rau Củ Quả', category_id: 'cat-cx1b', stock: 75, position: 7, is_active: true, image_url: img('1592924357228-91a4daadcfea'), images: [img('1592924357228-91a4daadcfea')], video_url: '', video_links: [], description: 'Cà chua beef ruột đỏ, mọng nước, thích hợp làm sauce. 500g.' },
  { id: 'p3-08', shop_id: S3, name: 'Nấm Đùi Gà Tươi', price: 55000, category: 'Rau Củ Quả', category_id: 'cat-cx1c', stock: 50, position: 8, is_active: true, is_featured: true, image_url: img('1504545102780-26c3ba47bbe5'), images: [img('1504545102780-26c3ba47bbe5')], video_url: '', video_links: [], description: 'Nấm đùi gà tươi giòn ngọt, dùng xào hoặc nướng. 200g.' },
  { id: 'p3-09', shop_id: S3, name: 'Nấm Kim Châm', price: 25000, category: 'Rau Củ Quả', category_id: 'cat-cx1c', stock: 100, position: 9, is_active: true, image_url: img('1504544750208-dc0358e63f7f'), images: [img('1504544750208-dc0358e63f7f')], video_url: '', video_links: [], description: 'Nấm kim châm Hàn Quốc, lẩu, xào, nướng đều ngon. 150g.' },
  { id: 'p3-10', shop_id: S3, name: 'Ớt Chuông Mix 3 Màu', price: 45000, category: 'Rau Củ Quả', category_id: 'cat-cx1b', stock: 65, position: 10, is_active: true, image_url: img('1563565375-f3fdfdbefa83'), images: [img('1563565375-f3fdfdbefa83')], video_url: '', video_links: [], description: 'Ớt chuông xanh đỏ vàng, giòn ngọt. 3 trái/gói.' },
  { id: 'p3-11', shop_id: S3, name: 'Bông Cải Xanh (Broccoli)', price: 38000, category: 'Rau Củ Quả', category_id: 'cat-cx1b', stock: 70, position: 11, is_active: true, image_url: img('1459411552884-841db9b3cc2a'), images: [img('1459411552884-841db9b3cc2a')], video_url: '', video_links: [], description: 'Bông cải xanh Đà Lạt, giàu chất xơ và vitamin C. 300g.' },
  { id: 'p3-12', shop_id: S3, name: 'Rau Mồng Tơi', price: 15000, category: 'Rau Củ Quả', category_id: 'cat-cx1a', stock: 100, position: 12, is_active: true, image_url: img('1598030343246-eee1f8f60c0c'), images: [img('1598030343246-eee1f8f60c0c')], video_url: '', video_links: [], description: 'Rau mồng tơi xanh non, nấu canh cua rất ngon. 300g.' },
  { id: 'p3-13', shop_id: S3, name: 'Nấm Rơm Tươi', price: 48000, category: 'Rau Củ Quả', category_id: 'cat-cx1c', stock: 40, position: 13, is_active: true, image_url: img('1504545102780-26c3ba47bbe5'), images: [img('1504545102780-26c3ba47bbe5')], video_url: '', video_links: [], description: 'Nấm rơm tươi từ Tây Ninh, thơm ngon đặc trưng. 200g.' },
  // ─── TRÁI CÂY (13) ───
  { id: 'p3-14', shop_id: S3, name: 'Xoài Cát Hòa Lộc', price: 85000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 50, position: 1, is_active: true, is_featured: true, image_url: img('1553279768-865429fa0078'), images: [img('1553279768-865429fa0078')], video_url: '', video_links: [], description: 'Xoài cát Hòa Lộc ruột vàng thơm, ngọt thanh. 1kg.' },
  { id: 'p3-15', shop_id: S3, name: 'Thanh Long Ruột Đỏ', price: 55000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 80, position: 2, is_active: true, image_url: img('1527325678964-54b2731fdfed'), images: [img('1527325678964-54b2731fdfed')], video_url: '', video_links: [], description: 'Thanh long ruột đỏ Bình Thuận, ngọt mát. 1kg.' },
  { id: 'p3-16', shop_id: S3, name: 'Sầu Riêng Musang King', price: 450000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 20, position: 3, is_active: true, is_featured: true, image_url: img('1588165171080-c89acfa5ee83'), images: [img('1588165171080-c89acfa5ee83')], video_url: '', video_links: [], description: 'Sầu riêng Musang King Malaysia, múi dày, cơm vàng sánh. 1kg.' },
  { id: 'p3-17', shop_id: S3, name: 'Bưởi Da Xanh', price: 65000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 40, position: 4, is_active: true, image_url: img('1577234286642-fc512a5f8f11'), images: [img('1577234286642-fc512a5f8f11')], video_url: '', video_links: [], description: 'Bưởi da xanh Bến Tre, tôm đỏ, ngọt thanh không đắng. 1 trái.' },
  { id: 'p3-18', shop_id: S3, name: 'Nho Mỹ Xanh Không Hạt', price: 120000, category: 'Trái Cây', category_id: 'cat-cx2b', stock: 45, position: 5, is_active: true, image_url: img('1537640538966-79f369143f8f'), images: [img('1537640538966-79f369143f8f')], video_url: '', video_links: [], description: 'Nho xanh Mỹ không hạt, giòn ngọt. 500g.' },
  { id: 'p3-19', shop_id: S3, name: 'Cherry Úc Đỏ', price: 280000, category: 'Trái Cây', category_id: 'cat-cx2b', stock: 30, position: 6, is_active: true, image_url: img('1559181567-c3190ca9959b'), images: [img('1559181567-c3190ca9959b')], video_url: '', video_links: [], description: 'Cherry nhập khẩu Úc, size 28-30mm, đỏ tươi. 500g.' },
  { id: 'p3-20', shop_id: S3, name: 'Dưa Hấu Không Hạt', price: 35000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 60, position: 7, is_active: true, image_url: img('1563114773-84221bd62daa'), images: [img('1563114773-84221bd62daa')], video_url: '', video_links: [], description: 'Dưa hấu không hạt ruột đỏ, ngọt mát giải nhiệt. 1 trái ~3kg.' },
  { id: 'p3-21', shop_id: S3, name: 'Kiwi Vàng Zespri', price: 150000, category: 'Trái Cây', category_id: 'cat-cx2b', stock: 35, position: 8, is_active: true, image_url: img('1585032226651-759b368d7246'), images: [img('1585032226651-759b368d7246')], video_url: '', video_links: [], description: 'Kiwi vàng Zespri New Zealand, ngọt dịu. Hộp 4 trái.' },
  { id: 'p3-22', shop_id: S3, name: 'Ổi Lê Đài Loan', price: 45000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 55, position: 9, is_active: true, image_url: img('1536511132770-e5058c7e8c46'), images: [img('1536511132770-e5058c7e8c46')], video_url: '', video_links: [], description: 'Ổi lê giòn ngọt, ít hạt. 1kg.' },
  { id: 'p3-23', shop_id: S3, name: 'Cam Sành Vĩnh Long', price: 40000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 90, position: 10, is_active: true, image_url: img('1582979512210-99b6a53386f9'), images: [img('1582979512210-99b6a53386f9')], video_url: '', video_links: [], description: 'Cam sành Vĩnh Long vỏ xanh ruột vàng, ngọt đậm. 1kg.' },
  { id: 'p3-24', shop_id: S3, name: 'Táo Envy New Zealand', price: 160000, category: 'Trái Cây', category_id: 'cat-cx2b', stock: 40, position: 11, is_active: true, image_url: img('1560806887-1e4cf76db29e'), images: [img('1560806887-1e4cf76db29e')], video_url: '', video_links: [], description: 'Táo Envy giòn ngọt, thơm đặc trưng. 4 trái.' },
  { id: 'p3-25', shop_id: S3, name: 'Măng Cụt', price: 75000, category: 'Trái Cây', category_id: 'cat-cx2a', stock: 45, position: 12, is_active: true, image_url: img('1562159278-1535b6b0f631'), images: [img('1562159278-1535b6b0f631')], video_url: '', video_links: [], description: 'Măng cụt tươi Bình Dương, vỏ mỏng, cơm trắng ngọt. 1kg.' },
  { id: 'p3-26', shop_id: S3, name: 'Lê Hàn Quốc', price: 130000, category: 'Trái Cây', category_id: 'cat-cx2b', stock: 35, position: 13, is_active: true, image_url: img('1567306226416-28f0efdc88ce'), images: [img('1567306226416-28f0efdc88ce')], video_url: '', video_links: [], description: 'Lê Hàn Quốc ruột trắng giòn, ngọt thanh. 3 trái.' },
  // ─── HẢI SẢN (12) ───
  { id: 'p3-27', shop_id: S3, name: 'Cá Hồi Na Uy Fillet', price: 320000, category: 'Hải Sản', category_id: 'cat-cx3a', stock: 25, position: 1, is_active: true, is_featured: true, image_url: img('1519708227418-b869ee2dd7a6'), images: [img('1519708227418-b869ee2dd7a6')], video_url: '', video_links: [], description: 'Cá hồi Na Uy phi lê tươi, giàu omega-3. 300g.' },
  { id: 'p3-28', shop_id: S3, name: 'Tôm Sú Sống', price: 180000, category: 'Hải Sản', category_id: 'cat-cx3b', stock: 40, position: 2, is_active: true, is_featured: true, image_url: img('1565680532038-4e7d77522aa3'), images: [img('1565680532038-4e7d77522aa3')], video_url: '', video_links: [], description: 'Tôm sú sống size 20-25 con/kg, thịt chắc ngọt. 500g.' },
  { id: 'p3-29', shop_id: S3, name: 'Mực Ống Tươi', price: 150000, category: 'Hải Sản', category_id: 'cat-cx3a', stock: 35, position: 3, is_active: true, image_url: img('1565680532038-4e7d77522aa3'), images: [img('1565680532038-4e7d77522aa3')], video_url: '', video_links: [], description: 'Mực ống tươi loại 1, thịt dày dai ngọt. 500g.' },
  { id: 'p3-30', shop_id: S3, name: 'Cá Thu Cắt Khoanh', price: 95000, category: 'Hải Sản', category_id: 'cat-cx3a', stock: 45, position: 4, is_active: true, image_url: img('1535140728325-a4d3707eee61'), images: [img('1535140728325-a4d3707eee61')], video_url: '', video_links: [], description: 'Cá thu cắt khoanh tươi, phù hợp kho, chiên. 500g.' },
  { id: 'p3-31', shop_id: S3, name: 'Cua Biển Sống', price: 350000, category: 'Hải Sản', category_id: 'cat-cx3b', stock: 15, position: 5, is_active: true, image_url: img('1559737558-2f5a35f4523b'), images: [img('1559737558-2f5a35f4523b')], video_url: '', video_links: [], description: 'Cua biển sống Cà Mau, gạch son, thịt chắc. 1 con ~500g.' },
  { id: 'p3-32', shop_id: S3, name: 'Nghêu Sạch', price: 45000, category: 'Hải Sản', category_id: 'cat-cx3b', stock: 60, position: 6, is_active: true, image_url: img('1559737558-2f5a35f4523b'), images: [img('1559737558-2f5a35f4523b')], video_url: '', video_links: [], description: 'Nghêu sạch đã ngâm cát, thịt béo ngọt. 500g.' },
  { id: 'p3-33', shop_id: S3, name: 'Cá Basa Fillet Đông Lạnh', price: 65000, category: 'Hải Sản', category_id: 'cat-cx3c', stock: 50, position: 7, is_active: true, image_url: img('1535140728325-a4d3707eee61'), images: [img('1535140728325-a4d3707eee61')], video_url: '', video_links: [], description: 'Fillet cá basa đông lạnh, thịt trắng, không xương. 500g.' },
  { id: 'p3-34', shop_id: S3, name: 'Tôm Thẻ Chân Trắng', price: 120000, category: 'Hải Sản', category_id: 'cat-cx3b', stock: 55, position: 8, is_active: true, image_url: img('1565680532038-4e7d77522aa3'), images: [img('1565680532038-4e7d77522aa3')], video_url: '', video_links: [], description: 'Tôm thẻ chân trắng size 40-50 con/kg. 500g.' },
  { id: 'p3-35', shop_id: S3, name: 'Bạch Tuộc Đông Lạnh', price: 110000, category: 'Hải Sản', category_id: 'cat-cx3c', stock: 30, position: 9, is_active: true, image_url: img('1559737558-2f5a35f4523b'), images: [img('1559737558-2f5a35f4523b')], video_url: '', video_links: [], description: 'Bạch tuộc baby đông lạnh, dai giòn. 500g.' },
  { id: 'p3-36', shop_id: S3, name: 'Cá Diêu Hồng Sống', price: 78000, category: 'Hải Sản', category_id: 'cat-cx3a', stock: 30, position: 10, is_active: true, image_url: img('1535140728325-a4d3707eee61'), images: [img('1535140728325-a4d3707eee61')], video_url: '', video_links: [], description: 'Cá diêu hồng sống, thịt trắng dai. 1 con ~600g.' },
  { id: 'p3-37', shop_id: S3, name: 'Phi lê Cá Dori', price: 89000, category: 'Hải Sản', category_id: 'cat-cx3c', stock: 40, position: 11, is_active: true, image_url: img('1519708227418-b869ee2dd7a6'), images: [img('1519708227418-b869ee2dd7a6')], video_url: '', video_links: [], description: 'Phi lê cá Dori đông lạnh nhập khẩu, ít mỡ. 400g.' },
  { id: 'p3-38', shop_id: S3, name: 'Hàu Sữa Tươi', price: 95000, category: 'Hải Sản', category_id: 'cat-cx3b', stock: 25, position: 12, is_active: true, image_url: img('1559737558-2f5a35f4523b'), images: [img('1559737558-2f5a35f4523b')], video_url: '', video_links: [], description: 'Hàu sữa tươi Phú Quốc, béo ngậy. 6 con.' },
  // ─── THỊT & ĐẠM (13) ───
  { id: 'p3-39', shop_id: S3, name: 'Ba Rọi Heo Rút Sườn', price: 115000, category: 'Thịt & Đạm', category_id: 'cat-cx4a', stock: 40, position: 1, is_active: true, is_featured: true, image_url: img('1607623814075-e51df1bdc82f'), images: [img('1607623814075-e51df1bdc82f')], video_url: '', video_links: [], description: 'Ba rọi heo rút sườn, thịt mềm, lớp mỡ đều. 500g.' },
  { id: 'p3-40', shop_id: S3, name: 'Sườn Non Heo', price: 135000, category: 'Thịt & Đạm', category_id: 'cat-cx4a', stock: 35, position: 2, is_active: true, image_url: img('1607623814075-e51df1bdc82f'), images: [img('1607623814075-e51df1bdc82f')], video_url: '', video_links: [], description: 'Sườn non heo cắt miếng vừa, thích hợp kho, nướng. 500g.' },
  { id: 'p3-41', shop_id: S3, name: 'Nạc Vai Heo Xay', price: 85000, category: 'Thịt & Đạm', category_id: 'cat-cx4a', stock: 50, position: 3, is_active: true, image_url: img('1607623814075-e51df1bdc82f'), images: [img('1607623814075-e51df1bdc82f')], video_url: '', video_links: [], description: 'Thịt nạc vai heo xay nhuyễn, làm hoành thánh, chả. 300g.' },
  { id: 'p3-42', shop_id: S3, name: 'Thăn Nội Bò Úc', price: 320000, category: 'Thịt & Đạm', category_id: 'cat-cx4b', stock: 20, position: 4, is_active: true, is_featured: true, image_url: img('1558030006-450675393462'), images: [img('1558030006-450675393462')], video_url: '', video_links: [], description: 'Thăn nội bò Úc (tenderloin) cắt steak, mềm béo. 250g.' },
  { id: 'p3-43', shop_id: S3, name: 'Bắp Bò Úc', price: 180000, category: 'Thịt & Đạm', category_id: 'cat-cx4b', stock: 30, position: 5, is_active: true, image_url: img('1558030006-450675393462'), images: [img('1558030006-450675393462')], video_url: '', video_links: [], description: 'Bắp bò Úc nguyên khối, thích hợp kho, bò hầm. 500g.' },
  { id: 'p3-44', shop_id: S3, name: 'Đùi Gà Công Nghiệp', price: 65000, category: 'Thịt & Đạm', category_id: 'cat-cx4c', stock: 60, position: 6, is_active: true, image_url: img('1587593810167-a84920ea0781'), images: [img('1587593810167-a84920ea0781')], video_url: '', video_links: [], description: 'Đùi gà tươi, thịt chắc. Khay 500g (4-5 đùi).' },
  { id: 'p3-45', shop_id: S3, name: 'Gà Ta Nguyên Con', price: 165000, category: 'Thịt & Đạm', category_id: 'cat-cx4c', stock: 25, position: 7, is_active: true, image_url: img('1587593810167-a84920ea0781'), images: [img('1587593810167-a84920ea0781')], video_url: '', video_links: [], description: 'Gà ta thả vườn, thịt dai ngọt tự nhiên. 1 con ~1.2kg.' },
  { id: 'p3-46', shop_id: S3, name: 'Ức Gà Fillet', price: 75000, category: 'Thịt & Đạm', category_id: 'cat-cx4c', stock: 55, position: 8, is_active: true, image_url: img('1587593810167-a84920ea0781'), images: [img('1587593810167-a84920ea0781')], video_url: '', video_links: [], description: 'Ức gà fillet ít mỡ, giàu protein. Khay 400g.' },
  { id: 'p3-47', shop_id: S3, name: 'Đậu Hũ Non', price: 12000, category: 'Thịt & Đạm', category_id: 'cat-cx4d', stock: 80, position: 9, is_active: true, image_url: img('1583224964978-2c899ba14a0f'), images: [img('1583224964978-2c899ba14a0f')], video_url: '', video_links: [], description: 'Đậu hũ non mềm mịn, nấu canh, chiên giòn. 400g.' },
  { id: 'p3-48', shop_id: S3, name: 'Đậu Hũ Chiên Sẵn', price: 18000, category: 'Thịt & Đạm', category_id: 'cat-cx4d', stock: 70, position: 10, is_active: true, image_url: img('1583224964978-2c899ba14a0f'), images: [img('1583224964978-2c899ba14a0f')], video_url: '', video_links: [], description: 'Đậu hũ chiên sẵn giòn vàng, kho, xào đều ngon. 200g.' },
  { id: 'p3-49', shop_id: S3, name: 'Chả Lụa Chay', price: 35000, category: 'Thịt & Đạm', category_id: 'cat-cx4d', stock: 45, position: 11, is_active: true, image_url: img('1583224964978-2c899ba14a0f'), images: [img('1583224964978-2c899ba14a0f')], video_url: '', video_links: [], description: 'Chả lụa chay từ đậu nành, thơm ngon. 250g.' },
  { id: 'p3-50', shop_id: S3, name: 'Trứng Gà Ta (10 quả)', price: 42000, category: 'Thịt & Đạm', category_id: 'cat-cx4d', stock: 100, position: 12, is_active: true, is_featured: true, image_url: img('1582722872445-44dc5f7e3c8f'), images: [img('1582722872445-44dc5f7e3c8f')], video_url: '', video_links: [], description: 'Trứng gà ta thả vườn, lòng đỏ đậm. Vỉ 10 quả.' },
  { id: 'p3-51', shop_id: S3, name: 'Vịt Quay Nguyên Con', price: 220000, category: 'Thịt & Đạm', category_id: 'cat-cx4c', stock: 15, position: 13, is_active: true, image_url: img('1587593810167-a84920ea0781'), images: [img('1587593810167-a84920ea0781')], video_url: '', video_links: [], description: 'Vịt quay giòn da, thấm gia vị đậm đà. 1 con.' },
  // ─── SỮA & BƠ (12) ───
  { id: 'p3-52', shop_id: S3, name: 'Sữa Tươi TH True Milk 1L', price: 38000, category: 'Sữa & Bơ', category_id: 'cat-cx5a', stock: 80, position: 1, is_active: true, is_featured: true, image_url: img('1563636619-e9143da7973b'), images: [img('1563636619-e9143da7973b')], video_url: '', video_links: [], description: 'Sữa tươi TH True Milk tiệt trùng không đường. 1 lít.' },
  { id: 'p3-53', shop_id: S3, name: 'Sữa Đậu Nành Fami', price: 28000, category: 'Sữa & Bơ', category_id: 'cat-cx5a', stock: 100, position: 2, is_active: true, image_url: img('1563636619-e9143da7973b'), images: [img('1563636619-e9143da7973b')], video_url: '', video_links: [], description: 'Sữa đậu nành Fami nguyên chất, bổ sung canxi. 1 lít.' },
  { id: 'p3-54', shop_id: S3, name: 'Sữa Hạt Óc Chó', price: 55000, category: 'Sữa & Bơ', category_id: 'cat-cx5a', stock: 50, position: 3, is_active: true, image_url: img('1563636619-e9143da7973b'), images: [img('1563636619-e9143da7973b')], video_url: '', video_links: [], description: 'Sữa hạt óc chó thơm béo, giàu DHA. 750ml.' },
  { id: 'p3-55', shop_id: S3, name: 'Sữa Chua Vinamilk (Lốc 4)', price: 25000, category: 'Sữa & Bơ', category_id: 'cat-cx5b', stock: 90, position: 4, is_active: true, image_url: img('1488477181946-6428a0291777'), images: [img('1488477181946-6428a0291777')], video_url: '', video_links: [], description: 'Sữa chua Vinamilk có đường, lốc 4 hũ.' },
  { id: 'p3-56', shop_id: S3, name: 'Sữa Chua Hy Lạp (Greek)', price: 45000, category: 'Sữa & Bơ', category_id: 'cat-cx5b', stock: 60, position: 5, is_active: true, image_url: img('1488477181946-6428a0291777'), images: [img('1488477181946-6428a0291777')], video_url: '', video_links: [], description: 'Sữa chua Hy Lạp đặc béo, ít đường, giàu protein. 150g.' },
  { id: 'p3-57', shop_id: S3, name: 'Phô Mai Con Bò Cười (8 miếng)', price: 32000, category: 'Sữa & Bơ', category_id: 'cat-cx5c', stock: 75, position: 6, is_active: true, image_url: img('1486297678908-f040fdb4adc8'), images: [img('1486297678908-f040fdb4adc8')], video_url: '', video_links: [], description: 'Phô mai Con Bò Cười tan chảy, giàu canxi. Hộp 8 miếng.' },
  { id: 'p3-58', shop_id: S3, name: 'Phô Mai Mozzarella', price: 85000, category: 'Sữa & Bơ', category_id: 'cat-cx5c', stock: 40, position: 7, is_active: true, image_url: img('1486297678908-f040fdb4adc8'), images: [img('1486297678908-f040fdb4adc8')], video_url: '', video_links: [], description: 'Phô mai Mozzarella kéo sợi, làm pizza, pasta. 200g.' },
  { id: 'p3-59', shop_id: S3, name: 'Bơ Lạt Anchor', price: 65000, category: 'Sữa & Bơ', category_id: 'cat-cx5c', stock: 45, position: 8, is_active: true, image_url: img('1589985270826-4b7bb135bc9d'), images: [img('1589985270826-4b7bb135bc9d')], video_url: '', video_links: [], description: 'Bơ lạt Anchor New Zealand, dùng nướng bánh, làm bếp. 227g.' },
  { id: 'p3-60', shop_id: S3, name: 'Sữa Chua Uống Yakult', price: 22000, category: 'Sữa & Bơ', category_id: 'cat-cx5b', stock: 100, position: 9, is_active: true, image_url: img('1488477181946-6428a0291777'), images: [img('1488477181946-6428a0291777')], video_url: '', video_links: [], description: 'Sữa chua uống Yakult, tốt cho hệ tiêu hóa. Lốc 5 chai.' },
  { id: 'p3-61', shop_id: S3, name: 'Phô Mai Lát Burger', price: 55000, category: 'Sữa & Bơ', category_id: 'cat-cx5c', stock: 50, position: 10, is_active: true, image_url: img('1486297678908-f040fdb4adc8'), images: [img('1486297678908-f040fdb4adc8')], video_url: '', video_links: [], description: 'Phô mai lát Cheddar, kẹp burger, sandwich. 12 lát.' },
  { id: 'p3-62', shop_id: S3, name: 'Kem Tươi Whipping', price: 78000, category: 'Sữa & Bơ', category_id: 'cat-cx5a', stock: 30, position: 11, is_active: true, image_url: img('1563636619-e9143da7973b'), images: [img('1563636619-e9143da7973b')], video_url: '', video_links: [], description: 'Kem tươi whipping Elle & Vire, dùng làm bánh. 200ml.' },
  { id: 'p3-63', shop_id: S3, name: 'Sữa Chua Dẻo Nhật', price: 35000, category: 'Sữa & Bơ', category_id: 'cat-cx5b', stock: 55, position: 12, is_active: true, image_url: img('1488477181946-6428a0291777'), images: [img('1488477181946-6428a0291777')], video_url: '', video_links: [], description: 'Sữa chua dẻo Nhật mịn mượt, hương vanilla. 3 hũ.' },
  // ─── ĐỒ UỐNG (12) ───
  { id: 'p3-64', shop_id: S3, name: 'Nước Dừa Tươi Đóng Chai', price: 25000, category: 'Đồ Uống', category_id: 'cat-cx6a', stock: 100, position: 1, is_active: true, is_featured: true, image_url: img('1544145945-f90425340c7e'), images: [img('1544145945-f90425340c7e')], video_url: '', video_links: [], description: 'Nước dừa tươi 100% nguyên chất, mát giải nhiệt. 500ml.' },
  { id: 'p3-65', shop_id: S3, name: 'Nước Ép Cam Ép Chậm', price: 45000, category: 'Đồ Uống', category_id: 'cat-cx6a', stock: 60, position: 2, is_active: true, image_url: img('1621506289937-a8855f9b04a1'), images: [img('1621506289937-a8855f9b04a1')], video_url: '', video_links: [], description: 'Nước cam ép chậm nguyên chất, không đường, không chất bảo quản. 350ml.' },
  { id: 'p3-66', shop_id: S3, name: 'Trà Ô Long Cao Cấp', price: 120000, category: 'Đồ Uống', category_id: 'cat-cx6b', stock: 40, position: 3, is_active: true, image_url: img('1556679343-c7306c1976bc'), images: [img('1556679343-c7306c1976bc')], video_url: '', video_links: [], description: 'Trà Ô Long Đà Lạt cao cấp, hương thơm đặc trưng. Hộp 100g.' },
  { id: 'p3-67', shop_id: S3, name: 'Cà Phê Phin Trung Nguyên', price: 75000, category: 'Đồ Uống', category_id: 'cat-cx6b', stock: 55, position: 4, is_active: true, image_url: img('1559496417-e7f25cb247f3'), images: [img('1559496417-e7f25cb247f3')], video_url: '', video_links: [], description: 'Cà phê phin Trung Nguyên Sáng Tạo 5, rang xay. 500g.' },
  { id: 'p3-68', shop_id: S3, name: 'Sinh Tố Xoài Đóng Chai', price: 35000, category: 'Đồ Uống', category_id: 'cat-cx6a', stock: 70, position: 5, is_active: true, image_url: img('1621506289937-a8855f9b04a1'), images: [img('1621506289937-a8855f9b04a1')], video_url: '', video_links: [], description: 'Sinh tố xoài nguyên chất, đặc sánh. 350ml.' },
  { id: 'p3-69', shop_id: S3, name: 'Nước Khoáng Lavie 1.5L', price: 12000, category: 'Đồ Uống', category_id: 'cat-cx6c', stock: 200, position: 6, is_active: true, image_url: img('1548839140-29a749e1cf4d'), images: [img('1548839140-29a749e1cf4d')], video_url: '', video_links: [], description: 'Nước khoáng thiên nhiên Lavie. Chai 1.5 lít.' },
  { id: 'p3-70', shop_id: S3, name: 'Trà Xanh Không Độ', price: 10000, category: 'Đồ Uống', category_id: 'cat-cx6c', stock: 150, position: 7, is_active: true, image_url: img('1556679343-c7306c1976bc'), images: [img('1556679343-c7306c1976bc')], video_url: '', video_links: [], description: 'Trà xanh Không Độ, thanh mát giải nhiệt. Chai 500ml.' },
  { id: 'p3-71', shop_id: S3, name: 'Nước Rau Má Đóng Chai', price: 18000, category: 'Đồ Uống', category_id: 'cat-cx6a', stock: 80, position: 8, is_active: true, image_url: img('1621506289937-a8855f9b04a1'), images: [img('1621506289937-a8855f9b04a1')], video_url: '', video_links: [], description: 'Nước rau má tươi nguyên chất, giải nhiệt. 350ml.' },
  { id: 'p3-72', shop_id: S3, name: 'Coca-Cola Lon 6 Pack', price: 65000, category: 'Đồ Uống', category_id: 'cat-cx6c', stock: 90, position: 9, is_active: true, image_url: img('1548839140-29a749e1cf4d'), images: [img('1548839140-29a749e1cf4d')], video_url: '', video_links: [], description: 'Coca-Cola lon 330ml, lốc 6 lon.' },
  { id: 'p3-73', shop_id: S3, name: 'Trà Sen Hà Nội', price: 95000, category: 'Đồ Uống', category_id: 'cat-cx6b', stock: 35, position: 10, is_active: true, image_url: img('1556679343-c7306c1976bc'), images: [img('1556679343-c7306c1976bc')], video_url: '', video_links: [], description: 'Trà sen Tây Hồ ướp thủ công, hương sen dịu nhẹ. 100g.' },
  { id: 'p3-74', shop_id: S3, name: 'Nước Ép Lựu', price: 55000, category: 'Đồ Uống', category_id: 'cat-cx6a', stock: 45, position: 11, is_active: true, image_url: img('1621506289937-a8855f9b04a1'), images: [img('1621506289937-a8855f9b04a1')], video_url: '', video_links: [], description: 'Nước ép lựu nguyên chất, giàu chống oxy hóa. 350ml.' },
  { id: 'p3-75', shop_id: S3, name: 'Cà Phê Sữa Đá Lon', price: 15000, category: 'Đồ Uống', category_id: 'cat-cx6b', stock: 120, position: 12, is_active: true, image_url: img('1559496417-e7f25cb247f3'), images: [img('1559496417-e7f25cb247f3')], video_url: '', video_links: [], description: 'Cà phê sữa đá Highlands lon 235ml, uống liền.' },
  // ─── BÁNH & NGŨ CỐC (13) ───
  { id: 'p3-76', shop_id: S3, name: 'Bánh Mì Sandwich Đen', price: 35000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7a', stock: 50, position: 1, is_active: true, is_featured: true, image_url: img('1509440159596-0249088772ff'), images: [img('1509440159596-0249088772ff')], video_url: '', video_links: [], description: 'Bánh mì sandwich lúa mạch đen, giàu chất xơ. 1 ổ (400g).' },
  { id: 'p3-77', shop_id: S3, name: 'Bánh Mì Baguette', price: 15000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7a', stock: 80, position: 2, is_active: true, image_url: img('1549931319-a545dcf3bc73'), images: [img('1549931319-a545dcf3bc73')], video_url: '', video_links: [], description: 'Bánh mì baguette Pháp giòn vỏ, mềm ruột. 1 ổ.' },
  { id: 'p3-78', shop_id: S3, name: 'Croissant Bơ Pháp', price: 28000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7b', stock: 45, position: 3, is_active: true, image_url: img('1555507036-ab1f4038024a'), images: [img('1555507036-ab1f4038024a')], video_url: '', video_links: [], description: 'Croissant bơ Pháp nướng giòn, thơm bơ. 2 cái.' },
  { id: 'p3-79', shop_id: S3, name: 'Bánh Flan Caramel', price: 22000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7b', stock: 60, position: 4, is_active: true, image_url: img('1555507036-ab1f4038024a'), images: [img('1555507036-ab1f4038024a')], video_url: '', video_links: [], description: 'Bánh flan caramel mềm mịn, vị trứng sữa béo. 3 hũ.' },
  { id: 'p3-80', shop_id: S3, name: 'Yến Mạch Quaker 1kg', price: 85000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7c', stock: 55, position: 5, is_active: true, image_url: img('1517093602195-b40af5c9df91'), images: [img('1517093602195-b40af5c9df91')], video_url: '', video_links: [], description: 'Yến mạch Quaker nguyên hạt, ăn sáng healthy. 1kg.' },
  { id: 'p3-81', shop_id: S3, name: 'Granola Trái Cây Sấy', price: 95000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7c', stock: 40, position: 6, is_active: true, image_url: img('1517093602195-b40af5c9df91'), images: [img('1517093602195-b40af5c9df91')], video_url: '', video_links: [], description: 'Granola mix hạt, trái cây sấy, mật ong. Túi 500g.' },
  { id: 'p3-82', shop_id: S3, name: 'Bánh Tráng Trộn Tây Ninh', price: 35000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7a', stock: 70, position: 7, is_active: true, image_url: img('1549931319-a545dcf3bc73'), images: [img('1549931319-a545dcf3bc73')], video_url: '', video_links: [], description: 'Bánh tráng trộn Tây Ninh đầy đủ gia vị. 1 phần.' },
  { id: 'p3-83', shop_id: S3, name: 'Bánh Cupcake Socola', price: 45000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7b', stock: 35, position: 8, is_active: true, image_url: img('1555507036-ab1f4038024a'), images: [img('1555507036-ab1f4038024a')], video_url: '', video_links: [], description: 'Cupcake socola phủ kem tươi, mềm xốp. 4 cái.' },
  { id: 'p3-84', shop_id: S3, name: 'Muesli Hạt & Berry', price: 110000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7c', stock: 30, position: 9, is_active: true, image_url: img('1517093602195-b40af5c9df91'), images: [img('1517093602195-b40af5c9df91')], video_url: '', video_links: [], description: 'Muesli Thụy Sĩ trộn hạt, berry sấy. Túi 500g.' },
  { id: 'p3-85', shop_id: S3, name: 'Bánh Mì Nguyên Cám', price: 40000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7a', stock: 50, position: 10, is_active: true, image_url: img('1509440159596-0249088772ff'), images: [img('1509440159596-0249088772ff')], video_url: '', video_links: [], description: 'Bánh mì nguyên cám giàu chất xơ, ít đường. Ổ 350g.' },
  { id: 'p3-86', shop_id: S3, name: 'Bánh Quy Bơ Đan Mạch', price: 65000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7b', stock: 45, position: 11, is_active: true, image_url: img('1555507036-ab1f4038024a'), images: [img('1555507036-ab1f4038024a')], video_url: '', video_links: [], description: 'Bánh quy bơ Đan Mạch hộp thiếc truyền thống. 454g.' },
  { id: 'p3-87', shop_id: S3, name: 'Thanh Protein Granola', price: 35000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7c', stock: 60, position: 12, is_active: true, image_url: img('1517093602195-b40af5c9df91'), images: [img('1517093602195-b40af5c9df91')], video_url: '', video_links: [], description: 'Thanh năng lượng granola protein, snack healthy. 1 thanh.' },
  { id: 'p3-88', shop_id: S3, name: 'Bánh Bông Lan Trứng Muối', price: 55000, category: 'Bánh & Ngũ Cốc', category_id: 'cat-cx7b', stock: 40, position: 13, is_active: true, image_url: img('1555507036-ab1f4038024a'), images: [img('1555507036-ab1f4038024a')], video_url: '', video_links: [], description: 'Bánh bông lan trứng muối béo ngậy, mềm xốp. 1 hộp 4 cái.' },
  // ─── GIA VỊ & ĐỒ KHÔ (12) ───
  { id: 'p3-89', shop_id: S3, name: 'Nước Mắm Phú Quốc 40 Độ', price: 65000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8a', stock: 80, position: 1, is_active: true, is_featured: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Nước mắm Phú Quốc truyền thống 40 độ đạm. Chai 500ml.' },
  { id: 'p3-90', shop_id: S3, name: 'Nước Tương Maggi', price: 22000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8a', stock: 90, position: 2, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Nước tương Maggi đậm đà, dùng kho, chấm. 700ml.' },
  { id: 'p3-91', shop_id: S3, name: 'Tương Ớt Sriracha', price: 35000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8a', stock: 75, position: 3, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Tương ớt Sriracha Huy Fong, cay nồng thơm. 482g.' },
  { id: 'p3-92', shop_id: S3, name: 'Hạt Nêm Knorr Từ Thịt', price: 28000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8b', stock: 100, position: 4, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Hạt nêm Knorr từ thịt heo và xương ống. Gói 400g.' },
  { id: 'p3-93', shop_id: S3, name: 'Tiêu Đen Phú Quốc', price: 55000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8b', stock: 60, position: 5, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Tiêu đen Phú Quốc nguyên hạt, cay thơm nồng. 100g.' },
  { id: 'p3-94', shop_id: S3, name: 'Mì Gói Hảo Hảo Tôm Chua', price: 4000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8c', stock: 300, position: 6, is_active: true, image_url: img('1612929633738-8fe44f7ec841'), images: [img('1612929633738-8fe44f7ec841')], video_url: '', video_links: [], description: 'Mì Hảo Hảo vị tôm chua cay, gói 75g. Bán lẻ 1 gói.' },
  { id: 'p3-95', shop_id: S3, name: 'Bún Khô Bình Tây', price: 18000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8c', stock: 80, position: 7, is_active: true, image_url: img('1612929633738-8fe44f7ec841'), images: [img('1612929633738-8fe44f7ec841')], video_url: '', video_links: [], description: 'Bún khô Bình Tây truyền thống, sợi dai. 500g.' },
  { id: 'p3-96', shop_id: S3, name: 'Miến Dong Bắc Kạn', price: 25000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8c', stock: 65, position: 8, is_active: true, image_url: img('1612929633738-8fe44f7ec841'), images: [img('1612929633738-8fe44f7ec841')], video_url: '', video_links: [], description: 'Miến dong Bắc Kạn nguyên chất, dai giòn. 500g.' },
  { id: 'p3-97', shop_id: S3, name: 'Dầu Mè Kadoya', price: 48000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8b', stock: 55, position: 9, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Dầu mè Kadoya Nhật Bản nguyên chất, thơm nức. 163ml.' },
  { id: 'p3-98', shop_id: S3, name: 'Mì Trứng Safoco', price: 22000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8c', stock: 70, position: 10, is_active: true, image_url: img('1612929633738-8fe44f7ec841'), images: [img('1612929633738-8fe44f7ec841')], video_url: '', video_links: [], description: 'Mì trứng Safoco sợi tròn, nấu mì xào, súp. 500g.' },
  { id: 'p3-99', shop_id: S3, name: 'Bột Nghệ Nguyên Chất', price: 42000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8b', stock: 50, position: 11, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Bột nghệ nguyên chất Đắk Lắk, dùng nấu ăn, pha trà. 100g.' },
  { id: 'p3-100', shop_id: S3, name: 'Dầu Ăn Tường An 1L', price: 38000, category: 'Gia Vị & Đồ Khô', category_id: 'cat-cx8b', stock: 100, position: 12, is_active: true, image_url: img('1596040033229-a9821ebd058d'), images: [img('1596040033229-a9821ebd058d')], video_url: '', video_links: [], description: 'Dầu ăn Tường An cao cấp, chiên xào. Chai 1 lít.' },
];

// ── ORDERS ──
export const shop3Orders = [
  { id: 'ORD-CX001', shop_id: S3, customer_name: 'Trần Thị Mai', customer_phone: '0912345678', customer_email: 'mai@email.com', customer_address: '56 Lê Lợi, Q1, TP.HCM', note: 'Giao buổi sáng', status: 'confirmed', total_amount: 685000, items: [
    { product_id: 'p3-27', name: 'Cá Hồi Na Uy Fillet', price: 320000, quantity: 1, subtotal: 320000 },
    { product_id: 'p3-28', name: 'Tôm Sú Sống', price: 180000, quantity: 1, subtotal: 180000 },
    { product_id: 'p3-04', name: 'Cà Rốt Đà Lạt', price: 28000, quantity: 2, subtotal: 56000 },
    { product_id: 'p3-52', name: 'Sữa Tươi TH True Milk 1L', price: 38000, quantity: 1, subtotal: 38000 },
    { product_id: 'p3-89', name: 'Nước Mắm Phú Quốc 40 Độ', price: 65000, quantity: 1, subtotal: 65000 },
    { product_id: 'p3-04', name: 'Cà Rốt Đà Lạt', price: 28000, quantity: 1, subtotal: 26000 }
  ], created_at: '2026-02-06T08:30:00Z' },
  { id: 'ORD-CX002', shop_id: S3, customer_name: 'Nguyễn Văn Hùng', customer_phone: '0923456789', customer_email: '', customer_address: '78 Nguyễn Huệ, Q1, TP.HCM', note: '', status: 'pending', total_amount: 522000, items: [
    { product_id: 'p3-42', name: 'Thăn Nội Bò Úc', price: 320000, quantity: 1, subtotal: 320000 },
    { product_id: 'p3-01', name: 'Rau Muống Hữu Cơ', price: 18000, quantity: 2, subtotal: 36000 },
    { product_id: 'p3-67', name: 'Cà Phê Phin Trung Nguyên', price: 75000, quantity: 1, subtotal: 75000 },
    { product_id: 'p3-80', name: 'Yến Mạch Quaker 1kg', price: 85000, quantity: 1, subtotal: 85000 },
    { product_id: 'p3-12', name: 'Rau Mồng Tơi', price: 15000, quantity: 1, subtotal: 6000 }
  ], created_at: '2026-02-06T10:15:00Z' },
  { id: 'ORD-CX003', shop_id: S3, customer_name: 'Lê Thị Hồng', customer_phone: '0934567890', customer_email: 'hong@email.com', customer_address: '22 Trần Hưng Đạo, Q5, TP.HCM', note: 'Gói quà', status: 'confirmed', total_amount: 965000, items: [
    { product_id: 'p3-16', name: 'Sầu Riêng Musang King', price: 450000, quantity: 1, subtotal: 450000 },
    { product_id: 'p3-19', name: 'Cherry Úc Đỏ', price: 280000, quantity: 1, subtotal: 280000 },
    { product_id: 'p3-21', name: 'Kiwi Vàng Zespri', price: 150000, quantity: 1, subtotal: 150000 },
    { product_id: 'p3-80', name: 'Yến Mạch Quaker 1kg', price: 85000, quantity: 1, subtotal: 85000 }
  ], created_at: '2026-02-06T14:45:00Z' },
  { id: 'ORD-CX004', shop_id: S3, customer_name: 'Phạm Minh Tuấn', customer_phone: '0945678901', customer_email: 'tuan@email.com', customer_address: '10 Pasteur, Q3, TP.HCM', note: '', status: 'pending', total_amount: 312000, items: [
    { product_id: 'p3-39', name: 'Ba Rọi Heo Rút Sườn', price: 115000, quantity: 1, subtotal: 115000 },
    { product_id: 'p3-50', name: 'Trứng Gà Ta (10 quả)', price: 42000, quantity: 2, subtotal: 84000 },
    { product_id: 'p3-08', name: 'Nấm Đùi Gà Tươi', price: 55000, quantity: 1, subtotal: 55000 },
    { product_id: 'p3-90', name: 'Nước Tương Maggi', price: 22000, quantity: 1, subtotal: 22000 },
    { product_id: 'p3-05', name: 'Khoai Tây Sạch', price: 35000, quantity: 1, subtotal: 36000 }
  ], created_at: '2026-02-07T09:00:00Z' },
  { id: 'ORD-CX005', shop_id: S3, customer_name: 'Võ Thị Lan', customer_phone: '0956789012', customer_email: '', customer_address: '88 Hai Bà Trưng, Q1, TP.HCM', note: 'Giao sau 5PM', status: 'shipped', total_amount: 445000, items: [
    { product_id: 'p3-14', name: 'Xoài Cát Hòa Lộc', price: 85000, quantity: 2, subtotal: 170000 },
    { product_id: 'p3-24', name: 'Táo Envy New Zealand', price: 160000, quantity: 1, subtotal: 160000 },
    { product_id: 'p3-66', name: 'Trà Ô Long Cao Cấp', price: 120000, quantity: 1, subtotal: 120000 },
    { product_id: 'p3-94', name: 'Mì Gói Hảo Hảo Tôm Chua', price: 4000, quantity: 1, subtotal: -5000 }
  ], created_at: '2026-02-05T16:30:00Z' },
  { id: 'ORD-CX006', shop_id: S3, customer_name: 'Đặng Quốc Bảo', customer_phone: '0967890123', customer_email: 'bao@email.com', customer_address: '45 Điện Biên Phủ, Bình Thạnh, TP.HCM', note: '', status: 'delivered', total_amount: 538000, items: [
    { product_id: 'p3-45', name: 'Gà Ta Nguyên Con', price: 165000, quantity: 1, subtotal: 165000 },
    { product_id: 'p3-31', name: 'Cua Biển Sống', price: 350000, quantity: 1, subtotal: 350000 },
    { product_id: 'p3-01', name: 'Rau Muống Hữu Cơ', price: 18000, quantity: 1, subtotal: 18000 },
    { product_id: 'p3-69', name: 'Nước Khoáng Lavie 1.5L', price: 12000, quantity: 1, subtotal: 5000 }
  ], created_at: '2026-02-03T11:00:00Z' },
  { id: 'ORD-CX007', shop_id: S3, customer_name: 'Huỳnh Thanh Thảo', customer_phone: '0978901234', customer_email: 'thao@email.com', customer_address: '33 Lý Tự Trọng, Q1, TP.HCM', note: '', status: 'confirmed', total_amount: 395000, items: [
    { product_id: 'p3-58', name: 'Phô Mai Mozzarella', price: 85000, quantity: 1, subtotal: 85000 },
    { product_id: 'p3-78', name: 'Croissant Bơ Pháp', price: 28000, quantity: 2, subtotal: 56000 },
    { product_id: 'p3-59', name: 'Bơ Lạt Anchor', price: 65000, quantity: 1, subtotal: 65000 },
    { product_id: 'p3-81', name: 'Granola Trái Cây Sấy', price: 95000, quantity: 2, subtotal: 190000 }
  ], created_at: '2026-02-07T07:45:00Z' },
  { id: 'ORD-CX008', shop_id: S3, customer_name: 'Phan Văn Đức', customer_phone: '0989012345', customer_email: '', customer_address: '12 Cách Mạng Tháng 8, Q3, TP.HCM', note: 'Gọi trước khi giao', status: 'pending', total_amount: 276000, items: [
    { product_id: 'p3-64', name: 'Nước Dừa Tươi Đóng Chai', price: 25000, quantity: 4, subtotal: 100000 },
    { product_id: 'p3-46', name: 'Ức Gà Fillet', price: 75000, quantity: 1, subtotal: 75000 },
    { product_id: 'p3-93', name: 'Tiêu Đen Phú Quốc', price: 55000, quantity: 1, subtotal: 55000 },
    { product_id: 'p3-07', name: 'Cà Chua Beef', price: 42000, quantity: 1, subtotal: 46000 }
  ], created_at: '2026-02-07T13:20:00Z' },
];

// ── BLOG POSTS ──
export const shop3Posts = [
  {
    id: 'post-cx1', shop_id: S3, title: 'Cách chọn rau củ tươi sạch mỗi ngày',
    description: '<p>Làm sao để chọn được <strong>rau củ quả tươi ngon</strong> và an toàn cho gia đình? Dưới đây là những mẹo nhỏ giúp bạn mua sắm thông minh hơn:</p><ul><li>Chọn rau lá xanh tươi, không héo úa hay có đốm vàng</li><li>Rau củ nên cứng chắc, không mềm nhũn</li><li>Ưu tiên mua tại nguồn uy tín có chứng nhận VietGAP</li><li>Tránh rau quá bóng mượt — có thể đã phun hóa chất</li></ul><p>Tại <strong>Chợ Xanh 365</strong>, tất cả rau củ đều được kiểm tra nguồn gốc và giao tươi trong ngày!</p>',
    thumbnail: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    images: [], attached_products: ['p3-01', 'p3-04', 'p3-11'], created_at: '2026-02-05T08:00:00Z'
  },
  {
    id: 'post-cx2', shop_id: S3, title: 'Top 5 loại trái cây giàu Vitamin C nhất',
    description: '<p>Bổ sung <strong>Vitamin C</strong> mỗi ngày giúp tăng cường sức đề kháng và làm đẹp da. Hãy thêm những loại trái cây sau vào thực đơn:</p><ol><li><strong>Cam sành</strong> - Nguồn vitamin C dồi dào từ miền Tây</li><li><strong>Ổi</strong> - Chứa gấp 4 lần cam về vitamin C</li><li><strong>Kiwi</strong> - Siêu trái cây nhập khẩu</li><li><strong>Xoài</strong> - Vừa ngon vừa bổ dưỡng</li><li><strong>Thanh long</strong> - Giàu chất chống oxy hóa</li></ol>',
    thumbnail: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=400&fit=crop',
    images: [], attached_products: ['p3-23', 'p3-22', 'p3-21', 'p3-14', 'p3-15'], created_at: '2026-02-04T10:00:00Z'
  },
];
