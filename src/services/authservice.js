import { API_URL } from './config';

let authToken = null;
let authUsuario = null;

async function requestAuth(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.erro || 'Nao foi possivel concluir agora.');
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
