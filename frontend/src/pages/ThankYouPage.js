import { Link, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { formatVND } from '../utils/format';
import { Button } from '../components/ui/button';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';

const ThankYouPage = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4" data-testid="thank-you-page">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2" data-testid="thank-you-title">{t.thankYou}</h1>
          <p className="text-[#64748B] text-lg mb-6">{t.orderConfirmedDesc}</p>

          {order && (
            <div className="bg-[#F8FAFC] rounded-2xl p-6 mb-6 text-left">
              <p className="text-xs text-[#64748B] mb-1">{t.yourOrderId}</p>
              <p className="font-mono font-bold text-[#0F172A] text-lg mb-4" data-testid="order-id">{order.id}</p>
              
              <div className="space-y-3 border-t border-[#E2E8F0] pt-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-[#64748B]">{item.name} x{item.quantity}</span>
                    <span className="font-medium text-[#0F172A]">{formatVND(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between pt-4 mt-4 border-t border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A]">{t.total}</span>
                <span className="font-bold text-[#0055FF] text-lg">{formatVND(order.total_amount)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link to={slug ? `/shop/${slug}` : '/'}>
              <Button className="w-full bg-[#0055FF] hover:bg-[#0040CC] rounded-full py-6" data-testid="continue-shopping-btn">
                <ShoppingBag className="w-5 h-5 mr-2" /> {t.continueShopping}
              </Button>
            </Link>
            <Link to={slug ? `/shop/${slug}` : '/'}>
              <Button variant="ghost" className="w-full text-[#64748B]" data-testid="back-to-shop-btn">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToHome}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
