import { API_URL } from './config';

let authToken = null;
let authUsuario = null;

async function requestAuth(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      const preview = text.replace(/\s+/g, ' ').slice(0, 80);
      throw new Error(`A API respondeu em formato inesperado (${response.status}). Reinicie a API e tente novamente. ${preview}`);
    }
  }

  if (!response.ok) {
    const detalhe = data?.detalhe ? ` ${data.detalhe}` : '';
    throw new Error(`${data?.erro || 'Nao foi possivel concluir agora.'}${detalhe}`);
  }

  return data;
}

export async function login(email, senha) {
  const data = await requestAuth('/api/auth/login', { email, senha });
  authToken = data.token;
  authUsuario = data.usuario;
  return data;
}

export async function cadastro(email, senha, nome, tipo, codigoPaciente) {
  return requestAuth('/api/auth/cadastro', {
    email,
    senha,
    nome,
    tipo,
    codigoPaciente,
  });
}

export async function getToken() {
  return authToken;
}

export async function getUsuario() {
  return authUsuario;
}

export function setUsuario(usuario) {
  authUsuario = usuario;
}

export async function logout() {
  authToken = null;
  authUsuario = null;
}
