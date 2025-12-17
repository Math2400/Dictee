@echo off
title Synchronisation vers GitHub (ENVOYER)
echo.
echo --- Envoi de vos modifications vers GitHub ---
echo.
set /p msg="Qu'avez-vous modifie ? (ex: correction du bug) : "
if "%msg%"=="" set msg="Mise a jour automatique"

git add .
git commit -m "%msg%"
git push origin master

echo.
echo Termine ! Vos modifications sont en ligne.
pause
