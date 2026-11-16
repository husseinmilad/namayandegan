#!/usr/bin/env bash
set -e
echo "========================================================"
echo "  سامانه مدیریت و گزارش حضور نمایندگان هیئت امنا"
echo "========================================================"
if [ ! -d "node_modules" ]; then
  echo "در حال نصب بسته‌های مورد نیاز..."
  npm install
fi
if [ ! -d "dist" ]; then
  echo "در حال ساخت نسخه اجرایی..."
  npm run build
fi
echo "اجرای لوکال در آدرس http://localhost:4173"
npm start
