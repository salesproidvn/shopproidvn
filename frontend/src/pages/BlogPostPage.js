import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, ShoppingCart } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BlogPostPage = () => {
  const { slug, postId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [shopRes, postsRes, productsRes] = await Promise.all([
          axios.get(`${API}/shop/${slug}`),
          axios.get(`${API}/shop/${slug}/posts`),
          axios.get(`${API}/shop/${slug}/products`)
        ]);
        setShop(shopRes.data);
        setPosts(postsRes.data);
        setProducts(productsRes.data);
        if (postId) {
          const found = postsRes.data.find(p => p.id === postId);
          if (found) setSelectedPost(found);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, postId]);

  const themeColor = shop?.theme_color || '#0055FF';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const getAttachedProducts = (post) => {
    if (!post?.attached_products?.length) return [];
    return post.attached_products.map(pid => products.find(p => p.id === pid)).filter(Boolean);
  };

  // Single post detail view
  if (selectedPost) {
    const attachedProds = getAttachedProducts(selectedPost);
    return (
      <div className="min-h-screen bg-white" data-testid="blog-post-detail">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Button variant="ghost" size="sm" className="gap-2 rounded-[5px]" onClick={() => navigate(`/shop/${slug}/posts`)} data-testid="post-back-btn">
                <ArrowLeft className="w-4 h-4" /> {t.posts}
              </Button>
              <Link to={`/shop/${slug}`}>
                <span className="font-semibold text-[#0F172A]">{shop?.name}</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedPost.thumbnail && (
            <img src={selectedPost.thumbnail} alt={selectedPost.title} className="w-full h-64 sm:h-96 object-cover mb-6 rounded-[5px]" data-testid="post-detail-thumbnail" />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3" data-testid="post-detail-title">{selectedPost.title}</h1>
          <p className="text-sm text-[#94A3B8] mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(selectedPost.created_at).toLocaleDateString('vi-VN')}
          </p>
          {selectedPost.images?.length > 0 && (
            <div className="flex gap-3 mb-6 overflow-x-auto">
              {selectedPost.images.map((img, idx) => (
                <img key={idx} src={img} alt="" className="h-40 rounded-[5px] object-cover flex-shrink-0" />
              ))}
            </div>
          )}
          <div className="prose max-w-none text-[#334155] leading-relaxed mb-8" data-testid="post-detail-content" dangerouslySetInnerHTML={{ __html: selectedPost.description }} />
          {attachedProds.length > 0 && (
            <div className="border-t pt-8" data-testid="post-attached-products">
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">{t.relatedProducts}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachedProds.map(prod => (
                  <Link key={prod.id} to={`/shop/${slug}?product=${prod.id}`} className="group border border-[#E2E8F0] rounded-[5px] overflow-hidden hover:shadow-lg transition-all" data-testid={`attached-product-${prod.id}`}>
                    <div className="aspect-square bg-[#F8FAFC] overflow-hidden">
                      <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3 text-center">
                      <h4 className="font-medium text-sm text-[#0F172A] line-clamp-2">{prod.name}</h4>
                      <p className="font-bold text-sm mt-1" style={{ color: themeColor }}>{formatVND(prod.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Post listing view
  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="blog-posts-page">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button variant="ghost" size="sm" className="gap-2 rounded-[5px]" onClick={() => navigate(`/shop/${slug}`)} data-testid="posts-back-btn">
              <ArrowLeft className="w-4 h-4" /> {shop?.name}
            </Button>
            <span className="font-bold text-[#0F172A]">{t.posts}</span>
            <div className="w-20" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#64748B]">{t.noPostsYet}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="posts-grid">
            {posts.map(post => (
              <Link key={post.id} to={`/shop/${slug}/posts/${post.id}`} className="bg-white rounded-[5px] overflow-hidden hover:shadow-lg transition-all group" data-testid={`post-card-${post.id}`}>
                {post.thumbnail && (
                  <div className="aspect-video overflow-hidden">
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-[#94A3B8] mb-2">{new Date(post.created_at).toLocaleDateString('vi-VN')}</p>
                  <h3 className="font-bold text-[#0F172A] mb-2 line-clamp-2 group-hover:text-[#0055FF] transition-colors">{post.title}</h3>
                  <div className="text-sm text-[#64748B] line-clamp-3" dangerouslySetInnerHTML={{ __html: post.description.replace(/<[^>]+>/g, '') }} />
                  {post.attached_products?.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-[#94A3B8]">
                      <ShoppingCart className="w-3 h-3" />
                      {post.attached_products.length} {t.products.toLowerCase()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPostPage;
