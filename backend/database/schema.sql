CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('patient', 'caregiver')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  initials TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  full_name TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  location_sharing_enabled INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS caregiver_links (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  caregiver_user_id TEXT NOT NULL REFERENCES users(id),
  relationship TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'blocked')),
  notify_on_missed_dose INTEGER NOT NULL DEFAULT 1,
  notify_on_location INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (patient_id, caregiver_user_id)
);

CREATE TABLE IF NOT EXISTS caregiver_invites (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  box_color TEXT NOT NULL,
  ui_color TEXT NOT NULL,
  instructions TEXT,
  image_uri TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medication_schedules (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL REFERENCES medications(id),
  time TEXT NOT NULL,
  confirmation_limit_minutes INTEGER NOT NULL DEFAULT 30,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medication_checkins (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  medication_id TEXT NOT NULL REFERENCES medications(id),
  schedule_id TEXT NOT NULL REFERENCES medication_schedules(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('taken', 'pending', 'skipped')),
  confirmed_at TEXT,
  confirmed_by_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (patient_id, medication_id, schedule_id, date)
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'read', 'resolved')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS location_events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy_meters REAL,
  captured_at TEXT NOT NULL,
  sent_to_caregiver INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_schedules_medication_id ON medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_checkins_patient_date ON medication_checkins(patient_id, date);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_status ON alerts(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_location_events_patient_captured ON location_events(patient_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_links_caregiver_user_id ON caregiver_links(caregiver_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
