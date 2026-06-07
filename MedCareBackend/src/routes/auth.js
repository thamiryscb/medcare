const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { autenticar } = require('../middleware/auth');

// Cadastro de novo usuário
router.post('/cadastro', async (req, res) => {
  const { email, senha, nome, tipo, codigoPaciente } = req.body;

  if (!email || !senha || !nome || !tipo) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  if (!['paciente', 'familiar'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser paciente ou familiar.' });
  }

  try {
    // Verifica código do paciente se for familiar
    let pacienteVinculadoId = null;
    if (tipo === 'familiar') {
      if (!codigoPaciente) {
        return res.status(400).json({ erro: 'Código do paciente é obrigatório para familiar.' });
      }
      const { data: paciente } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('codigo_paciente', codigoPaciente)
        .single();

      if (!paciente) {
        return res.status(404).json({ erro: 'Código do paciente não encontrado.' });
      }
      pacienteVinculadoId = paciente.id;
    }

    // Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
      }
      return res.status(400).json({ erro: authError.message });
    }

    // Gera código único para paciente
    const codigo = tipo === 'paciente'
      ? `${nome.split(' ')[0].toUpperCase()}-${Date.now().toString().slice(-4)}`
      : null;

    // Salva perfil na tabela usuarios
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome,
        email,
        tipo,
        codigo_paciente: codigo,
        paciente_vinculado: pacienteVinculadoId,
      });

    if (dbError) {
      return res.status(500).json({ erro: 'Erro ao salvar perfil.', detalhe: dbError.message });
    }

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      uid: authData.user.id,
      codigoPaciente: codigo,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno.', detalhe: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password: senha });

    if (error) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    // Busca perfil completo
    const { data: perfil } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.json({
      token: data.session.access_token,
      usuario: perfil,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno.', detalhe: error.message });
  }
});

// Buscar perfil do usuário logado
router.get('/perfil', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Perfil não encontrado.' });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno.', detalhe: error.message });
  }
});

module.exports = router;