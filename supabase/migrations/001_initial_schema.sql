-- ==================== CORE ====================
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id             UUID UNIQUE,
  name                TEXT,
  email               TEXT UNIQUE,
  telegram_chat_id    TEXT,
  rest_hr             INT DEFAULT 50,
  max_hr              INT DEFAULT 190,
  weight_kg           DECIMAL,
  height_cm           INT,
  age                 INT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  morning_briefing_time   TIME DEFAULT '07:00',
  evening_recap_time      TIME DEFAULT '21:00',
  timezone                TEXT DEFAULT 'Europe/Vienna',
  endurance_sessions_week INT DEFAULT 4,
  strength_days           JSONB DEFAULT '["MO","WE","FR"]',
  strength_splits         JSONB DEFAULT '{"MO":"Upper Body","WE":"Lower Body","FR":"Full Body"}',
  available_days          JSONB DEFAULT '["MO","TU","WE","TH","FR","SA","SU"]',
  double_sessions         BOOLEAN DEFAULT false,
  long_session_day        TEXT DEFAULT 'SA',
  preferred_rest_day      TEXT DEFAULT 'SU',
  nutrition_goal          TEXT DEFAULT 'maintain',
  notification_prefs      JSONB DEFAULT '{"morning": true, "evening": true, "weekly": true, "alerts": true}'
);

-- ==================== GOALS ====================
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL,
  category        TEXT NOT NULL,
  target_date     DATE,
  target_value    JSONB,
  current_value   JSONB,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id         UUID REFERENCES goals(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  target_date     DATE,
  target_value    JSONB,
  completed       BOOLEAN DEFAULT false,
  order_index     INT
);

-- ==================== TRAINING PROFILES ====================
CREATE TABLE training_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id) ON DELETE SET NULL,
  profile_type    TEXT NOT NULL,
  name            TEXT NOT NULL,
  config          JSONB NOT NULL DEFAULT '{}',
  active          BOOLEAN DEFAULT false,
  activated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE limiter_assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id           UUID REFERENCES goals(id) ON DELETE SET NULL,
  date              DATE NOT NULL,
  primary_limiter   TEXT NOT NULL,
  secondary_limiter TEXT,
  evidence          TEXT,
  auto_detected     BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profile_transitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  from_profile_id UUID REFERENCES training_profiles(id) ON DELETE SET NULL,
  to_profile_id   UUID REFERENCES training_profiles(id) ON DELETE SET NULL,
  transition_plan JSONB,
  started_at      DATE NOT NULL,
  completed_at    DATE,
  status          TEXT DEFAULT 'in_progress'
);

-- ==================== FITNESS ====================
CREATE TABLE activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  source          TEXT DEFAULT 'apple_health',
  source_id       TEXT,
  type            TEXT NOT NULL,
  name            TEXT,
  distance_m      INT,
  duration_s      INT,
  avg_hr          INT,
  max_hr          INT,
  avg_pace        TEXT,
  avg_speed       DECIMAL,
  elevation_gain  INT,
  calories        INT,
  trimp           DECIMAL,
  started_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE TABLE training_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id) ON DELETE SET NULL,
  week_start      DATE NOT NULL,
  phase           TEXT,
  is_deload       BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE planned_workouts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                 UUID REFERENCES training_plans(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  date                    DATE NOT NULL,
  type                    TEXT NOT NULL,
  title                   TEXT,
  description             TEXT,
  target_duration_min     INT,
  target_distance_km      DECIMAL,
  target_zone             TEXT,
  completed               BOOLEAN DEFAULT false,
  skipped                 BOOLEAN DEFAULT false,
  skip_reason             TEXT,
  matched_activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
  adjusted_for_recovery   BOOLEAN DEFAULT false,
  original_title          TEXT,
  is_key_session          BOOLEAN DEFAULT false,
  is_cross_training       BOOLEAN DEFAULT false
);

CREATE TABLE fitness_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  ctl             DECIMAL,
  atl             DECIMAL,
  tsb             DECIMAL,
  trimp_today     DECIMAL,
  UNIQUE(user_id, date)
);

CREATE TABLE coaching_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  decision_type   TEXT NOT NULL,
  planned         JSONB,
  recommended     JSONB,
  reasoning       TEXT NOT NULL,
  accepted        BOOLEAN,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==================== SLEEP & RECOVERY ====================
