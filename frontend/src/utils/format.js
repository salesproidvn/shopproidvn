/**
 * Optimize image URL by reducing resolution + quality for faster load.
 * Supports Unsplash CDN params (w, q, auto).
 * @param {string} url - Image URL
 * @param {number} width - Target width in px (default 400)
 * @returns {string} Optimized URL
 */
export const optimizeImageUrl = (url, width = 400) => {
  if (!url) return url;
  if (url.includes('images.unsplash.com')) {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', '70');
    u.searchParams.set('auto', 'format');
    return u.toString();
  }
  return url;
};

/**
 * Format price in Vietnamese Dong (VND)
 * @param {number} price - Price in VND
 * @returns {string} Formatted price string
 */
export const formatVND = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(price) + ' ₫';
};

/**
 * Format API error detail for display
 * @param {any} detail - Error detail from API response
 * @returns {string} Formatted error message
 */
export const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};
