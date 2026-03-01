@echo off
setlocal

start "CMS Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "CMS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend and frontend dev servers started in separate windows.
