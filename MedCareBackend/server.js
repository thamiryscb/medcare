const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const remediosRoutes = require('./src/routes/remedios');
const checklistRoutes = require('./src/routes/checklist');
const familiaresRoutes = require('./src/routes/familiares');
const { autenticar } = require('./src/middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Rota de verificação
app.get('/', (req, res) => {
  res.json({ mensagem: '🚀 MedCare API rodando com Supabase!', versao: '2.0.0' });
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/remedios', autenticar, remediosRoutes);
app.use('/api/checklist', autenticar, checklistRoutes);
app.use('/api/familiares', autenticar, familiaresRoutes);

app.use((req, res, next) => {
  res.status(404).json({ erro: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor MedCare rodando na porta ${PORT}`);
  console.log(`🗄️  Banco: Supabase (${process.env.SUPABASE_URL})`);
});
