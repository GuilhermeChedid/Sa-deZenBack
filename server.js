const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const app = express();

// Firebase
const credencial = require('./credencials.json');
admin.initializeApp({ credential: admin.credential.cert(credencial) });
const db = admin.firestore();

console.log('--- server.js iniciado ---');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas de páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'inicial.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cadastro.html')));
app.get('/ativar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ativar.html')));

// Palavras proibidas
const palavrasProibidas = ["viado", "gay", "bicha", "boiola", "bichona", "sapatão", "traveco",
  "puta", "piranha", "prostituta", "vadia", "vagabunda", "corna",
  "corno", "otario", "idiota", "burro", "asno", "panaca", "imbecil",
  "babaca", "lerdo", "lixo", "nojento", "porco", "animal", "anta", "tapado",
  "desgraçado", "desgraça", "maldito", "maldita", "demônio", "capeta",
  "inferno", "caralho", "merda", "porra", "bosta", "foda", "cacete", "pqp",
  "filho da puta", "fdp", "arrombado", "escroto", "escrota", "retardado",
  "retardada", "mongoloide", "cretino", "macaco", "preto", "neguinho",
  "branquelo", "racista", "nazi", "nazista", "hitler", "fascista",
  "terrorista", "estuprador", "pedófilo", "pedofilia", "estuprador",
  "estupradora", "buceta", "xota", "xavasca", "cu", "anus", "anal",
  "rola", "pau", "pinto", "penis", "pênis", "vagina", "testiculo", "saco",
  "sexo", "transa", "gozar", "gozo", "ejacular", "ejaculação", "orgasmo",
  "punheta", "punheteiro", "punheteira", "masturbação", "masturbar",
  "enfiar", "chupar", "mamando", "mamando rola", "comer", "comedor",
  "cuzão", "babaca", "otária", "imbecil", "babaca", "idiota", "burra",
  "burrice", "lixo humano", "pretinho", "branquinho", "comunista", "lula",
  "bolsonaro", "PT", "xandão", "gostoso", "gostosa", "gostozinho", "gostozinha",
  "gostosinha", "gostosinho","metodor","metedora","xereca"];

function contemPalavraProibida(nome) {
  const nomeLower = nome.toLowerCase();
  return palavrasProibidas.some(palavra => nomeLower.includes(palavra));
}

function validarTelefone(numero) {
  const numeroLimpo = String(numero).replace(/\D/g, ''); // Remove tudo que não for número
  const regex = /^(11|12|13|14|15|16|17|18|19|21|22|24|27|28|31|32|33|34|35|37|38|41|42|43|44|45|46|47|48|49|51|53|54|55|61|62|63|64|65|66|67|71|73|74|75|77|79|81|82|83|84|85|86|87|88|89|91|92|93|94|95|96|97|98|99)9\d{8}$/;
  return regex.test(numeroLimpo);
}

// Cadastro
app.post('/register', async (req, res) => {
  let { nome, numero, email, senha } = req.body;

  console.log('📨 Número recebido:', numero);

  numero = String(numero).replace(/\D/g, ''); // Limpa número

  if (!nome || nome.trim().split(' ').length < 2 || contemPalavraProibida(nome)) {
    return res.redirect('/cadastro?erro=nome');
  }

  if (!validarTelefone(numero)) {
    return res.redirect('/cadastro?erro=numero');
  }

  const senhaValida = senha.length >= 8 && /[a-zA-Z]/.test(senha);
  if (!senhaValida) {
    return res.redirect('/cadastro?erro=senha');
  }

  try {
    const emailSnap = await db.collection('users').where('email', '==', email).get();
    if (!emailSnap.empty) return res.redirect('/cadastro?erro=email');

    const numeroSnap = await db.collection('users').where('numero', '==', numero).get();
    if (!numeroSnap.empty) return res.redirect('/cadastro?erro=numero');

    await db.collection('users').add({
      nome: nome.trim(),
      numero: numero,
      email: email,
      senha: senha,
      criadoEm: new Date()
    });

    console.log('✅ Usuário cadastrado:', email);
    res.redirect('/login?sucesso=1');

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    res.redirect('/cadastro?erro=server');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const snapshot = await db.collection('users')
      .where('email', '==', email)
      .where('senha', '==', senha)
      .get();

    if (snapshot.empty) {
      console.log('❌ Falha no login:', email);
      return res.redirect('/login?erro=1');
    }

    console.log('✅ Login bem-sucedido:', email);
    res.redirect('/ativar');

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.send('Erro no login');
  }
});

// Inicia servidor
app.listen(8080, () => console.log('Servidor rodando em http://localhost:8080'));
