-- Schema do banco de dados Supabase para LoopOS
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Coordenador', 'Supervisor', 'Operador', 'Técnico', 'Auxiliar')),
    can_login BOOLEAN DEFAULT true,
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Usinas
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client TEXT NOT NULL,
    name TEXT NOT NULL,
    string_count INTEGER DEFAULT 0,
    tracker_count INTEGER DEFAULT 0,
    coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Sub-usinas
CREATE TABLE IF NOT EXISTS sub_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    sub_plant_number INTEGER NOT NULL,
    inverter_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plant_id, sub_plant_number)
);

-- Tabela de Ativos (many-to-many com plantas)
CREATE TABLE IF NOT EXISTS plant_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plant_id, asset_name)
);

-- Tabela de Atribuições (relacionamento many-to-many entre usuários e plantas)
CREATE TABLE IF NOT EXISTS plant_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('coordinator', 'supervisor', 'technician', 'assistant')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plant_id, user_id, role_type)
);

-- Tabela de Ordens de Serviço (OS)
CREATE TABLE IF NOT EXISTS os (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pendente', 'Em Progresso', 'Em Revisão', 'Concluído')),
    priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Urgente')),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    activity TEXT NOT NULL,
    attachments_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Ativos da OS (many-to-many)
CREATE TABLE IF NOT EXISTS os_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id TEXT NOT NULL REFERENCES os(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(os_id, asset_name)
);

-- Tabela de Logs da OS
CREATE TABLE IF NOT EXISTS os_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id TEXT NOT NULL REFERENCES os(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    status_from TEXT,
    status_to TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Anexos de Imagem da OS
CREATE TABLE IF NOT EXISTS os_image_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id TEXT NOT NULL REFERENCES os(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_supervisor ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_plants_coordinator ON plants(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_sub_plants_plant ON sub_plants(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_assets_plant ON plant_assets(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_assignments_plant ON plant_assignments(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_assignments_user ON plant_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_os_plant ON os(plant_id);
CREATE INDEX IF NOT EXISTS idx_os_technician ON os(technician_id);
CREATE INDEX IF NOT EXISTS idx_os_supervisor ON os(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON os(status);
CREATE INDEX IF NOT EXISTS idx_os_logs_os ON os_logs(os_id);
CREATE INDEX IF NOT EXISTS idx_os_attachments_os ON os_image_attachments(os_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_os_updated_at BEFORE UPDATE ON os
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Desabilitado por padrão, pode ser habilitado depois
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE os ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo por enquanto - ajuste conforme necessário)
CREATE POLICY "Enable all operations for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all operations for plants" ON plants FOR ALL USING (true);
CREATE POLICY "Enable all operations for os" ON os FOR ALL USING (true);

