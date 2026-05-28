# MedCare Backend

Backend Node.js for the existing MedCare screens.

It runs with a local SQLite database using Node's built-in `node:sqlite` module. No backend dependency install is required.

## Run

```bash
cd medcare/backend
npm start
```

The API starts at `http://localhost:3333`.

The default database file is created automatically at:

```txt
backend/database/medcare.sqlite
```

Use `DATABASE_URL=:memory:` for an in-memory database, or `MEDCARE_STORE=memory` to run the older mock store.

## Demo accounts

Patient:

```txt
email: maria@email.com
password: 123456
```

Caregiver:

```txt
email: carlos@email.com
password: 123456
patient code: MARIA-2024
```

The seeded patient code matches the current mobile mock screens.

## Main areas covered

- Patient login and registration.
- Caregiver login, registration, and patient-code linking.
- Patient and caregiver dashboard summaries.
- Medications list, creation, update, and deletion.
- Daily checklist generation from medication schedules.
- Checklist confirmation by patient or caregiver.
- Caregiver/family list and invite-ready endpoint.
- Alerts list and read confirmation.

## Database

`database/schema.sql` is applied on startup with `CREATE TABLE IF NOT EXISTS`, then the demo data is inserted only when the database has no users yet.

The app currently stores:

- users with `patient` and `caregiver` roles
- patient profiles and access codes
- caregiver links
- medications and medication schedules
- daily medication confirmations
- alerts
- login sessions
