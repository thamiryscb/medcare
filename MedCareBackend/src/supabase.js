const { createClient } = require('@supabase/supabase-js');

// Cliente admin (service_role) — acesso total, usado no backend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Cliente público (anon) — usado para verificar tokens do app
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabaseAdmin, supabasePublic };