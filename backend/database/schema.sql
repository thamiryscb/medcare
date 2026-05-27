CREATE TABLE users (
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

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  full_name TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE caregiver_links (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  caregiver_user_id TEXT NOT NULL REFERENCES users(id),
  relationship TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (patient_id, caregiver_user_id)
);

CREATE TABLE caregiver_invites (
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

CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  box_color TEXT NOT NULL,
  ui_color TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE medication_schedules (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL REFERENCES medications(id),
  time TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE medication_checkins (
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

CREATE TABLE alerts (
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

CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_schedules_medication_id ON medication_schedules(medication_id);
CREATE INDEX idx_checkins_patient_date ON medication_checkins(patient_id, date);
CREATE INDEX idx_alerts_patient_status ON alerts(patient_id, status);
CREATE INDEX idx_links_caregiver_user_id ON caregiver_links(caregiver_user_id);
