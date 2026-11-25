-- 1. TABELA DE USUÁRIOS
-- Armazena os dados de solicitantes, técnicos e administradores.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('solicitante', 'tecnico', 'admin')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CHAMADOS
-- Armazena os chamados registrados pelos usuários.

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requester_id SERIAL NOT NULL REFERENCES users(id),
    technician_id SERIAL REFERENCES users(id),

    category VARCHAR(50) NOT NULL 
        CHECK (category IN ('hardware','software', 'network', 'outros')),

    priority VARCHAR(50) NOT NULL DEFAULT 'media'
        CHECK (priority IN ('baixa', 'media', 'alta')),

    status VARCHAR(50) NOT NULL DEFAULT 'aberto'
        CHECK (status IN ('aberto', 'em andamento', 'resolvido', 'fechado')),
-- Campo para registrar a solução final do chamado.
    solution TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

-- 3. TABELA DE HISTÓRICO
-- Registra as atualizações realizadas em cada chamado.

CREATE TABLE ticket_updates (
    id SERIAL PRIMARY KEY,
    ticket_id SERIAL NOT NULL REFERENCES tickets(id),
    user_id SERIAL NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ÍNDICES
-- Melhoram o desempenho de consultas frequentes.

CREATE INDEX idx_tickets_requester
ON tickets(requester_id);

CREATE INDEX idx_tickets_technician
ON tickets(technician_id);

CREATE INDEX idx_tickets_status
ON tickets(status);

CREATE INDEX idx_ticket_updates_ticket
ON ticket_updates(ticket_id);

CREATE INDEX idx_users_role
ON users(role);