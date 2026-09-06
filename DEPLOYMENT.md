# مستند راهنمای استقرار و دیپلوی سامانه عملیات جوادیان (Deployment Guide)

سامانه عملیات جوادیان یک برنامه وب پیش‌رونده (PWA) مبتنی بر React و Vite است که جهت ارائه و استفاده عملیاتی در بستر وب‌سرورهای مدرن آماده‌سازی شده است.

---

## ۱. چرا وب‌سرور Caddy بهترین گزینه برای دیپلوی است؟

وب‌سرور **Caddy** نسبت به Nginx دارای مزایای فوق‌العاده‌ای است:
1. **گواهی خودکار SSL/TLS (HTTPS)**: به‌محض اتصال دامنه به آی‌پی سرور، Caddy بدون نیاز به Certbot یا تنظیمات پیچیده کران‌جاب، گواهی معتبر از Let's Encrypt یا ZeroSSL دریافت و به‌صورت خودکار تمدید می‌کند.
2. **پشتیبانی بومی از HTTP/2 و HTTP/3 (QUIC)**: لود فوق‌العاده سریع فایل‌های فونت وزیرمتن و بسته‌های جاوااسکریپت.
3. **فشرده‌سازی مدرن Zstandard (zstd) و Gzip**: حجم انتقال داده به کاربران موبایل را به حداقل می‌رساند.
4. **سینتکس ساده و استاندارد SPA / PWA**: بدون خطاهای رایج ریدایرکت یا کش شدن Service Worker.

---

## ۲. روش اول: دیپلوی با Docker و Docker Compose (ساده‌ترین روش)

تمامی فایل‌های لازم (`Dockerfile`, `docker-compose.yml`, `Caddyfile`, `deploy.sh`) در ریشه پروژه پیکربندی شده‌اند.

### مراحل اجرا روی سرور لینوکس (Ubuntu / Debian):

۱. پروژه را روی سرور کلون کرده یا منتقل کنید:
```bash
git clone <URL_گیت_شما> javadian-app
cd javadian-app
```

۲. در صورت تمایل، اسکریپت خودکار دیپلوی را اجرا کنید:
```bash
chmod +x deploy.sh
./deploy.sh
```

یا مستقیماً با دستورات داکر اجرا کنید:
```bash
docker compose up -d --build
```

۳. **دسترسی با آی‌پی سرور (پیش از اتصال دامنه):**
به‌طور پیش‌فرض سرور روی پورت ۸۰ (HTTP) بالا می‌آید و با `http://SERVER_IP` مستقیماً در دسترس خواهد بود.

۴. **اتصال دامنه و فعال‌سازی خودکار HTTPS:**
زمانی که دامنه خود را خریداری و رکورد `A` آن را به IP سرور متصل کردید:
- فایل `.env` را باز کنید:
  ```bash
  nano .env
  ```
- مقدار `DOMAIN` را قرار دهید (مثال: `ops.javadian.ir`):
  ```env
  DOMAIN=ops.javadian.ir
  ```
- کانتینر را مجدداً بارگذاری کنید:
  ```bash
  docker compose up -d --force-recreate
  ```
Caddy بلافاصله گواهی SSL رایگان را صادر کرده و ترافیک HTTP را خودکار به HTTPS امن منتقل می‌کند.

---

## ۳. روش دوم: نصب مستقیم Caddy روی سیستم‌عامل سرور (بدون داکر)

اگر مایلید Caddy را مستقیماً روی سرور بدون کانتینر داکر اجرا کنید:

۱. **نصب Caddy در ابونتو/دبیان:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

۲. **بیلد پروژه و انتقال به مسیر وب:**
```bash
npm ci
npm run build
sudo mkdir -p /var/www/javadian
sudo cp -r dist/* /var/www/javadian/
```

۳. **تنظیم فایل Caddyfile:**
فایل `/etc/caddy/Caddyfile` را باز کرده و محتوای زیر را قرار دهید (آدرس دامنه خود را جایگزین کنید):

```caddyfile
ops.javadian.ir {
    root * /var/www/javadian
    encode zstd gzip

    # هدرهای امنیتی
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        Referrer-Policy strict-origin-when-cross-origin
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }

    # کنترل کش PWA (سرویس ورکر نباید کَش شود)
    @no_cache {
        path /service-worker*.js
        path /manifest*.json
        path /manifest*.webmanifest
        path /index.html
    }
    header @no_cache Cache-Control "no-cache, no-store, must-revalidate"

    # فایل‌های استاتیک ایمیوتیبل
    @assets {
        path /assets/*
        path /fonts/*
        path /icons/*
    }
    header @assets Cache-Control "public, max-age=31536000, immutable"

    # مسیریابی SPA
    try_files {path} /index.html
    file_server
}
```

۴. راه‌اندازی مجدد Caddy:
```bash
sudo systemctl reload caddy
```

---

## ۴. مرجع Nginx (اختیاری)

در صورت تمایل به استفاده سنتی از Nginx:
```nginx
server {
    listen 80;
    server_name ops.javadian.ir;
    root /var/www/javadian;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(service-worker[^/]*\.js|manifest[^/]*\.(json|webmanifest)|index\.html)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri =404;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }
}
```
