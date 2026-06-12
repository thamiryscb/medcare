const { createClient } = require('@supabase/supabase-js');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabaseAdmin, supabasePublic };
