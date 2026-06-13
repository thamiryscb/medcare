import { API_URL } from './config';
import { getToken } from './authservice';

async function parseResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      const preview = text.replace(/\s+/g, ' ').slice(0, 80);
      throw new Error(`A API respondeu em formato inesperado (${response.status}). Verifique se a API foi reiniciada. ${preview}`);
    }
  }

  if (!response.ok) {
    const detalhe = data?.detalhe ? ` ${data.detalhe}` : '';
    throw new Error(`${data?.erro || data?.message || 'Nao foi possivel conectar agora.'}${detalhe}`);
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse(response);
}
