const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const usuarios = require('../usuarios'); // Importa a lista de usuários (em memória)
const passport = require('passport');
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

console.log('--- auth/passport.js carregado ---');

// --- ESTRATÉGIA DE AUTENTICAÇÃO LOCAL (Email e Senha) ---
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, senha, done) => {
  console.log('--- Tentativa de Login Local ---');
  console.log('Email recebido:', email);

  const user = usuarios.find(u => u.email === email);

  if (!user) {
    console.log('Usuário não encontrado para o email:', email);
    return done(null, false, { message: 'Email ou senha incorretos.' });
  }

  // Compara a senha fornecida com o hash armazenado
  const isMatch = await bcrypt.compare(senha, user.senha);
  if (!isMatch) {
    console.log('Senha incorreta para o usuário:', email);
    return done(null, false, { message: 'Email ou senha incorretos.' });
  }

  console.log('Login Local bem-sucedido para o usuário:', user.email, 'ID:', user.id);
  return done(null, user); // Autenticação bem-sucedida, passa o objeto user
}));

// --- ESTRATÉGIA DE AUTENTICAÇÃO COM GOOGLE ---
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL // Garanta que esta URL está correta no .env e no Google Cloud Console
}, (accessToken, refreshToken, profile, done) => {
  console.log('--- Tentativa de Login Google ---');
  console.log('Profile ID Google:', profile.id);
  console.log('Emails do Profile Google:', profile.emails);

  let user = usuarios.find(u => u.googleId === profile.id);

  if (!user) {
    // Se o usuário Google não existe, cria um novo
    const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    if (!userEmail) {
      console.error('Erro: Nenhum email encontrado no perfil do Google.');
      return done(null, false, { message: 'Não foi possível obter o email do perfil Google.' });
    }

    user = { id: usuarios.length + 1, email: userEmail, googleId: profile.id };
    usuarios.push(user);
    console.log('Novo usuário Google criado:', user.email, 'ID:', user.id);
  } else {
    console.log('Usuário Google existente encontrado:', user.email, 'ID:', user.id);
  }
  return done(null, user); // Autenticação bem-sucedida, passa o objeto user
}));

// --- SERIALIZAÇÃO DO USUÁRIO (O que salvar na sessão) ---
passport.serializeUser((user, done) => {
  console.log('SerializeUser: Serializando usuário com ID:', user.id);
  done(null, user.id); // Salva apenas o ID do usuário na sessão
});

// --- DESSERIALIZAÇÃO DO USUÁRIO (Como recuperar o usuário da sessão) ---
passport.deserializeUser((id, done) => {
  console.log('DeserializeUser: Tentando desserializar ID:', id);
  const user = usuarios.find(u => u.id === id);

  if (user) {
    console.log('DeserializeUser: Usuário encontrado:', user.email, 'para ID:', id);
    done(null, user); // Usuário encontrado, anexa ao req.user
  } else {
    console.log('DeserializeUser: Usuário NÃO encontrado para ID:', id);
    done(null, false); // Usuário não encontrado, session será invalidada
  }
});