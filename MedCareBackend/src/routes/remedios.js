const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { autenticar } = require('../middleware/auth');

// Busca o ID do paciente (próprio ou vinculado se for familiar)
async function getPacienteId(uid) {
  const { data } = await supabaseAdmin
    .from('usuarios')
    .select('tipo, paciente_vinculado')
    .eq('id', uid)
    .single();

  return data?.tipo === 'familiar' ? data.paciente_vinculado : uid;
}

// Listar remédios
router.get('/', autenticar, async (req, res) => {
  try {
    const pacienteId = await getPacienteId(req.usuario.id);

    const { data, error } = await supabaseAdmin
      .from('remedios')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('ativo', true)
      .order('criado_em', { ascending: false });

    if (error) return res.status(500).json({ erro: error.message });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Adicionar remédio
router.post('/', autenticar, async (req, res) => {
  const { nome, dose, corCaixa, horarios } = req.body;

  if (!nome || !dose || !horarios || horarios.length === 0) {
    return res.status(400).json({ erro: 'Nome, dose e horários são obrigatórios.' });
  }

  try {
    const pacienteId = await getPacienteId(req.usuario.id);

    const { data, error } = await supabaseAdmin
      .from('remedios')
      .insert({
        paciente_id: pacienteId,
        nome,
        dose,
        cor_caixa: corCaixa || 'Caixa azul',
        horarios,
        criado_por: req.usuario.id,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ erro: error.message });
    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Editar remédio
router.put('/:id', autenticar, async (req, res) => {
  const { nome, dose, corCaixa, horarios, ativo } = req.body;

  try {
    const pacienteId = await getPacienteId(req.usuario.id);

    const { data, error } = await supabaseAdmin
      .from('remedios')
      .update({
        ...(nome && { nome }),
        ...(dose && { dose }),
        ...(corCaixa && { cor_caixa: corCaixa }),
        ...(horarios && { horarios }),
        ...(ativo !== undefined && { ativo }),
      })
      .eq('id', req.params.id)
      .eq('paciente_id', pacienteId)
      .select()
      .single();

    if (error) return res.status(500).json({ erro: error.message });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Deletar remédio
router.delete('/:id', autenticar, async (req, res) => {
  try {
    const pacienteId = await getPacienteId(req.usuario.id);
    const remedioId = req.params.id;

    const { data: remedio, error: buscaError } = await supabaseAdmin
      .from('remedios')
      .select('id')
      .eq('id', remedioId)
      .eq('paciente_id', pacienteId)
      .single();

    if (buscaError || !remedio) {
      return res.status(404).json({ erro: 'Remedio nao encontrado.' });
    }

    const { error: checklistError } = await supabaseAdmin
      .from('checklist')
      .delete()
      .eq('remedio_id', remedioId)
      .eq('paciente_id', pacienteId);

    if (checklistError) return res.status(500).json({ erro: checklistError.message });

    const { error } = await supabaseAdmin
      .from('remedios')
      .delete()
      .eq('id', remedioId)
      .eq('paciente_id', pacienteId);

    if (error) return res.status(500).json({ erro: error.message });
    return res.json({ mensagem: 'Remédio removido com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
