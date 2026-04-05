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
    post_carousel_position: 'top',
    max_products: 100,
    max_posts: 50,
    created_at: '2025-12-01T00:00:00Z'
  }
];

// ── Categories ─────────────────────────────────────────
export let mockCategories = [
  { id: 'cat-1', shop_id: 'shop-1', name: 'Electronics', description: 'Gadgets and devices', position: 1 },
  { id: 'cat-2', shop_id: 'shop-1', name: 'Fashion', description: 'Clothing and accessories', position: 2 },
  { id: 'cat-3', shop_id: 'shop-1', name: 'Home & Garden', description: 'Home decor and plants', position: 3 },
  { id: 'cat-4', shop_id: 'shop-1', name: 'Kitchen', description: 'Kitchen tools and equipment', position: 4 },
  { id: 'cat-5', shop_id: 'shop-1', name: 'Beauty & Health', description: 'Skincare, wellness and self-care', position: 5 },
  { id: 'cat-6', shop_id: 'shop-1', name: 'Sports & Outdoors', description: 'Fitness gear and outdoor equipment', position: 6 },
];

// ── Products ───────────────────────────────────────────
export let mockProducts = [
  { id: 'prod-1', shop_id: 'shop-1', name: 'Sony Wireless Headphones', price: 2490000, category: 'Electronics', category_id: 'cat-1', stock: 25, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop'], video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Premium wireless headphones with active noise cancellation and 30h battery life.' },
  { id: 'prod-2', shop_id: 'shop-1', name: 'Black Studio Headphones', price: 1850000, category: 'Electronics', category_id: 'cat-1', stock: 18, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=400&fit=crop'], video_url: '', description: 'Professional studio-grade headphones for music production.' },
  { id: 'prod-3', shop_id: 'shop-1', name: 'Grey Casual Sneakers', price: 1200000, category: 'Fashion', category_id: 'cat-2', stock: 40, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop'], video_url: '', description: 'Comfortable grey sneakers perfect for everyday wear.' },
  { id: 'prod-4', shop_id: 'shop-1', name: 'Minimalist Smartphone', price: 14500000, category: 'Electronics', category_id: 'cat-1', stock: 10, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=400&fit=crop'], video_url: '', description: 'Sleek smartphone with edge-to-edge display and triple camera system.' },
  { id: 'prod-5', shop_id: 'shop-1', name: 'Minimalist Succulent Pot', price: 320000, category: 'Home & Garden', category_id: 'cat-3', stock: 60, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop'], video_url: '', description: 'Modern ceramic pot perfect for small succulents and cacti.' },
  { id: 'prod-6', shop_id: 'shop-1', name: 'Handwoven Rattan Baskets', price: 450000, category: 'Home & Garden', category_id: 'cat-3', stock: 30, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=400&h=400&fit=crop'], video_url: '', description: 'Beautifully handwoven rattan baskets for storage and decoration.' },
  { id: 'prod-7', shop_id: 'shop-1', name: 'Ceramic Coffee Set', price: 380000, category: 'Kitchen', category_id: 'cat-4', stock: 20, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop'], video_url: '', description: 'Elegant ceramic coffee cup and saucer set, handmade.' },
  { id: 'prod-8', shop_id: 'shop-1', name: 'Smart Watch Pro', price: 3200000, category: 'Electronics', category_id: 'cat-1', stock: 15, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop'], video_url: '', description: 'Feature-packed smartwatch with health tracking and GPS.' },
  { id: 'prod-9', shop_id: 'shop-1', name: 'Leather Crossbody Bag', price: 890000, category: 'Fashion', category_id: 'cat-2', stock: 35, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop'], video_url: '', description: 'Genuine leather crossbody bag with adjustable strap.' },
  { id: 'prod-10', shop_id: 'shop-1', name: 'AirPods Pro Max', price: 6500000, category: 'Electronics', category_id: 'cat-1', stock: 8, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1588423771073-b8903fde1c68?w=400&h=400&fit=crop'], video_url: '', description: 'Over-ear headphones with spatial audio and transparency mode.' },
  { id: 'prod-11', shop_id: 'shop-1', name: 'Designer Sunglasses', price: 1650000, category: 'Fashion', category_id: 'cat-2', stock: 22, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop'], video_url: '', description: 'UV-protected designer sunglasses with polarized lenses.' },
  { id: 'prod-12', shop_id: 'shop-1', name: 'Japanese Kitchen Knife Set', price: 2100000, category: 'Kitchen', category_id: 'cat-4', stock: 12, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1566454825481-9c31bd88bcea?w=400&h=400&fit=crop'], video_url: '', description: 'Professional-grade Japanese steel knife set with wooden block.' },
  // ── Electronics (6 more) ──
  { id: 'prod-13', shop_id: 'shop-1', name: 'Portable Bluetooth Speaker', price: 1290000, category: 'Electronics', category_id: 'cat-1', stock: 30, position: 6, is_active: true, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'], video_url: '', description: 'Waterproof portable speaker with 360-degree sound and 12h battery.' },
  { id: 'prod-14', shop_id: 'shop-1', name: 'Wireless Charging Pad', price: 590000, category: 'Electronics', category_id: 'cat-1', stock: 45, position: 7, is_active: true, image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop'], video_url: '', description: 'Fast wireless charging pad compatible with all Qi-enabled devices.' },
  { id: 'prod-15', shop_id: 'shop-1', name: 'Mechanical Gaming Keyboard', price: 2150000, category: 'Electronics', category_id: 'cat-1', stock: 20, position: 8, is_active: true, image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=400&fit=crop'], video_url: '', description: 'RGB mechanical keyboard with Cherry MX switches and aluminum frame.' },
  { id: 'prod-16', shop_id: 'shop-1', name: 'USB-C Hub Adapter', price: 780000, category: 'Electronics', category_id: 'cat-1', stock: 50, position: 9, is_active: true, image_url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop'], video_url: '', description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.' },
  { id: 'prod-17', shop_id: 'shop-1', name: 'Noise Cancelling Earbuds', price: 1750000, category: 'Electronics', category_id: 'cat-1', stock: 28, position: 10, is_active: true, image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop'], video_url: '', description: 'True wireless earbuds with hybrid ANC and 8h playback.' },
  { id: 'prod-18', shop_id: 'shop-1', name: 'Tablet Stand Holder', price: 350000, category: 'Electronics', category_id: 'cat-1', stock: 40, position: 11, is_active: true, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop'], video_url: '', description: 'Adjustable aluminum tablet and phone stand for desk.' },
  // ── Fashion (5 more) ──
  { id: 'prod-19', shop_id: 'shop-1', name: 'Canvas Tote Bag', price: 420000, category: 'Fashion', category_id: 'cat-2', stock: 55, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop'], video_url: '', description: 'Eco-friendly canvas tote bag, perfect for daily use and shopping.' },
  { id: 'prod-20', shop_id: 'shop-1', name: 'Vintage Analog Watch', price: 2800000, category: 'Fashion', category_id: 'cat-2', stock: 15, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop'], video_url: '', description: 'Classic vintage-style analog watch with leather strap.' },
  { id: 'prod-21', shop_id: 'shop-1', name: 'Minimalist Wallet', price: 650000, category: 'Fashion', category_id: 'cat-2', stock: 40, position: 6, is_active: true, image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop'], video_url: '', description: 'Slim RFID-blocking wallet crafted from genuine leather.' },
  { id: 'prod-22', shop_id: 'shop-1', name: 'Linen Summer Dress', price: 780000, category: 'Fashion', category_id: 'cat-2', stock: 25, position: 7, is_active: true, image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=400&h=400&fit=crop'], video_url: '', description: 'Breathable linen dress, relaxed fit for summer days.' },
  { id: 'prod-23', shop_id: 'shop-1', name: 'Beaded Bracelet Set', price: 280000, category: 'Fashion', category_id: 'cat-2', stock: 60, position: 8, is_active: true, image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop'], video_url: '', description: 'Handmade natural stone beaded bracelet set of 3.' },
  // ── Home & Garden (5 more) ──
  { id: 'prod-24', shop_id: 'shop-1', name: 'Scented Soy Candle Set', price: 390000, category: 'Home & Garden', category_id: 'cat-3', stock: 35, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&h=400&fit=crop'], video_url: '', description: 'Set of 3 hand-poured soy candles: lavender, vanilla, eucalyptus.' },
  { id: 'prod-25', shop_id: 'shop-1', name: 'Macrame Wall Hanging', price: 520000, category: 'Home & Garden', category_id: 'cat-3', stock: 18, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1622127922040-13cab637ee78?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1622127922040-13cab637ee78?w=400&h=400&fit=crop'], video_url: '', description: 'Handwoven cotton macrame wall decor, bohemian style.' },
  { id: 'prod-26', shop_id: 'shop-1', name: 'Indoor Plant Starter Kit', price: 680000, category: 'Home & Garden', category_id: 'cat-3', stock: 22, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop'], video_url: '', description: 'Complete kit with 3 pots, soil, seeds, and care guide.' },
  { id: 'prod-27', shop_id: 'shop-1', name: 'Bamboo Desk Organizer', price: 290000, category: 'Home & Garden', category_id: 'cat-3', stock: 40, position: 6, is_active: true, image_url: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=400&h=400&fit=crop'], video_url: '', description: 'Multi-compartment bamboo desk organizer for pens, cards, and phone.' },
  { id: 'prod-28', shop_id: 'shop-1', name: 'Linen Throw Pillow Cover', price: 180000, category: 'Home & Garden', category_id: 'cat-3', stock: 50, position: 7, is_active: true, image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=400&fit=crop'], video_url: '', description: 'Natural linen throw pillow cover, 45x45cm, multiple colors.' },
  // ── Kitchen (4 more) ──
  { id: 'prod-29', shop_id: 'shop-1', name: 'Pour-Over Coffee Dripper', price: 450000, category: 'Kitchen', category_id: 'cat-4', stock: 30, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop'], video_url: '', description: 'Glass pour-over coffee dripper with reusable stainless steel filter.' },
  { id: 'prod-30', shop_id: 'shop-1', name: 'Wooden Cutting Board', price: 560000, category: 'Kitchen', category_id: 'cat-4', stock: 25, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=400&h=400&fit=crop'], video_url: '', description: 'Premium acacia wood cutting board with juice groove.' },
  { id: 'prod-31', shop_id: 'shop-1', name: 'Insulated Water Bottle', price: 380000, category: 'Kitchen', category_id: 'cat-4', stock: 45, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop'], video_url: '', description: 'Double-wall stainless steel bottle, keeps cold 24h / hot 12h.' },
  { id: 'prod-32', shop_id: 'shop-1', name: 'Silicone Cooking Utensil Set', price: 420000, category: 'Kitchen', category_id: 'cat-4', stock: 35, position: 6, is_active: true, image_url: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=400&fit=crop'], video_url: '', description: 'Heat-resistant silicone utensil set of 6 with wooden handles.' },
  // ── Beauty & Health (5 new) ──
  { id: 'prod-33', shop_id: 'shop-1', name: 'Jade Face Roller', price: 290000, category: 'Beauty & Health', category_id: 'cat-5', stock: 40, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=400&fit=crop'], video_url: '', description: 'Natural jade stone face roller for lymphatic drainage massage.' },
  { id: 'prod-34', shop_id: 'shop-1', name: 'Organic Skincare Gift Set', price: 850000, category: 'Beauty & Health', category_id: 'cat-5', stock: 20, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1570194065650-d99fb4d8a609?w=400&h=400&fit=crop'], video_url: '', description: 'Organic cleanser, toner, and moisturizer set for all skin types.' },
  { id: 'prod-35', shop_id: 'shop-1', name: 'Essential Oil Diffuser', price: 620000, category: 'Beauty & Health', category_id: 'cat-5', stock: 30, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop'], video_url: '', description: 'Ultrasonic aroma diffuser with LED mood lighting and timer.' },
  { id: 'prod-36', shop_id: 'shop-1', name: 'Bamboo Toothbrush Pack', price: 120000, category: 'Beauty & Health', category_id: 'cat-5', stock: 80, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop'], video_url: '', description: 'Eco-friendly bamboo toothbrush set of 4 with charcoal bristles.' },
  { id: 'prod-37', shop_id: 'shop-1', name: 'Hair Care Oil Serum', price: 380000, category: 'Beauty & Health', category_id: 'cat-5', stock: 35, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop'], video_url: '', description: 'Argan and jojoba oil blend for smooth, shiny, and healthy hair.' },
  // ── Sports & Outdoors (5 new) ──
  { id: 'prod-38', shop_id: 'shop-1', name: 'Yoga Mat Premium', price: 750000, category: 'Sports & Outdoors', category_id: 'cat-6', stock: 25, position: 1, is_active: true, image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop'], video_url: '', description: 'Non-slip TPE yoga mat, 6mm thick with carrying strap.' },
  { id: 'prod-39', shop_id: 'shop-1', name: 'Resistance Bands Set', price: 350000, category: 'Sports & Outdoors', category_id: 'cat-6', stock: 50, position: 2, is_active: true, image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop'], video_url: '', description: 'Set of 5 resistance bands with different strengths and door anchor.' },
  { id: 'prod-40', shop_id: 'shop-1', name: 'Hiking Backpack 40L', price: 1450000, category: 'Sports & Outdoors', category_id: 'cat-6', stock: 15, position: 3, is_active: true, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1622260614153-03223fb72052?w=400&h=400&fit=crop'], video_url: '', description: 'Waterproof hiking backpack with rain cover and hydration sleeve.' },
  { id: 'prod-41', shop_id: 'shop-1', name: 'Jump Rope Speed Pro', price: 220000, category: 'Sports & Outdoors', category_id: 'cat-6', stock: 60, position: 4, is_active: true, image_url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=400&fit=crop'], video_url: '', description: 'Adjustable speed jump rope with ball bearings and foam handles.' },
  { id: 'prod-42', shop_id: 'shop-1', name: 'Camping Hammock', price: 580000, category: 'Sports & Outdoors', category_id: 'cat-6', stock: 20, position: 5, is_active: true, image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop'], video_url: '', description: 'Lightweight nylon camping hammock with tree straps, holds up to 200kg.' },
];

// ── Banners ────────────────────────────────────────────
export let mockBanners = [
  { id: 'banner-1', shop_id: 'shop-1', image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=500&fit=crop', position: 1 },
  { id: 'banner-2', shop_id: 'shop-1', image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=500&fit=crop', position: 2 },
  { id: 'banner-3', shop_id: 'shop-1', image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=500&fit=crop', position: 3 },
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

// ── Blog Posts ─────────────────────────────────────────
export let mockPosts = [
  {
    id: 'post-1', shop_id: 'shop-1', title: 'Top 10 Wireless Headphones for 2026',
    description: '<p>Looking for the <strong>best wireless headphones</strong> in 2026? We\'ve curated our top picks for every budget and use case.</p><p>From studio-quality sound to everyday commuting, these headphones deliver exceptional audio experiences.</p><ul><li>Sony Wireless Headphones - Best overall</li><li>AirPods Pro Max - Best premium</li><li>Black Studio Headphones - Best for production</li></ul><p>Each model has been tested extensively for sound quality, comfort, battery life, and noise cancellation performance.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop'],
    attached_products: ['prod-1', 'prod-2', 'prod-10'],
    created_at: '2026-02-10T08:00:00Z'
  },
  {
    id: 'post-2', shop_id: 'shop-1', title: 'Summer Fashion Essentials You Need',
    description: '<p>Get ready for summer with our <strong>essential fashion picks</strong>. From lightweight dresses to trendy accessories, we have everything you need.</p><p>This season is all about <em>natural fabrics</em>, minimalist designs, and earth tones that complement any wardrobe.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=400&fit=crop'],
    attached_products: ['prod-22', 'prod-23', 'prod-21'],
    created_at: '2026-02-08T12:00:00Z'
  },
  {
    id: 'post-3', shop_id: 'shop-1', title: 'Home Office Setup Guide',
    description: '<p>Create the perfect <strong>home office</strong> with our curated selection of desk organizers, plants, and comfort accessories.</p><p>A well-organized workspace boosts productivity and creativity. Here are our recommendations for making your home office both functional and beautiful.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=600&h=400&fit=crop',
    images: [],
    attached_products: ['prod-27', 'prod-5', 'prod-26'],
    created_at: '2026-02-05T16:00:00Z'
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
    return { data: { ...safe, token: `mock-token-${user.id}` } };
  }

  if (m === 'post' && path === '/auth/register') {
    if (mockUsers.find(u => u.email === body.email)) return { error: 'Email already registered', status: 400 };
    const newUser = { id: genId('user'), email: body.email, password: body.password, name: body.name, role: 'customer', status: 'active', shop_name: null };
    mockUsers.push(newUser);
    const safe = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    setCurrentUser(safe);
    return { data: { ...safe, token: `mock-token-${newUser.id}` } };
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
    const newProd = { id: genId('prod'), shop_id: 'shop-1', ...body, category: cat?.name || '', is_active: true, images: body.images || (body.image_url ? [body.image_url] : []), video_url: body.video_url || '' };
    if (!newProd.image_url && newProd.images.length > 0) newProd.image_url = newProd.images[0];
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

  // ─ POSTS (shop owner) ─
  if (m === 'get' && path === '/dashboard/posts') {
    return { data: mockPosts.filter(p => p.shop_id === 'shop-1').map(p => ({ ...p })) };
  }

  if (m === 'post' && path === '/dashboard/posts') {
    const newPost = { id: genId('post'), shop_id: 'shop-1', ...body, created_at: new Date().toISOString() };
    mockPosts.unshift(newPost);
    return { data: newPost };
  }

  const postMatch = path.match(/^\/dashboard\/posts\/(.+)$/);
  if (postMatch) {
    const pid = postMatch[1];
    if (m === 'put') {
      const idx = mockPosts.findIndex(p => p.id === pid);
      if (idx === -1) return { error: 'Post not found', status: 404 };
      mockPosts[idx] = { ...mockPosts[idx], ...body };
      return { data: mockPosts[idx] };
    }
    if (m === 'delete') {
      mockPosts = mockPosts.filter(p => p.id !== pid);
      return { data: { ok: true } };
    }
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

  const shopLimitsMatch = path.match(/^\/admin\/shops\/(.+)\/limits$/);
  if (shopLimitsMatch && m === 'put') {
    const sid = shopLimitsMatch[1];
    const idx = mockShops.findIndex(s => s.id === sid);
    if (idx !== -1) {
      if (body.max_products !== undefined) mockShops[idx].max_products = parseInt(body.max_products);
      if (body.max_posts !== undefined) mockShops[idx].max_posts = parseInt(body.max_posts);
    }
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

  const shopPostsMatch = path.match(/^\/shop\/([^/]+)\/posts$/);
  if (shopPostsMatch && m === 'get') {
    const shop = mockShops.find(s => s.slug === shopPostsMatch[1]);
    if (!shop) return { error: 'Shop not found', status: 404 };
    return { data: mockPosts.filter(p => p.shop_id === shop.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) };
  }

  const shopContactMatch = path.match(/^\/shop\/([^/]+)\/contact$/);
  if (shopContactMatch && m === 'post') {
    return { data: { ok: true } };
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
