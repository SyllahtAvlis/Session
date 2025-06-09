const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const userController = require('./controllers/userController');
const app = express();

// Configura o EJS como mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para parsing do body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Configurar o middleware de sessão
app.use(session({
    secret: 'ChaveSuperSecretaParaLogin', // Mantenha isso em uma variável de ambiente em produção
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000, // 1 hora
        httpOnly: true,
        secure: false // Defina como true em produção com HTTPS
    }
}));

// Servir arquivos estáticos (CSS para estilização)
app.use(express.static(path.join(__dirname, 'public')));

// Simulação de um banco de dados de usuários (substitua por seu banco de dados real)
const users = [
    { id: 1, username: 'aluno', password: 'Senha1234', role: 'comum'}, // Senha 'senha1' hasheada
    { id: 2, username: 'admin', password: 'Senha4321', role: 'admin'}  // Senha 'senha2' hasheada
];

// Middleware para checar se é ADM

function requireAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    } else {
        return res.status(403).send('Acesso negado. Permissão insuficiente.')
    }
}

// Middleware para verificar se o usuário está logado
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Rota para exibir a página de login
app.get('/login', (req, res) => {
    if (req.session.userId) {
        res.render('dashboard', { username: req.session.username });
    } else {
        res.render('login');
    }
});

// Rota para processar o envio do formulário de login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);

    // console.log('Nome de usuário recebido:', username); // Verifique o que está chegando do formulário
    // console.log('Usuário encontrado no array:', user);

    if (user) {
        const passwordMatch = user.password
        if (passwordMatch) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            return res.redirect('/dashboard');
        } else {
            return res.render('login', { error: 'Senha incorreta' });
        }
    } else {
        return res.render('login', { error: 'Usuário não encontrado' });
    }
});

// Rota para a página de dashboard (protegida)
app.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { username: req.session.username });
});

// Rota para logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir a sessão:', err);
            return res.status(500).send('Erro ao fazer logout');
        }
        res.redirect('/login');
    });
});

// Rotas
app.get('/', requireLogin, userController.getAllUsers);
app.get('/add', requireLogin, requireAdmin, (req, res) => res.render('add'));
app.post('/add', requireLogin, requireAdmin, userController.addUser);
app.get('/edit/:id', requireLogin, requireAdmin, userController.getUserById);
app.post('/edit/:id', requireLogin, requireAdmin, userController.updateUser);
app.get('/dell/:id', requireLogin, requireAdmin, userController.getdeleteByUser);
app.post('/dell/:id', requireLogin, requireAdmin, userController.deleteUser);

// Iniciar o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
