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
