import { apiFetch } from './api';

export function getHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export async function getChecklist(data) {
  return apiFetch(`/api/checklist/${data}`);
}

export async function marcarTomado(data, checklistId) {
  return apiFetch(`/api/checklist/${data}/tomar`, {
    method: 'POST',
    body: JSON.stringify({ checklistId }),
  });
}

export async function getHistorico() {
  return apiFetch('/api/checklist/historico/resumo');
}
