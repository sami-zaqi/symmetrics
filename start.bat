@echo off
echo Menyalakan Symmetrics...
echo.

start "Symmetrics Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

start "Symmetrics Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul

start http://localhost:3000

echo.
echo ==============================================
echo  Symmetrics sedang berjalan!
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:8000/docs
echo ==============================================
echo.
echo JANGAN tutup 2 jendela hitam lain yang baru terbuka
echo (itu server backend ^& frontend). Menutupnya = mematikan aplikasi.
echo.
echo Jendela ini boleh ditutup kapan saja.
pause
