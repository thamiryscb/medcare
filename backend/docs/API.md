# MedCare API

Base URL:

```txt
http://localhost:3333/api
```

Authenticated routes expect:

```txt
Authorization: Bearer <token>
```

## Auth

`POST /auth/patient/login`

```json
{
  "emailOrName": "maria@email.com",
  "password": "123456"
}
```

`POST /auth/family/login`

```json
{
  "email": "carlos@email.com",
  "password": "123456",
  "patientCode": "MARIA-2024"
}
```

`POST /auth/patient/register`

```json
{
  "name": "Maria Aparecida",
  "email": "maria@email.com",
  "password": "123456",
  "phone": "(84) 9 9999-0000"
}
```

`POST /auth/family/register`

```json
{
  "name": "Carlos",
  "email": "carlos@email.com",
  "password": "123456",
  "phone": "(84) 9 9999-1234",
  "patientCode": "MARIA-2024",
  "relationship": "Filho"
}
```

`GET /me`

Returns the logged-in user, role, and linked patient data.

`POST /auth/logout`

Ends the current in-memory session.

## Dashboards

`GET /patients/me/dashboard`

Returns the patient home data: greeting user, patient profile, next reminder, today summary, menu counters, caregivers, and alerts.

`GET /family/dashboard`

Returns the caregiver home data for the first linked patient.

`GET /family/dashboard?patientId=<id>`

Returns the caregiver home data for a specific linked patient.

## Medications

`GET /patients/:patientId/medications`

Use `me` for the current patient:

```txt
GET /patients/me/medications
```

`POST /patients/:patientId/medications`

```json
{
  "name": "Losartana 50mg",
  "dose": "1 comprimido",
  "boxColor": "Caixa branca",
  "uiColor": "#e6f0ff",
  "instructions": "Tomar com agua.",
  "imageUri": "file:///imagem-losartana.jpg",
  "confirmationLimitMinutes": 30,
  "scheduleTimes": ["08:00", "20:00"]
}
```

`PATCH /medications/:medicationId`

```json
{
  "dose": "2 comprimidos",
  "scheduleTimes": ["09:00"]
}
```

`DELETE /medications/:medicationId`

Soft-deletes the medication by marking it inactive.

## Checklist

`GET /patients/:patientId/checklist?date=YYYY-MM-DD`

If `date` is omitted, the backend uses today.

`PATCH /checklist/:itemId/taken`

```json
{
  "taken": true
}
```

The checklist is generated from active medications and schedules. A database table stores only confirmations, not duplicate daily rows.

## Family

`GET /patients/:patientId/family`

Returns active caregivers linked to the patient.

`POST /patients/:patientId/family`

```json
{
  "name": "Lucia",
  "email": "lucia@email.com",
  "phone": "(84) 9 9988-5678",
  "relationship": "Filha"
}
```

If the caregiver already exists, the endpoint links the caregiver. Otherwise it creates an invite-ready record.

## Alerts

`GET /patients/:patientId/alerts`

`PATCH /alerts/:alertId/read`

Marks an alert as read.

## Location

`PATCH /patients/:patientId/location-sharing`

Use `me` for the current patient:

```json
{
  "enabled": true
}
```

`POST /patients/:patientId/locations`

Only works when location sharing is enabled for the patient.

```json
{
  "latitude": -5.7945,
  "longitude": -35.211,
  "accuracyMeters": 25,
  "capturedAt": "2026-06-12T12:00:00.000Z"
}
```

`GET /patients/:patientId/locations?limit=20`

Returns the latest authorized location records for the patient.
