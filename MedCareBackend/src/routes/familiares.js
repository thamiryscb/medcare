const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { autenticar } = require('../middleware/auth');

// Listar familiares vinculados ao paciente
router.get('/', autenticar, async (req, res) => {
  try {
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('tipo')
      .eq('id', req.usuario.id)
      .single();

    if (usuario?.tipo !== 'paciente') {
      return res.status(403).json({ erro: 'Apenas pacientes podem ver seus familiares.' });
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email')
      .eq('paciente_vinculado', req.usuario.id)
      .eq('tipo', 'familiar');

    if (error) return res.status(500).json({ erro: error.message });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Buscar notificações do familiar
router.get('/notificacoes', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notificacoes')
      .select('*')
      .eq('para_usuario', req.usuario.id)
      .order('criada_em', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ erro: error.message });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Marcar notificação como lida
router.put('/notificacoes/:id/lida', autenticar, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', req.params.id)
      .eq('para_usuario', req.usuario.id);

    if (error) return res.status(500).json({ erro: error.message });
    return res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// Salvar token push do dispositivo
router.post('/push-token', autenticar, async (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) {
    return res.status(400).json({ erro: 'Token de push é obrigatório.' });
  }
  try {
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ expo_push_token: expoPushToken })
      .eq('id', req.usuario.id);

    if (error) return res.status(500).json({ erro: error.message });
    return res.json({ mensagem: 'Token salvo com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;