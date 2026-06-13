const express = require('express');
const router = express.Router();
const { supabaseAdmin, supabasePublic } = require('../supabase');
const { autenticar } = require('../middleware/auth');

async function buscarAuthPorEmail(email) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const usuario = data.users.find((user) => user.email?.toLowerCase() === email);
    if (usuario) return usuario;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function gerarCodigoPaciente(nome) {
  const base = String(nome || 'PACIENTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase() || 'PACIENTE';

  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    const sufixo = Math.floor(1000 + Math.random() * 9000);
    const codigo = `${base}-${sufixo}`;
    const { data } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('codigo_paciente', codigo)
      .maybeSingle();

    if (!data) return codigo;
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

router.post('/cadastro', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { senha, nome, tipo, codigoPaciente } = req.body;

  if (!email || !senha || !nome || !tipo) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatorios.' });
  }

  if (String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  if (!['paciente', 'familiar'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser paciente ou familiar.' });
  }

  try {
    const { data: perfilExistente } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (perfilExistente) {
      return res.status(409).json({ erro: 'Este e-mail ja esta cadastrado. Entre com e-mail e senha.' });
    }

    let pacienteVinculadoId = null;
    if (tipo === 'familiar') {
      if (!codigoPaciente) {
        return res.status(400).json({ erro: 'Codigo do paciente e obrigatorio para familiar.' });
      }

      const { data: paciente } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('codigo_paciente', String(codigoPaciente).trim().toUpperCase())
        .single();

      if (!paciente) {
        return res.status(404).json({ erro: 'Codigo do paciente nao encontrado.' });
      }

      pacienteVinculadoId = paciente.id;
    }

    let authUser = null;
    let usuarioCriadoAgora = false;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, tipo },
    });

    if (authError) {
      const mensagem = String(authError.message || '').toLowerCase();
      if (mensagem.includes('already') || mensagem.includes('registered') || mensagem.includes('exists')) {
        authUser = await buscarAuthPorEmail(email);
        if (!authUser) {
          return res.status(409).json({ erro: 'Este e-mail ja existe no login. Use outro e-mail.' });
        }

        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password: senha,
          user_metadata: { nome, tipo },
        });
      } else {
        return res.status(400).json({ erro: authError.message });
      }
    } else {
      authUser = authData.user;
      usuarioCriadoAgora = true;
    }

    const codigo = tipo === 'paciente' ? await gerarCodigoPaciente(nome) : null;

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authUser.id,
        nome,
        email,
        tipo,
        codigo_paciente: codigo,
        paciente_vinculado: pacienteVinculadoId,
      });

    if (dbError) {
      if (usuarioCriadoAgora) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => {});
      }

      return res.status(500).json({ erro: 'Erro ao salvar perfil.', detalhe: dbError.message });
    }

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso.',
      uid: authUser.id,
      codigoPaciente: codigo,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno.', detalhe: error.message });
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha sao obrigatorios.' });
  }

  try {
    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password: senha });

    if (error) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(404).json({
        erro: 'Conta existe no login, mas o perfil nao foi encontrado. Cadastre novamente ou fale com o suporte.',
      });
    }

    return res.json({
      token: data.session.access_token,
      usuario: perfil,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno.', detalhe: error.message });
  }
});

router.get('/perfil', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Perfil nao encontrado.' });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro interno.', detalhe: error.message });
  }
});

module.exports = router;
