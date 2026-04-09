/**
 * Push Notification utility for Ocean Pro Web PWA
 */

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getVapidPublicKey() {
  // Try env first, fallback to API
  const envKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
  if (envKey) return envKey;
  try {
    const res = await fetch(`${API}/push/vapid-key`);
    const data = await res.json();
    return data.public_key;
  } catch {
    return null;
  }
}

export async function subscribeToPush(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) throw new Error('VAPID key not available');

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  // Send subscription to backend
  const res = await fetch(`${API}/dashboard/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!res.ok) throw new Error('Failed to save subscription');
  return subscription;
}

export async function unsubscribeFromPush(token) {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch(`${API}/dashboard/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });
  }
}

export async function getNotificationStatus(token) {
  try {
    const res = await fetch(`${API}/dashboard/notifications/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return { enabled: false, subscribed_devices: 0 };
    return await res.json();
  } catch {
    return { enabled: false, subscribed_devices: 0 };
  }
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isInstallable() {
  return window.matchMedia('(display-mode: standalone)').matches === false;
}