CREATE TABLE sleep_data (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  total_sleep_min     INT,
  deep_sleep_min      INT,
  rem_sleep_min       INT,
  light_sleep_min     INT,
  awake_min           INT,
  time_in_bed_min     INT,
  sleep_efficiency    DECIMAL,
  bedtime             TIMESTAMPTZ,
  wake_time           TIMESTAMPTZ,
  hrv_overnight       DECIMAL,
  resting_hr          INT,
  sleep_score         INT,
  source              TEXT DEFAULT 'apple_health',
  UNIQUE(user_id, date)
);

CREATE TABLE recovery_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  score           INT,
  hrv_status      TEXT,
  rhr_status      TEXT,
  recommendation  TEXT,
  UNIQUE(user_id, date)
);

-- ==================== LOGBUCH ====================
CREATE TABLE journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  factors         TEXT[] NOT NULL DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE journal_correlations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  factor          TEXT NOT NULL,
  sleep_impact    DECIMAL,
  recovery_impact DECIMAL,
  sample_size     INT,
  last_calculated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, factor)
);

-- ==================== ERNAEHRUNG ====================
CREATE TABLE nutrition_daily (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  target_calories     INT,
  target_carbs_g      INT,
  target_protein_g    INT,
  target_fat_g        INT,
  logged_calories     INT DEFAULT 0,
  logged_carbs_g      INT DEFAULT 0,
  logged_protein_g    INT DEFAULT 0,
  logged_fat_g        INT DEFAULT 0,
  water_liters        DECIMAL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE meal_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  calories        INT NOT NULL,
  carbs_g         INT NOT NULL,
  protein_g       INT NOT NULL,
  fat_g           INT NOT NULL,
  category        TEXT
);

CREATE TABLE meal_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  meal_type       TEXT,
  description     TEXT,
  calories        INT,
  carbs_g         INT,
  protein_g       INT,
  fat_g           INT,
  template_id     UUID REFERENCES meal_templates(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==================== GEWICHT ====================
CREATE TABLE body_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  weight_kg       DECIMAL NOT NULL,
  source          TEXT DEFAULT 'manual',
  UNIQUE(user_id, date)
);

-- ==================== TASKS ====================
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  color           TEXT,
  icon            TEXT,
  order_index     INT DEFAULT 0
);

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  goal_id         UUID REFERENCES goals(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  priority        INT DEFAULT 4 CHECK (priority BETWEEN 1 AND 4),
  tags            TEXT[] DEFAULT '{}',
  due_date        DATE,
  due_time        TIME,
  recurrence      TEXT,
  parent_task_id  UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  source          TEXT DEFAULT 'manual',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  channel         TEXT DEFAULT 'telegram',
  message         TEXT,
  sent_at         TIMESTAMPTZ DEFAULT now()
);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE limiter_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "users_own_data" ON users FOR ALL USING (auth_id = auth.uid());
CREATE POLICY "user_settings_own" ON user_settings FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "goals_own" ON goals FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "milestones_own" ON milestones FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "training_profiles_own" ON training_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "limiter_assessments_own" ON limiter_assessments FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "profile_transitions_own" ON profile_transitions FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "activities_own" ON activities FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "training_plans_own" ON training_plans FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "planned_workouts_own" ON planned_workouts FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "fitness_metrics_own" ON fitness_metrics FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "coaching_decisions_own" ON coaching_decisions FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "sleep_data_own" ON sleep_data FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "recovery_scores_own" ON recovery_scores FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "journal_entries_own" ON journal_entries FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "journal_correlations_own" ON journal_correlations FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "nutrition_daily_own" ON nutrition_daily FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "meal_templates_own" ON meal_templates FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "meal_logs_own" ON meal_logs FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "body_metrics_own" ON body_metrics FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "projects_own" ON projects FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "tasks_own" ON tasks FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "notification_log_own" ON notification_log FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ==================== INDEXES ====================
CREATE INDEX idx_activities_user_date ON activities(user_id, started_at DESC);
CREATE INDEX idx_planned_workouts_user_date ON planned_workouts(user_id, date);
CREATE INDEX idx_fitness_metrics_user_date ON fitness_metrics(user_id, date DESC);
CREATE INDEX idx_sleep_data_user_date ON sleep_data(user_id, date DESC);
CREATE INDEX idx_recovery_scores_user_date ON recovery_scores(user_id, date DESC);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_nutrition_daily_user_date ON nutrition_daily(user_id, date DESC);
CREATE INDEX idx_body_metrics_user_date ON body_metrics(user_id, date DESC);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date) WHERE NOT completed;
CREATE INDEX idx_goals_user_active ON goals(user_id) WHERE status = 'active';
