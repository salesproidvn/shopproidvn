import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SlidersHorizontal, X } from 'lucide-react';

const PRICE_BRACKETS = [
  { id: 'all', min: 0, max: Infinity },
  { id: 'under500k', min: 0, max: 500000 },
  { id: '500k-1m', min: 500000, max: 1000000 },
  { id: '1m-5m', min: 1000000, max: 5000000 },
  { id: 'over5m', min: 5000000, max: Infinity },
];

const PriceFilter = ({ onFilter, activeFilter }) => {
  const { t } = useLanguage();
  const [showCustom, setShowCustom] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const bracketLabels = {
    all: t.allPrices,
    under500k: t.under500k,
    '500k-1m': t.from500kTo1m,
    '1m-5m': t.from1mTo5m,
    over5m: t.over5m,
  };

  const handleBracket = (bracket) => {
    setShowCustom(false);
    setMinPrice('');
    setMaxPrice('');
    onFilter({ id: bracket.id, min: bracket.min, max: bracket.max });
  };

  const handleCustomApply = () => {
    const min = parseInt(minPrice) || 0;
    const max = parseInt(maxPrice) || Infinity;
    onFilter({ id: 'custom', min, max });
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    setShowCustom(false);
    onFilter({ id: 'all', min: 0, max: Infinity });
  };

  return (
    <div className="space-y-3" data-testid="price-filter">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="w-4 h-4 text-[#64748B]" />
        <span className="text-sm font-medium text-[#0F172A]">{t.priceFilter}</span>
      </div>
      
      {/* Preset brackets */}
      <div className="flex flex-wrap gap-2">
        {PRICE_BRACKETS.map((bracket) => (
          <button
            key={bracket.id}
            onClick={() => handleBracket(bracket)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter?.id === bracket.id
                ? 'bg-[#0055FF] text-white'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
            data-testid={`price-bracket-${bracket.id}`}
          >
            {bracketLabels[bracket.id]}
          </button>
        ))}
      </div>

      {/* Custom range toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className="text-xs text-[#0055FF] font-medium hover:underline"
        data-testid="custom-range-toggle"
      >
        {t.priceRange} ▾
      </button>

      {/* Custom range inputs */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t.minPrice}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="text-xs h-8 w-24"
            data-testid="min-price-input"
          />
          <span className="text-[#64748B] text-xs">—</span>
          <Input
            type="number"
            placeholder={t.maxPrice}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="text-xs h-8 w-24"
            data-testid="max-price-input"
          />
          <Button size="sm" className="h-8 bg-[#0055FF] hover:bg-[#0040CC] text-xs px-3" onClick={handleCustomApply} data-testid="apply-price-filter">
            {t.applyFilter}
          </Button>
        </div>
      )}

      {/* Clear filter */}
      {activeFilter && activeFilter.id !== 'all' && (
        <button onClick={handleClear} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600" data-testid="clear-price-filter">
          <X className="w-3 h-3" /> {t.clearFilter}
        </button>
      )}
    </div>
  );
};

export default PriceFilter;
