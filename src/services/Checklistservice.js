import { API_URL } from '../config';
import { getToken } from './authService';

async function headers() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function getHoje() {
  return new Date().toISOString().split('T')[0];
}

export async function getChecklist(data) {
  const res = await fetch(`${API_URL}/api/checklist/${data}`, {
    headers: await headers(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || 'Erro ao buscar checklist.');
  return json;
}

export async function marcarTomado(data, checklistId) {
  const res = await fetch(`${API_URL}/api/checklist/${data}/tomar`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ checklistId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || 'Erro ao marcar remédio.');
  return json;
}