#!/usr/bin/env python
"""
Script para iniciar o servidor FastAPI
Usado pelo npm run dev:backend
"""
import sys
import subprocess
import os
from pathlib import Path

# Garante que estamos no diretório correto
script_dir = Path(__file__).parent
os.chdir(script_dir)

# Comando uvicorn
cmd = [
    sys.executable, "-m", "uvicorn",
    "app.main:app",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--timeout-keep-alive", "10",
    "--log-level", "debug",
    "--reload"
]

try:
    subprocess.run(cmd, check=True)
except KeyboardInterrupt:
    print("\n🛑 Servidor interrompido pelo usuário")
    sys.exit(0)
except Exception as e:
    print(f"❌ Erro ao iniciar servidor: {e}")
    sys.exit(1)

