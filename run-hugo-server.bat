@echo off
set "PATH=C:\Program Files\Go\bin;C:\Users\Ryu08\AppData\Local\Microsoft\WinGet\Packages\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe;C:\Users\Ryu08\tools\node-v24.19.0-win-x64;%~dp0node_modules\.bin;%PATH%"
cd /d "%~dp0"
hugo server --disableFastRender --bind 127.0.0.1 --port 1315
