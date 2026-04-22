const BACKEND = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');

export const resolveImage = (url) => {
  if (!url) return '/product-fallback.png';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/api/')) return BACKEND ? `${BACKEND}${url}` : url;
  return url;
};
