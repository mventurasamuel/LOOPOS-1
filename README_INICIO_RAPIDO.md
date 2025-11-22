# 🚀 Início Rápido - LoopOS

## 📊 Banco de Dados

O sistema **NÃO usa um banco de dados tradicional**. Ele usa **arquivos JSON** para persistência:

- `attachments/data/users.json` - Usuários
- `attachments/data/plants.json` - Usinas
- `attachments/data/os.json` - Ordens de Serviço
- `attachments/data/assignments.json` - Atribuições (relacionamentos)

Isso significa que:
- ✅ Não precisa instalar MySQL, PostgreSQL, etc.
- ✅ Os dados são salvos automaticamente em arquivos JSON
- ✅ Fácil backup (basta copiar a pasta `data`)
- ✅ Fácil migração

## 🎯 Iniciar Tudo de Uma Vez

### Opção 1: Script Batch (Windows) - RECOMENDADO
```bash
start-all.bat
```

### Opção 2: NPM Script
```bash
npm start
# ou
npm run dev:all
```

### Opção 3: Comandos Separados

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

## 📦 Instalação Inicial

Se for a primeira vez, execute:

```bash
# 1. Instalar dependências do frontend
npm install

# 2. Instalar dependências do backend
cd attachments
pip install fastapi uvicorn pydantic
cd ..
```

## ✅ Verificar se Está Funcionando

Após iniciar, você deve ver:

**Backend:**
- Terminal mostra: `INFO: Uvicorn running on http://127.0.0.1:8000`
- Teste: http://127.0.0.1:8000/api/health → `{"ok": true}`

**Frontend:**
- Terminal mostra: `Local: http://localhost:3000/`
- Abra no navegador: http://localhost:3000

## 📝 Comandos Disponíveis

```bash
# Iniciar tudo (backend + frontend)
npm start
npm run dev:all

# Apenas frontend
npm run dev:frontend
npm run dev

# Apenas backend
npm run dev:backend

# Build para produção
npm run build
```

## 🔧 Scripts Criados

- `start-all.bat` - Inicia backend e frontend (Windows)
- `start-all.sh` - Inicia backend e frontend (Linux/Mac)
- `start-backend.bat` - Apenas backend (Windows)

## ⚠️ Problemas Comuns

### Python não encontrado
- Instale Python: https://www.python.org/downloads/
- Marque "Add Python to PATH"

### Porta 8000 ou 3000 já em uso
- Feche outros programas usando essas portas
- Ou altere as portas nos scripts

### concurrently não encontrado
- Execute: `npm install --save-dev concurrently`

## 📂 Estrutura de Dados

Os dados são salvos em `attachments/data/`:
```
attachments/
  data/
    users.json       ← Usuários do sistema
    plants.json      ← Usinas cadastradas
    os.json          ← Ordens de Serviço
    assignments.json ← Relacionamentos (quem trabalha em qual usina)
```

**Importante:** Faça backup regular da pasta `data`!

