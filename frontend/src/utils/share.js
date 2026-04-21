import { toast } from 'sonner';

/**
 * Safely share a URL using the Web Share API.
 * Falls back to clipboard copy. Always swallows AbortError (user cancelled).
 *
 * @param {{ title?: string, text?: string, url: string }} payload
 * @param {{ successMessage?: string, errorMessage?: string }} [opts]
 */
export function safeShare(payload, opts = {}) {
  const successMessage = opts.successMessage || 'Đã copy link!';
  const errorMessage = opts.errorMessage || 'Không thể copy link';
  const url = payload?.url;
  if (!url) return;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share(payload).catch(() => {
      // User cancelled or share failed silently — do nothing.
    });
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(successMessage);
    }).catch(() => {
      toast.error(errorMessage);
    });
    return;
  }
  toast.error(errorMessage);
}
