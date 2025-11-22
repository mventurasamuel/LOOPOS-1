#!/bin/bash

echo "========================================"
echo "Iniciando servidor FastAPI (Backend)"
echo "========================================"
echo ""

cd attachments
echo "Diretorio atual: $(pwd)"
echo ""

echo "Verificando se uvicorn esta instalado..."
if ! python3 -m pip show uvicorn &> /dev/null; then
    echo "uvicorn nao encontrado. Instalando..."
    python3 -m pip install uvicorn fastapi
else
    echo "uvicorn encontrado!"
fi
echo ""

echo "Iniciando servidor na porta 8000..."
echo "Pressione Ctrl+C para parar o servidor"
echo ""

python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --timeout-keep-alive 10 --log-level debug --reload

