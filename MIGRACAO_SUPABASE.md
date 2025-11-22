# 🔄 Migração para Supabase - Resumo

## ✅ O que foi configurado

### 1. Schema do Banco de Dados
- ✅ Arquivo `supabase/schema.sql` criado com todas as tabelas
- ✅ Tabelas: users, plants, os, assignments, etc.
- ✅ Índices e triggers configurados

### 2. Código Atualizado
- ✅ `attachments/app/core/supabase_client.py` - Cliente Supabase
- ✅ `attachments/app/core/supabase_storage.py` - Funções de persistência
- ✅ `attachments/app/routes/users.py` - Atualizado para usar Supabase
- ✅ `requirements.txt` - Adicionado supabase e python-dotenv

### 3. Configuração
- ✅ `.env.example` - Template de configuração
- ✅ `.gitignore` - Atualizado para ignorar .env

## 📋 Próximos Passos

### 1. Criar Projeto Supabase
1. Acesse https://supabase.com
2. Crie um novo projeto
3. Anote a URL e a chave anon

### 2. Executar SQL
1. No Supabase, vá em SQL Editor
2. Copie o conteúdo de `supabase/schema.sql`
3. Execute no SQL Editor

### 3. Configurar .env
```bash
# Copie o exemplo
cp .env.example .env

# Edite e preencha:
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-key
```

### 4. Instalar Dependências
```bash
cd attachments
pip install -r ../requirements.txt
```

### 5. Testar
```bash
npm start
```

## ⚠️ Importante

- As rotas de `plants.py` e `os_api.py` ainda precisam ser atualizadas
- Os dados JSON locais serão ignorados após a migração
- Faça backup dos dados JSON antes de migrar

## 🔧 Rotas que Ainda Precisam Atualização

- [ ] `attachments/app/routes/plants.py` - Atualizar para Supabase
- [ ] `attachments/os_api.py` - Atualizar para Supabase
- [ ] Remover dependência de `app/core/sync.py` (não é mais necessário)

## 📝 Notas

O sistema agora usa Supabase como banco de dados principal. Os arquivos JSON em `attachments/data/` não são mais usados, mas podem ser mantidos como backup.

