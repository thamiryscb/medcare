const DEFAULT_API_URL = 'http://localhost:3333/api';

export const API_BASE_URL = (
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_API_URL
) || DEFAULT_API_URL;

export async function apiRequest(path, options = {}) {
  const { method = 'GET', token, body } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || 'Nao foi possivel falar com o servidor';
    throw new Error(message);
  }

  return payload;
}

export function loginPatient(emailOrName, password) {
  return apiRequest('/auth/patient/login', {
    method: 'POST',
    body: { emailOrName, password },
  });
}

export function loginCaregiver(email, password, patientCode) {
  return apiRequest('/auth/family/login', {
    method: 'POST',
    body: { email, password, patientCode },
  });
}

export function getPatientDashboard(token) {
  return apiRequest('/patients/me/dashboard', { token });
}

export function getCaregiverDashboard(token) {
  return apiRequest('/family/dashboard', { token });
}

export function logout(token) {
  return apiRequest('/auth/logout', {
    method: 'POST',
    token,
  });
}

export function getMedications(token, patientId = 'me') {
  return apiRequest(`/patients/${patientId}/medications`, { token });
}

export function createMedication(token, patientId = 'me', medication) {
  return apiRequest(`/patients/${patientId}/medications`, {
    method: 'POST',
    token,
    body: medication,
  });
}

export function deleteMedication(token, medicationId) {
  return apiRequest(`/medications/${encodeURIComponent(medicationId)}`, {
    method: 'DELETE',
    token,
  });
}

export function getChecklist(token, patientId = 'me') {
  return apiRequest(`/patients/${patientId}/checklist`, { token });
}

export function markChecklistItemTaken(token, itemId, taken = true) {
  return apiRequest(`/checklist/${encodeURIComponent(itemId)}/taken`, {
    method: 'PATCH',
    token,
    body: { taken },
  });
}
