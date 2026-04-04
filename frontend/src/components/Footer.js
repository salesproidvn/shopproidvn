import { Phone, MessageSquare, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] text-white py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#0055FF] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold">The Wi Shop</span>
            </div>
            <p className="text-[#94A3B8] mb-6 max-w-sm">
              Cửa hàng trực tuyến với các sản phẩm chất lượng cao, giá cả hợp lý. 
              Miễn phí vận chuyển toàn quốc cho đơn hàng trên 500.000₫.
            </p>
            <div className="flex gap-4">
              <a
                href="tel:+84123456789"
                className="w-12 h-12 bg-[#1E293B] rounded-full flex items-center justify-center hover:bg-[#0055FF] transition-colors"
                data-testid="footer-phone"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@thewishop.com"
                className="w-12 h-12 bg-[#1E293B] rounded-full flex items-center justify-center hover:bg-[#0055FF] transition-colors"
                data-testid="footer-email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-[#1E293B] rounded-full flex items-center justify-center hover:bg-[#0055FF] transition-colors"
                data-testid="footer-message"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-3 text-[#94A3B8]">
              <li><a href="#" className="hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sản phẩm</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-[#94A3B8]">
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>+84 123 456 789</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>contact@thewishop.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1E293B] mt-12 pt-8 text-center text-[#64748B]">
          <p>&copy; 2024 The Wi Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
