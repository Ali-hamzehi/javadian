/**
 * سامانه عملیات جوادیان — Service Worker (نسخه شل آفلاین سازمانی)
 * Version: 1.1.0
 * 
 * محدود به کش کردن شل برنامه، فونت‌های محلی و دارایی‌های بصری
 * بدون هیچ‌گونه همگام‌سازی پس‌زمینه (Background Sync) برای تراکنش‌های مالی، انبار و سفارشات
 */

const CACHE_NAME = 'javadian-operations-shell-v1.1.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/fonts/vazirmatn-arabic.woff2',
  '/fonts/vazirmatn-latin.woff2',
];

// نصب سرویس ورکر و کش کردن شل برنامه
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache partial error:', err);
      });
    })
  );
  // توجه: جهت رعایت بروزرسانی ایمن و کنترل کاربر، skipWaiting به صورت خودکار فراخوانی نمی‌شود.
});

// فعال‌سازی و پاکسازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((existingCache) => {
          if (existingCache !== CACHE_NAME) {
            console.info('[ServiceWorker] Cleaning old cache:', existingCache);
            return caches.delete(existingCache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// کنترل رویداد پیام (جهت اعمال بروزرسانی پس از تأیید کاربر)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// بررسی اینکه آیا درخواست در لیست مجاز کش است یا خیر
function isAllowlistedStaticAsset(url, request) {
  const pathname = url.pathname;

  // ۱. دارایی‌های صریح شل و آیکون‌ها
  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/offline.html' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon-32x32.png' ||
    pathname === '/icon.svg' ||
    pathname === '/apple-touch-icon.png' ||
    pathname.startsWith('/pwa-')
  ) {
    return true;
  }

  // ۲. دایرکتوری‌های ایستا مجاز (/icons/*, /fonts/*, /assets/*)
  if (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/assets/')
  ) {
    const destination = request.destination;
    if (
      destination === 'script' ||
      destination === 'style' ||
      destination === 'font' ||
      destination === 'image' ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico')
    ) {
      return true;
    }
  }

  return false;
}

// بررسی مواردی که هرگز نباید در Cache Storage ذخیره شوند
function isForbiddenFromCache(url, request) {
  const pathname = url.pathname.toLowerCase();

  // عدم ذخیره هرگونه API، احراز هویت، مدارک مالی، کاربری، انبار و سفارشات
  if (
    pathname.startsWith('/api') ||
    pathname.includes('auth') ||
    pathname.includes('token') ||
    pathname.includes('finance') ||
    pathname.includes('personnel') ||
    pathname.includes('customer') ||
    pathname.includes('supplier') ||
    pathname.includes('attachment') ||
    pathname.includes('payment') ||
    pathname.includes('warehouse') ||
    pathname.includes('order') ||
    pathname.includes('workitem') ||
    pathname.includes('approval') ||
    url.search.length > 1 // پارامترهای کوئری یا شناسه رکوردها
  ) {
    return true;
  }

  // عدم ذخیره درخواست‌های دارای هدر احراز هویت
  if (request.headers.has('Authorization')) {
    return true;
  }

  return false;
}

// استراتژی پاسخ‌دهی به درخواست‌ها (فقط متد GET)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // ۱. درخواست‌های غیر GET هرگز پردازش یا کش نمی‌شوند
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // ۲. فقط درخواست‌های هم‌مبدا
  if (url.origin !== self.location.origin) {
    return;
  }

  // ۳. ناوبری ایمن (Safe Navigation Caching)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // هرگز پاسخ‌های ناوبری شخصی‌سازی‌شده یا دارای کوئری در کش ذخیره نمی‌شوند
          return networkResponse;
        })
        .catch(async () => {
          // در صورت قطعی شبکه: ابتدا شل از پیش کش‌شده، سپس صفحه آفلاین خنثی
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) {
            return cachedShell;
          }
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
          return Response.error();
        })
    );
    return;
  }

  // ۴. بررسی فهرست مجاز کش و ممنوعیت‌های صریح
  if (!isAllowlistedStaticAsset(url, request) || isForbiddenFromCache(url, request)) {
    // برای درخواست‌های غیرمجاز respondWith فراخوانی نمی‌شود تا شبکه طبق معمول پاسخ دهد
    return;
  }

  // ۵. پاسخ‌دهی به دارایی‌های ایستای مجاز (Cache First with revalidation)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        const cacheControl = networkResponse.headers.get('Cache-Control');
        if (cacheControl && cacheControl.includes('no-store')) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return networkResponse;
      });
    })
  );
});
