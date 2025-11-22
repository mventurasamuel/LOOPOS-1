#!/bin/bash

echo "========================================"
echo "Iniciando Backend e Frontend"
echo "========================================"
echo ""

# Verifica se estamos no diretorio correto
if [ ! -f "package.json" ]; then
    echo "ERRO: package.json não encontrado"
    echo "Certifique-se de que este script está na raiz do projeto"
    exit 1
fi

# Instala dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
    echo ""
fi

# Verifica se concurrently está instalado
if ! npm list concurrently &> /dev/null; then
    echo "Instalando concurrently..."
    npm install --save-dev concurrently
    echo ""
fi

# Verifica se uvicorn está instalado
if ! python3 -m pip show uvicorn &> /dev/null; then
    echo "AVISO: uvicorn não encontrado!"
    echo "Instalando dependências do backend..."
    cd attachments
    python3 -m pip install fastapi uvicorn pydantic
    cd ..
    echo ""
fi

echo ""
echo "========================================"
echo "Iniciando servidores..."
echo "========================================"
echo "Backend: http://127.0.0.1:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar ambos os servidores"
echo "========================================"
echo ""

# Inicia ambos os servidores
npm run dev:all

