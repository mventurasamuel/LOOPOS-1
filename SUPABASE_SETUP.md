# 🗄️ Configuração do Supabase - LoopOS

## 📋 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Crie uma conta (se não tiver)
3. Clique em "New Project"
4. Preencha:
   - **Name:** LoopOS (ou outro nome)
   - **Database Password:** (anote esta senha!)
   - **Region:** Escolha a mais próxima
5. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave pública)

### 3. Criar Tabelas no Banco

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Copie TODO o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso

### 4. Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env`:
   ```bash
   # Windows
   copy .env.example .env
   
   # Linux/Mac
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=sua-chave-anon-key-aqui
   ```

### 5. Instalar Dependências

```bash
cd attachments
pip install -r ../requirements.txt
```

### 6. Testar Conexão

Inicie o servidor:
```bash
npm start
```

Se tudo estiver correto, você verá os dados sendo carregados do Supabase!

## 🔄 Migração de Dados JSON para Supabase

Se você já tem dados nos arquivos JSON, você pode migrar:

1. Os dados em `attachments/data/*.json` serão automaticamente ignorados
2. Para migrar dados existentes, você precisará criar um script de migração
3. Ou simplesmente recriar os dados através da interface

## ✅ Verificar se Está Funcionando

1. Acesse o dashboard do Supabase
2. Vá em **Table Editor**
3. Você deve ver as tabelas criadas:
   - `users`
   - `plants`
   - `os`
   - `plant_assignments`
   - etc.

4. Crie um usuário pela interface do LoopOS
5. Verifique se aparece na tabela `users` do Supabase

## 🔒 Segurança

- ✅ Use a chave **anon/public** (não a service_role)
- ✅ Configure RLS (Row Level Security) se necessário
- ✅ Nunca commite o arquivo `.env` no Git

## 📝 Notas

- O Supabase é gratuito até 500MB de banco de dados
- Os dados são armazenados na nuvem (não mais localmente)
- Você pode acessar de qualquer lugar com internet
- Backup automático pelo Supabase

## 🆘 Problemas Comuns

### Erro: "SUPABASE_URL e SUPABASE_KEY devem estar configurados"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se as variáveis estão corretas

### Erro: "relation does not exist"
- Execute o SQL do `supabase/schema.sql` no SQL Editor

### Erro de conexão
- Verifique se a URL e a chave estão corretas
- Verifique sua conexão com a internet

