# 🚀 Como Iniciar o Servidor Backend

O erro `ERR_CONNECTION_REFUSED` indica que o servidor FastAPI não está rodando. Siga os passos abaixo:

## 📋 Pré-requisitos

1. **Python 3.8+** instalado
2. **pip** (gerenciador de pacotes Python)

## 🔧 Instalação das Dependências

Abra um terminal/PowerShell e execute:

```bash
# Navegue até o diretório attachments
cd attachments

# Instale as dependências
pip install fastapi uvicorn pydantic
```

Ou use o arquivo requirements.txt:

```bash
pip install -r ../requirements.txt
```

## ▶️ Iniciar o Servidor

### Opção 1: Usando o script (Windows)
```bash
# Na raiz do projeto
start-backend.bat
```

### Opção 2: Comando manual
```bash
# Navegue até o diretório attachments
cd attachments

# Inicie o servidor
uvicorn app.main:app --host 127.0.0.1 --port 8000 --timeout-keep-alive 10 --log-level debug --reload
```

### Opção 3: Usando Python diretamente
```bash
cd attachments
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --timeout-keep-alive 10 --log-level debug --reload
```

## ✅ Verificar se está funcionando

Após iniciar, você deve ver algo como:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Teste acessando no navegador: http://127.0.0.1:8000/api/health

Deve retornar: `{"ok": true}`

## 🔄 Iniciar Frontend e Backend

Você precisa de **2 terminais**:

**Terminal 1 - Backend:**
```bash
cd attachments
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## ⚠️ Problemas Comuns

### Python não encontrado
- Instale Python do site oficial: https://www.python.org/downloads/
- Marque a opção "Add Python to PATH" durante a instalação

### Porta 8000 já em uso
- Feche outros programas usando a porta 8000
- Ou use outra porta: `--port 8001`

### Erro de módulo não encontrado
- Certifique-se de estar no diretório `attachments`
- Instale as dependências: `pip install fastapi uvicorn pydantic`

## 📝 Notas

- O servidor roda em `http://127.0.0.1:8000`
- O frontend espera o backend nessa URL
- Use `--reload` para recarregar automaticamente ao salvar arquivos
- Pressione `Ctrl+C` para parar o servidor

