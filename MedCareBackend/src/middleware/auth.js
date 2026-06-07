const { supabaseAdmin } = require('../supabase');

async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    req.usuario = data.user;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Erro ao verificar token.', detalhe: error.message });
  }
}

module.exports = { autenticar };