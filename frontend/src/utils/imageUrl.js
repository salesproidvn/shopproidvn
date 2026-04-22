const BACKEND = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');

export const resolveImage = (url) => {
  if (!url) return '/product-fallback.png';
  const value = String(url).trim();
  if (!value) return '/product-fallback.png';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;

  // For backend-generated relative paths, always prefer absolute URL in production.
  if (value.startsWith('/')) return BACKEND ? `${BACKEND}${value}` : value;
  if (/^(api|uploads)\//i.test(value)) return BACKEND ? `${BACKEND}/${value}` : `/${value}`;

  return value;
};
