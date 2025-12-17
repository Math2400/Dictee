@echo off
title Installateur Dictee Intelligente
echo Lancement de l'installateur graphique...
powershell -ExecutionPolicy Bypass -File "./INSTALL_EN_UN_CLIC.ps1"
echo.
echo Appuyez sur une touche pour fermer.
pause > nul
