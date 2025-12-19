@echo off
title Lancer la Dictee Intelligente
echo ==========================================
echo    LANCEMENT DE LA DICTEE INTELLIGENTE
echo ==========================================
echo.

if not exist "node_modules\" (
    echo [ATTENTION] Les dependances ne sont pas installees.
    echo Installation en cours...
    call npm install
)

echo Lancement de l'application...
start http://localhost:5173
npm run dev
pause
