import { API_URL } from '../config';
import { getToken } from './authService';

async function headers() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function listarRemedios() {
  const res = await fetch(`${API_URL}/api/remedios`, {
    headers: await headers(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao listar remédios.');
  return data;
}

export async function adicionarRemedio(nome, dose, corCaixa, horarios) {
  const res = await fetch(`${API_URL}/api/remedios`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify({ nome, dose, corCaixa, horarios }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao adicionar remédio.');
  return data;
}

export async function removerRemedio(id) {
  const res = await fetch(`${API_URL}/api/remedios/${id}`, {
    method: 'DELETE',
    headers: await headers(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao remover remédio.');
  return data;
}