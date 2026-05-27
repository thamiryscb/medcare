# MedCare Backend

Backend Node.js for the existing MedCare screens.

It currently runs with an in-memory store so the app can be tested without a database. The data layer is isolated, and `database/schema.sql` is ready for the first real database migration.

## Run

```bash
cd medcare/backend
npm start
```

The API starts at `http://localhost:3333`.

No dependency install is required right now because this backend uses only built-in Node.js modules.

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

## Database next step

Use `database/schema.sql` as the base migration. Then replace `src/data/memoryStore.js` with a store that implements the same methods against PostgreSQL, SQLite, Supabase, Firebase, or another database.

The service and route layers should not need major changes when the store is swapped.
