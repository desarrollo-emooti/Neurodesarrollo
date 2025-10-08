@echo off
echo ====================================
echo   EMOOTI - Iniciando entorno local
echo ====================================
echo.

REM Matar procesos en los puertos si existen
echo [1/3] Liberando puertos 3000 y 5173...
call npx kill-port 3000 5173 2>nul

echo.
echo [2/3] Iniciando backend en puerto 3000...
start "EMOOTI Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [3/3] Iniciando frontend en puerto 5173...
start "EMOOTI Frontend" cmd /k "npm run dev"

echo.
echo ====================================
echo   Entorno iniciado correctamente!
echo ====================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Credenciales:
echo   Email: admin@emooti.com
echo   Pass:  admin123
echo.
echo Presiona cualquier tecla para salir...
pause >nul
