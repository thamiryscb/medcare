const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { autenticar } = require('../middleware/auth');

async function getUsuarioLogado(uid) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('id', uid)
    .single();

  if (error || !data) {
    throw new Error('Usuario nao encontrado.');
  }

  return data;
}

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

router.post('/cadastro', autenticar, async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha nome, e-mail e senha do familiar.' });
  }

  if (String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  try {
    const paciente = await getUsuarioLogado(req.usuario.id);

    if (paciente.tipo !== 'paciente') {
      return res.status(403).json({ erro: 'Apenas o paciente pode cadastrar familiares por esta tela.' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const { data: perfilExistente } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email, tipo, paciente_vinculado')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (perfilExistente) {
      if (perfilExistente.tipo === 'familiar' && perfilExistente.paciente_vinculado === paciente.id) {
        return res.json({
          mensagem: 'Este familiar ja estava cadastrado para este paciente.',
          familiar: {
            id: perfilExistente.id,
            nome: perfilExistente.nome,
            email: perfilExistente.email,
          },
        });
      }

      return res.status(409).json({ erro: 'Este e-mail ja esta cadastrado em outra conta.' });
    }

    let authUser = null;
    let usuarioCriadoAgora = false;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalizado,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, tipo: 'familiar' },
    });

    if (authError) {
      const mensagem = String(authError.message || '').toLowerCase();
      if (mensagem.includes('already') || mensagem.includes('registered') || mensagem.includes('exists')) {
        authUser = await buscarAuthPorEmail(emailNormalizado);
        if (!authUser) {
          return res.status(409).json({
            erro: 'Este e-mail ja existe no login. Use outro e-mail ou entre pela tela de familiar.',
          });
        }

        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password: senha,
          user_metadata: { nome, tipo: 'familiar' },
        });
      } else {
        return res.status(400).json({ erro: authError.message });
      }
    } else {
      authUser = authData.user;
      usuarioCriadoAgora = true;
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authUser.id,
        nome,
        email: emailNormalizado,
        tipo: 'familiar',
        paciente_vinculado: paciente.id,
      })
      .select('id, nome, email')
      .single();

    if (dbError) {
      if (usuarioCriadoAgora) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => {});
      }
      return res.status(500).json({ erro: 'Nao foi possivel salvar o familiar.', detalhe: dbError.message });
    }

    return res.status(201).json({
      mensagem: 'Familiar cadastrado com sucesso.',
      familiar: data,
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

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
