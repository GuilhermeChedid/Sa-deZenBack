const express = require('express');
    const session = require('express-session');
    const passport = require('passport');
    const bcrypt = require('bcrypt');
    const path = require('path');
    const usuarios = require('./usuarios'); // Importa a lista de usuários (em memória)
    require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env
    require('./auth/passport'); // Configura as estratégias de autenticação do Passport

    console.log('--- server.js iniciado ---');
    console.log('Caminho do arquivo sendo executado:', __filename); // Mostra o caminho exato do server.js
    console.log('Diretório de trabalho atual:', process.cwd()); // Mostra o diretório onde o comando 'node' foi executado

    const app = express();

    // Serve arquivos estáticos (HTML, CSS, imagens, etc.) da pasta 'public'
    app.use(express.static(path.join(__dirname, 'public')));

    // Middleware para processar corpos de requisição JSON e de formulário
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Configuração da sessão do Express
    app.use(session({
      secret: process.env.SESSION_SECRET, // Segredo para assinar o cookie de sessão (deve ser forte e vir do .env)
      resave: false, // Não salva a sessão se não houver modificações
      saveUninitialized: false // Não salva sessões sem inicializar
    }));

    // Inicializa o Passport e a integração de sessão do Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Rota principal para a tela inicial (inicial.html)
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'inicial.html'));
    });

    // Rota GET para a página de login
    app.get('/login', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'login.html'));
    });

    // Rota GET para a página de cadastro
    app.get('/cadastro', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
    });

    // Middleware para verificar se o usuário está autenticado
    function isLoggedIn(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/login');
    }

    // Rota GET para a página 'ativar' (protegida)
    app.get('/ativar', isLoggedIn, (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'ativar.html'));
    });

    // Rota POST para processar o cadastro de novos usuários
    app.post('/register', async (req, res) => {
      const { email, senha } = req.body;
      if (usuarios.find(u => u.email === email)) {
        return res.status(400).send('Usuário já existe');
      }
      const senhaHash = await bcrypt.hash(senha, 10);
      const novo = { id: usuarios.length + 1, email, senha: senhaHash };
      usuarios.push(novo);
      res.redirect('/login');
    });

    // Rota POST para processar o login tradicional
    app.post('/login', passport.authenticate('local', {
      failureRedirect: '/login',
      successRedirect: '/ativar'
    }));

    // Rota para iniciar o fluxo de autenticação com o Google
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    // Rota de callback do Google após a autenticação
    app.get('/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => res.redirect('/ativar')
    );

    // Inicia o servidor na porta 8080
    app.listen(8080, () => console.log('Servidor rodando em http://localhost:8080'));
    