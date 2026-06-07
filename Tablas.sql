-- ============================================
-- BLOCK APP — Schema Supabase v1.0
-- ============================================

-- USUARIOS
-- Extiende el auth.users de Supabase
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  created_at timestamp DEFAULT now()
);

-- ============================================

-- CONFIGURACIÓN BASE DEL DÍA
CREATE TABLE day_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,                          -- "Semana", "Sábado", "Domingo"
  wake_time time NOT NULL,                     -- 07:00
  end_time time NOT NULL,                      -- 21:00
  applies_to text[] NOT NULL,                  -- ["mon","tue","wed","thu","fri"]
  is_default boolean DEFAULT false,            -- fallback si no hay config específica
  created_at timestamp DEFAULT now()
);

-- ============================================

-- BLOQUES Y EVENTOS FIJOS (tabla unificada)
CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  day_config_id uuid REFERENCES day_configs(id) ON DELETE CASCADE,
  name text NOT NULL,                          -- "Pidway", "Ducha", "Emprendimiento"
  type text NOT NULL                           -- trabajo / deporte / comida / emprendimiento / fijo / otro
    CHECK (type IN ('trabajo','deporte','comida','emprendimiento','fijo','otro')),
  start_time time NOT NULL,
  duration_minutes int NOT NULL,
  color text,                                  -- hex color del tipo
  is_fixed boolean DEFAULT false,              -- true = sin tareas (ducha, desayuno)
  is_active boolean DEFAULT true,
  repeat_rule text DEFAULT 'custom'            -- daily / weekdays / custom
    CHECK (repeat_rule IN ('daily','weekdays','custom')),
  applies_to text[],                           -- ["mon","wed","fri"]
  created_at timestamp DEFAULT now()
);

-- ============================================

-- EXCEPCIONES DE BLOQUES
CREATE TABLE block_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  action text NOT NULL                         -- skip / reschedule
    CHECK (action IN ('skip','reschedule')),
  new_start_time time,                         -- solo si action = reschedule
  created_at timestamp DEFAULT now(),
  UNIQUE (block_id, exception_date)            -- una excepción por bloque por día
);

-- ============================================

-- TAREAS
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  title text NOT NULL,
  priority text DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high')),
  completed boolean DEFAULT false,
  date date NOT NULL,                          -- día específico de la tarea
  "order" int DEFAULT 0,                       -- para drag & drop
  created_at timestamp DEFAULT now()
);

-- ============================================

-- NOTIFICACIONES
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  minutes_before int DEFAULT 5,
  enabled boolean DEFAULT true,
  UNIQUE (user_id, block_id)                   -- una config por bloque por usuario
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_day_configs_user ON day_configs(user_id);
CREATE INDEX idx_blocks_user ON blocks(user_id);
CREATE INDEX idx_blocks_day_config ON blocks(day_config_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_block ON tasks(block_id);
CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_block_exceptions_block ON block_exceptions(block_id);
CREATE INDEX idx_block_exceptions_date ON block_exceptions(exception_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Trigger para perfilar auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.raw_user_meta_data->>'name', '')), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Users
CREATE POLICY "users_own" ON users
  USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_delete_own" ON users
  FOR DELETE
  USING (id = auth.uid());

-- Day configs
CREATE POLICY "day_configs_own" ON day_configs
  USING (user_id = auth.uid());

CREATE POLICY "day_configs_insert_own" ON day_configs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "day_configs_update_own" ON day_configs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "day_configs_delete_own" ON day_configs
  FOR DELETE
  USING (user_id = auth.uid());

-- Blocks
CREATE POLICY "blocks_own" ON blocks
  USING (user_id = auth.uid());

CREATE POLICY "blocks_insert_own" ON blocks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "blocks_update_own" ON blocks
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "blocks_delete_own" ON blocks
  FOR DELETE
  USING (user_id = auth.uid());

-- Block exceptions
CREATE POLICY "block_exceptions_own" ON block_exceptions
  USING (user_id = auth.uid());

CREATE POLICY "block_exceptions_insert_own" ON block_exceptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "block_exceptions_update_own" ON block_exceptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "block_exceptions_delete_own" ON block_exceptions
  FOR DELETE
  USING (user_id = auth.uid());

-- Tasks
CREATE POLICY "tasks_own" ON tasks
  USING (user_id = auth.uid());

CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_delete_own" ON tasks
  FOR DELETE
  USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "notifications_own" ON notifications
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());
