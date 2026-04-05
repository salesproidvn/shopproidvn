import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (category = null, search = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category && category !== 'All Categories') params.append('category', category);
      if (search) params.append('search', search);
      const url = `${API}/products${params.toString() ? '?' + params.toString() : ''}`;
      const { data } = await axios.get(url);
      setProducts(data);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API}/categories`);
      setCategories(data);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    fetchProducts(value, searchQuery);
  };

  const handleSearch = (query) => {
    fetchProducts(selectedCategory, query);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="home-page">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} />

      <main className="flex-1">
        <section id="products" className="py-8" data-testid="products-section">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">{t.featuredProducts}</h2>
                <p className="text-[#64748B] mt-1">{t.exploreProducts}</p>
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-[220px] rounded-full border-[#E2E8F0] bg-[#F8FAFC]" data-testid="category-filter">
                  <SelectValue placeholder={t.allCategories} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} data-testid={`category-${category}`}>
                      {category === 'All Categories' ? t.allCategories : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-[#0055FF]" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-[#64748B] text-lg">{t.noProducts}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6" data-testid="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
