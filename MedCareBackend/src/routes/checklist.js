const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { autenticar } = require('../middleware/auth');

async function getPacienteId(uid) {
  const { data } = await supabaseAdmin
    .from('usuarios')
    .select('tipo, paciente_vinculado')
    .eq('id', uid)
    .single();
  return data?.tipo === 'familiar' ? data.paciente_vinculado : uid;
}

// Buscar checklist do dia
router.get('/:data', autenticar, async (req, res) => {
  try {
    const pacienteId = await getPacienteId(req.usuario.id);
    const data = req.params.data;

    let { data: itens, error } = await supabaseAdmin
      .from('checklist')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('data', data)
      .order('horario');

    if (error) return res.status(500).json({ erro: error.message });

    // Se não existe checklist para o dia, gera a partir dos remédios
    if (!itens || itens.length === 0) {
      const { data: remedios } = await supabaseAdmin
        .from('remedios')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('ativo', true);

      const novosItens = [];
      for (const rem of remedios || []) {
        for (const horario of rem.horarios) {
          novosItens.push({
            paciente_id: pacienteId,
            remedio_id: rem.id,
            nome_remedio: rem.nome,
            dose: rem.dose,
            horario,
            data,
            tomado: false,
          });
        }
      }

      if (novosItens.length > 0) {
        const { data: inseridos, error: errInsert } = await supabaseAdmin
          .from('checklist')
          .insert(novosItens)
          .select();

        if (errInsert) return res.status(500).json({ erro: errInsert.message });
        itens = inseridos;
      }
    }

    return res.json({ data, itens: itens || [] });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Marcar remédio como tomado
router.post('/:data/tomar', autenticar, async (req, res) => {
  const { checklistId } = req.body;

  if (!checklistId) {
    return res.status(400).json({ erro: 'checklistId é obrigatório.' });
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

    // Verifica se todos foram tomados no dia
    const dataHoje = req.params.data;
    const { data: todos } = await supabaseAdmin
      .from('checklist')
      .select('tomado')
      .eq('paciente_id', pacienteId)
      .eq('data', dataHoje);

    const todosTomados = todos?.every(i => i.tomado);

    // Notifica familiares se todos tomaram
    if (todosTomados) {
      const { data: familiares } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('paciente_vinculado', pacienteId)
        .eq('tipo', 'familiar');

      for (const fam of familiares || []) {
        await supabaseAdmin.from('notificacoes').insert({
          para_usuario: fam.id,
          paciente_id: pacienteId,
          tipo: 'todos_tomados',
          mensagem: 'Todos os remédios foram tomados hoje! ✅',
        });
      }
    }

    return res.json({ mensagem: 'Remédio marcado como tomado!', item: data, todosTomados });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Histórico dos últimos 30 dias
router.get('/historico/resumo', autenticar, async (req, res) => {
  try {
    const pacienteId = await getPacienteId(req.usuario.id);

    const { data, error } = await supabaseAdmin
      .from('checklist')
      .select('data, tomado')
      .eq('paciente_id', pacienteId)
      .order('data', { ascending: false })
      .limit(150);

    if (error) return res.status(500).json({ erro: error.message });

    // Agrupa por data
    const porData = {};
    for (const item of data || []) {
      if (!porData[item.data]) porData[item.data] = { total: 0, tomados: 0 };
      porData[item.data].total++;
      if (item.tomado) porData[item.data].tomados++;
    }

    const historico = Object.entries(porData).map(([data, v]) => ({
      data,
      total: v.total,
      tomados: v.tomados,
      percentual: Math.round((v.tomados / v.total) * 100),
    }));

    return res.json(historico);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;