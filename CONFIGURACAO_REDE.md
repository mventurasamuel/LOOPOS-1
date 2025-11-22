# 🌐 Configuração de Rede - LoopOS

## ✅ Resumo Rápido

**SIM, funciona apenas na mesma máquina (localhost) por padrão.**

- ✅ **Não precisa de banco de dados externo** (usa arquivos JSON locais)
- ✅ **Não precisa de servidor remoto** (tudo roda na sua máquina)
- ✅ **Não precisa de internet** (após instalar dependências)
- ✅ **Funciona offline** (todos os dados são locais)

## 🏠 Modo Local (Padrão)

Por padrão, o sistema funciona apenas na **mesma máquina**:

- **Backend:** `http://127.0.0.1:8000` (localhost)
- **Frontend:** `http://localhost:3000` (localhost)

Isso significa que:
- ✅ Apenas você pode acessar
- ✅ Não acessível de outros dispositivos
- ✅ Mais seguro para desenvolvimento

## 🌍 Acessar de Outros Dispositivos na Mesma Rede

Se quiser acessar de outros computadores/celulares na **mesma rede Wi-Fi**:

### 1. Descobrir seu IP local

**Windows:**
```bash
ipconfig
# Procure por "IPv4 Address" (ex: 192.168.1.100)
```

**Linux/Mac:**
```bash
ifconfig
# ou
ip addr show
```

### 2. Atualizar CORS no Backend

Edite `attachments/app/main.py`:

```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.100:3000",  # ← SEU IP LOCAL AQUI
    "http://0.0.0.0:3000",  # ← Permite qualquer IP (menos seguro)
]
```

### 3. Atualizar Frontend para usar seu IP

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_BASE=http://192.168.1.100:8000
```

### 4. Iniciar com IP da rede

**Backend:**
```bash
# Em vez de --host 127.0.0.1, use:
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
O Vite já permite acesso de rede por padrão quando usa `--host 0.0.0.0`

## 🔒 Segurança

⚠️ **IMPORTANTE:**

- **Modo local (127.0.0.1):** ✅ Seguro, apenas você acessa
- **Modo rede (0.0.0.0):** ⚠️ Outros na mesma rede podem acessar
- **Nunca exponha na internet** sem autenticação adequada

## 📋 Checklist

- [ ] Sistema funciona localmente? ✅ (padrão)
- [ ] Precisa acessar de outros dispositivos? → Configure IP
- [ ] Precisa de banco de dados? ❌ (usa JSON local)
- [ ] Precisa de servidor remoto? ❌ (tudo local)
- [ ] Precisa de internet? ❌ (após instalar)

## 🎯 Resumo

**Por padrão:** Tudo roda localmente, sem configuração de rede.

**Se quiser rede local:** Configure o IP e CORS (opcional).

**Nunca precisa de:** Banco de dados externo, servidor remoto, internet (após instalar).

