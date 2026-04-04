import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[70vh] flex items-center" data-testid="hero-section">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/4a43ef8b-4a51-4219-845e-075d0c87222c/images/032b2a39b5b498b4fb69814c632e83c3c957b48e0659c8da1a2d291a4653a6a7.png"
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="max-w-2xl">
          <span className="badge-category mb-6 inline-block">New Collection 2024</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0F172A] tracking-tight mb-6 leading-tight">
            Khám phá <br />
            <span className="text-[#0055FF]">Phong cách</span> của bạn
          </h1>
          <p className="text-lg text-[#64748B] mb-8 max-w-lg">
            Sản phẩm chất lượng cao với giá cả hợp lý. Miễn phí vận chuyển 
            toàn quốc cho đơn hàng trên 500.000₫.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={scrollToProducts}
              className="bg-[#0055FF] hover:bg-[#0040CC] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              data-testid="shop-now-button"
            >
              Mua ngay
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 text-lg font-semibold border-2"
              data-testid="learn-more-button"
            >
              Tìm hiểu thêm
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
