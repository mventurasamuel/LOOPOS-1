# /attachments/app/core/supabase_client.py
# Cliente Supabase para conexão com o banco de dados

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Carrega variáveis de ambiente
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "SUPABASE_URL e SUPABASE_KEY devem estar configurados no arquivo .env\n"
        "Crie um arquivo .env na raiz do projeto com:\n"
        "SUPABASE_URL=https://seu-projeto.supabase.co\n"
        "SUPABASE_KEY=sua-chave-anon-key"
    )

# Cria o cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase() -> Client:
    """Retorna o cliente Supabase"""
    return supabase

