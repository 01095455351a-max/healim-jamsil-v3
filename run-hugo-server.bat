@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "PATH=C:\Program Files\Go\bin;C:\Users\Ryu08\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe;C:\Users\Ryu08\tools\node-v24.19.0-win-x64;%~dp0node_modules\.bin;%PATH%"

where hugo >nul 2>&1
if errorlevel 1 (
  echo.
  echo [오류] hugo 를 찾을 수 없습니다.
  echo        설치 확인: winget list Hugo.Hugo.Extended
  echo        설치     : winget install Hugo.Hugo.Extended
  echo.
  pause
  exit /b 1
)

echo === Hugo 버전 ===
hugo version
echo.

echo === 현재 브랜치 ===
git rev-parse --abbrev-ref HEAD 2>nul || echo (git 정보를 읽지 못했습니다)
echo.

echo === 서버 시작 : http://127.0.0.1:1315 ===
echo     종료하려면 Ctrl+C
echo.
hugo server --disableFastRender --bind 127.0.0.1 --port 1315

echo.
echo ================================================================
echo  서버가 종료되었습니다. 위에 표시된 메시지를 확인해 주세요.
echo  - "module ... not found"  : 브랜치가 오래된 상태입니다.
echo                              git pull 후 다시 실행하세요.
echo  - "address already in use": 1315 포트를 다른 창이 쓰고 있습니다.
echo ================================================================
pause
