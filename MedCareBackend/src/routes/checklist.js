const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');

async function getPacienteId(uid) {
  const { data } = await supabaseAdmin
    .from('usuarios')
    .select('tipo, paciente_vinculado')
    .eq('id', uid)
    .single();

  return data?.tipo === 'familiar' ? data.paciente_vinculado : uid;
}

async function buscarChecklist(pacienteId, data) {
  const { data: itens, error } = await supabaseAdmin
    .from('checklist')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('data', data)
    .order('horario');

  if (error) throw error;
  return itens || [];
}

async function sincronizarChecklistDoDia(pacienteId, data) {
  const itensAtuais = await buscarChecklist(pacienteId, data);

  const { data: remedios, error } = await supabaseAdmin
    .from('remedios')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('ativo', true);

  if (error) throw error;

  const chavesAtuais = new Set(
    itensAtuais.map((item) => `${item.remedio_id}-${item.horario}`)
  );

  const novosItens = [];
  for (const remedio of remedios || []) {
    for (const horario of remedio.horarios || []) {
      const chave = `${remedio.id}-${horario}`;
      if (!chavesAtuais.has(chave)) {
        novosItens.push({
          paciente_id: pacienteId,
          remedio_id: remedio.id,
          nome_remedio: remedio.nome,
          dose: remedio.dose,
          horario,
          data,
          tomado: false,
        });
      }
    }
  }

  if (novosItens.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('checklist')
      .insert(novosItens);

    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }
  }

  return buscarChecklist(pacienteId, data);
}

router.get('/historico/resumo', async (req, res) => {
  try {
    const pacienteId = await getPacienteId(req.usuario.id);

    const { data, error } = await supabaseAdmin
      .from('checklist')
      .select('data, tomado')
      .eq('paciente_id', pacienteId)
      .order('data', { ascending: false })
      .limit(150);

    if (error) return res.status(500).json({ erro: error.message });

    const porData = {};
    for (const item of data || []) {
      if (!porData[item.data]) porData[item.data] = { total: 0, tomados: 0 };
      porData[item.data].total += 1;
      if (item.tomado) porData[item.data].tomados += 1;
    }

    const historico = Object.entries(porData).map(([dia, valores]) => ({
      data: dia,
      total: valores.total,
      tomados: valores.tomados,
      percentual: Math.round((valores.tomados / valores.total) * 100),
    }));

    return res.json(historico);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

router.get('/:data', async (req, res) => {
  try {
    const pacienteId = await getPacienteId(req.usuario.id);
    const data = req.params.data;
    const itens = await sincronizarChecklistDoDia(pacienteId, data);

    return res.json({ data, itens });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

router.post('/:data/tomar', async (req, res) => {
  const { checklistId } = req.body;

  if (!checklistId) {
    return res.status(400).json({ erro: 'checklistId e obrigatorio.' });
  }

  try {
    const pacienteId = await getPacienteId(req.usuario.id);

    const { data, error } = await supabaseAdmin
      .from('checklist')
      .update({
        tomado: true,
        horario_tomado: new Date().toISOString(),
        marcado_por: req.usuario.id,
      })
      .eq('id', checklistId)
      .eq('paciente_id', pacienteId)
      .select()
      .single();

    if (error) return res.status(500).json({ erro: error.message });

    const { data: todos } = await supabaseAdmin
      .from('checklist')
      .select('tomado')
      .eq('paciente_id', pacienteId)
      .eq('data', req.params.data);

    const todosTomados = (todos || []).length > 0 && todos.every((item) => item.tomado);

    if (todosTomados) {
      const { data: familiares } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('paciente_vinculado', pacienteId)
        .eq('tipo', 'familiar');

      for (const familiar of familiares || []) {
        await supabaseAdmin.from('notificacoes').insert({
          para_usuario: familiar.id,
          paciente_id: pacienteId,
          tipo: 'todos_tomados',
          mensagem: 'Todos os remedios foram tomados hoje.',
        });
      }
    }

    return res.json({ mensagem: 'Remedio marcado como tomado.', item: data, todosTomados });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
