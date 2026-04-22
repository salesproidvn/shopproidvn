import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { resolveImage } from '../utils/imageUrl';
import { Button } from '../components/ui/button';
import { ArrowLeft, ShoppingCart, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CategoryPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/shop/${slug}`),
        axios.get(`${API}/shop/${slug}/products`),
        axios.get(`${API}/shop/${slug}/categories`)
      ]);
      setShop(shopRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch {
      navigate(`/shop/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const themeColor = shop?.theme_color || '#0055FF';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="category-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)} data-testid="category-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {shop?.logo_url ? (
                <img src={resolveImage(shop.logo_url)} alt={shop.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                  <span className="text-white font-bold text-xs">{shop?.name?.[0]}</span>
                </div>
              )}
              <span className="font-bold text-sm text-[#0F172A]">{t.browseByCategory}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-6" data-testid="categories-title">{t.allCategoriesPage}</h1>

        <div className="space-y-8">
          {categories.filter(c => !c.parent_id).map(cat => {
            const subCatIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
            const catProducts = products.filter(p => p.category_id === cat.id || subCatIds.includes(p.category_id)).sort((a, b) => (a.position || 0) - (b.position || 0));
            const subs = categories.filter(c => c.parent_id === cat.id);
            if (catProducts.length === 0) return null;
            return (
              <div key={cat.id} data-testid={`catpage-section-${cat.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">{cat.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">{catProducts.length} {t.productsCount}</span>
                  </div>
                  <Link to={`/shop/${slug}/category/${cat.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" style={{ color: themeColor }}>
                      {t.viewCategory} <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                {cat.description && <p className="text-sm text-[#64748B] mb-2">{cat.description}</p>}
                {subs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {subs.map(sub => (
                      <Link key={sub.id} to={`/shop/${slug}/category/${cat.id}`}
                        className="text-xs px-2.5 py-1 rounded-full border border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8] transition-colors">
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-5">
                  {catProducts.slice(0, 5).map(product => (
                    <Link key={product.id} to={`/shop/${slug}?product=${product.id}`}
                      className="group bg-white border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all"
                      data-testid={`catpage-product-${product.id}`}>
                      <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                        <img src={resolveImage(product.image_url)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium text-[#0F172A] text-sm line-clamp-2 mb-1">{product.name}</h3>
                        {product.sku && <p className="text-[10px] text-[#94A3B8] mb-1">SKU: {product.sku}</p>}
                        <p className="text-base font-bold" style={{ color: themeColor }}>{formatVND(product.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                {catProducts.length > 5 && (
                  <div className="text-center mt-3">
                    <Link to={`/shop/${slug}/category/${cat.id}`}>
                      <Button variant="outline" size="sm" className="text-xs px-6 rounded-[5px]" style={{ borderColor: themeColor, color: themeColor }}>
                        {t.loadMore} ({catProducts.length - 5})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default CategoryPage;
