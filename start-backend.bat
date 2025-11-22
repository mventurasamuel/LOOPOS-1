@echo off
echo ========================================
echo Iniciando servidor FastAPI (Backend)
echo ========================================
echo.

REM Navega para o diretorio do script e depois para attachments
cd /d "%~dp0attachments"
if not exist "app\main.py" (
    echo ERRO: Nao foi possivel encontrar app\main.py
    echo Certifique-se de que este script esta na raiz do projeto
    pause
    exit /b 1
)

echo Diretorio atual: %CD%
echo.

echo Verificando se uvicorn esta instalado...
python -m pip show uvicorn >nul 2>&1
if errorlevel 1 (
    echo uvicorn nao encontrado. Instalando...
    python -m pip install uvicorn fastapi
) else (
    echo uvicorn encontrado!
)
echo.

echo Iniciando servidor na porta 8000...
echo Pressione Ctrl+C para parar o servidor
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --timeout-keep-alive 10 --log-level debug --reload

pause

