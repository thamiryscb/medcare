import { apiFetch } from './api';

export async function listarRemedios() {
  return apiFetch('/api/remedios');
}

export async function adicionarRemedio(nome, dose, corCaixa, horarios) {
  return apiFetch('/api/remedios', {
    method: 'POST',
    body: JSON.stringify({ nome, dose, corCaixa, horarios }),
  });
}

export async function removerRemedio(id) {
  return apiFetch(`/api/remedios/${id}`, {
    method: 'DELETE',
  });
}
