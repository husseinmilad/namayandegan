@echo off
chcp 65001 >nul
echo ========================================================
echo   سامانه مدیریت و گزارش حضور نمایندگان هیئت امنا
echo ========================================================
if not exist node_modules (
  echo در حال نصب بسته های مورد نیاز برای بار اول...
  call npm install
)
if not exist dist (
  echo در حال ساخت نسخه اجرایی اپ...
  call npm run build
)
echo راه اندازی سرور لوکال روی آدرس http://localhost:4173 ...
start http://localhost:4173
call npm start
