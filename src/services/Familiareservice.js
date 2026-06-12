import { apiFetch } from './api';

export async function listarFamiliares() {
  return apiFetch('/api/familiares');
}

export async function listarNotificacoes() {
  return apiFetch('/api/familiares/notificacoes');
}

export async function marcarNotificacaoLida(id) {
  return apiFetch(`/api/familiares/notificacoes/${id}/lida`, {
    method: 'PUT',
  });
}
