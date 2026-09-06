#!/usr/bin/env bash
set -e

# ========================================================
# اسکریپت راه‌اندازی و دیپلوی خودکار سامانه عملیات جوادیان
# Javadian Operations System - Automated Deployment Script
# ========================================================

echo "🚀 [۱/۴] در حال بررسی پیش‌نیازها..."

if ! command -v docker &> /dev/null; then
    echo "⚠️ داکر یافت نشد. در حال نصب Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

echo "📦 [۲/۴] تنظیم متغیرهای محیطی..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "فایل .env از روی .env.example ایجاد شد."
fi

echo "🔨 [۳/۴] ساخت و بیلد ایمیج داکر با Caddy..."
docker compose build

echo "🟢 [۴/۴] اجرای کانتینر در پس‌زمینه..."
docker compose up -d

echo "=========================================================="
echo "✅ سامانه عملیات جوادیان با وب‌سرور Caddy با موفقیت راه‌اندازی شد!"
echo "🌐 وضعیت کانتینر:"
docker compose ps
echo "=========================================================="
echo "نکته: جهت اتصال دامنه، مقدار DOMAIN را در فایل .env تغییر داده و دستور زیر را اجرا کنید:"
echo "docker compose up -d --force-recreate"
