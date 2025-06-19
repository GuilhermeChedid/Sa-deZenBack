const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');
const path = require('path');
const usuarios = require('./usuarios');
require('dotenv').config();
require('./auth/passport');

console.log('--- server.js iniciado ---');
console.log('Caminho do arquivo sendo executado:', __filename);
console.log('Diretório de trabalho atual:', process.cwd());

const app = express();

// Servir arquivos estáticos (HTML, CSS, imagens, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware para verificar se está autenticado
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Rotas de páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicial.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

app.get('/ativar', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ativar.html'));
});

// Cadastro
app.post('/register', async (req, res) => {
  const { email, senha } = req.body;

  // Verificar se já existe o usuário
  if (usuarios.find(u => u.email === email)) {
    return res.redirect('/cadastro?erro=email');
  }

  // Validação da senha: mínimo 8 caracteres e pelo menos uma letra
  const senhaValida = senha.length >= 8 && /[a-zA-Z]/.test(senha);
  if (!senhaValida) {
    return res.redirect('/cadastro?erro=senha');
  }

  // Criptografar senha e salvar usuário
  const senhaHash = await bcrypt.hash(senha, 10);
  const novo = { id: usuarios.length + 1, email, senha: senhaHash };
  usuarios.push(novo);

  console.log('Novo usuário cadastrado:', email);

  res.redirect('/login');
});

// Login tradicional
app.post('/login', passport.authenticate('local', {
  successRedirect: '/ativar',
  failureRedirect: '/login?erro=1'
}));

// Iniciar servidor na porta 8080
app.listen(8080, () => console.log('Servidor rodando em http://localhost:8080'));
