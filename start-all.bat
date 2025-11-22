@echo off
echo ========================================
echo Iniciando Backend e Frontend
echo ========================================
echo.

REM Verifica se estamos no diretorio correto
if not exist "package.json" (
    echo ERRO: package.json nao encontrado
    echo Certifique-se de que este script esta na raiz do projeto
    pause
    exit /b 1
)

REM Verifica se node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    call npm install
    echo.
)

REM Verifica se concurrently esta instalado
call npm list concurrently >nul 2>&1
if errorlevel 1 (
    echo Instalando concurrently...
    call npm install --save-dev concurrently
    echo.
)

REM Verifica se Python/uvicorn esta disponivel
python -m pip show uvicorn >nul 2>&1
if errorlevel 1 (
    echo.
    echo AVISO: uvicorn nao encontrado!
    echo Instalando dependencias do backend...
    cd attachments
    python -m pip install fastapi uvicorn pydantic
    cd ..
    echo.
)

echo.
echo ========================================
echo Iniciando servidores...
echo ========================================
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar ambos os servidores
echo ========================================
echo.

REM Inicia ambos os servidores usando npm
call npm run dev:all

pause

