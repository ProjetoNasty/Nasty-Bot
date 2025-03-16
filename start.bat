@echo off
title Reiniciar programa automaticamente
:loop
echo Iniciando o programa...
node index.js
echo O programa foi encerrado. Reiniciando em 5 segundos...
timeout /t 5 /nobreak >nul
cls
goto loop
