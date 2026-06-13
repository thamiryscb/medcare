const { createClient } = require('@supabase/supabase-js');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }
}

function getJwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1] || '', 'base64url').toString());
    return payload.role;
  } catch (error) {
    return null;
  }
}

if (getJwtRole(process.env.SUPABASE_SERVICE_KEY) !== 'service_role') {
  throw new Error('SUPABASE_SERVICE_KEY precisa ser a chave service_role do Supabase, nao a anon key.');
}

if (getJwtRole(process.env.SUPABASE_ANON_KEY) !== 'anon') {
  throw new Error('SUPABASE_ANON_KEY precisa ser a chave anon do Supabase.');
}

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  supabaseOptions
);

const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  supabaseOptions
);

module.exports = { supabaseAdmin, supabasePublic };
