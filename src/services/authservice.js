import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export async function login(email, senha) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao fazer login.');
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
  return data;
}

export async function cadastro(email, senha, nome, tipo, codigoPaciente) {
  const res = await fetch(`${API_URL}/api/auth/cadastro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha, nome, tipo, codigoPaciente }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao cadastrar.');
  return data;
}

export async function getToken() {
  return await AsyncStorage.getItem('token');
}

export async function getUsuario() {
  const u = await AsyncStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('usuario');
}