const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Banco de dados em memória para as chaves e usuários
let chavesValidas = {};
let usuariosCadastrados = {};
let filaDeComandos = [];

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// 🛠️ NOVA ROTA: O site pede para gerar chaves e o servidor cria de forma segura
app.post('/admin-gerar-chaves', (req, res) => {
    const { tokenAdmin, quantidade } = req.body;
    
    // Senha Master de Administrador para ninguém roubar chaves do seu site
    if (tokenAdmin !== "DLUXO_ADMIN_123") {
        return res.json({ sucesso: false, mensagem: "Não autorizado!" });
    }

    let chavesGeradas = [];
    const qtd = parseInt(quantidade) || 5;

    for (let i = 0; i < qtd; i++) {
        const novaKey = "DLUXO-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        chavesValidas[novaKey] = true;
        chavesGeradas.push(novaKey);
    }

    res.json({ sucesso: true, chaves: chavesGeradas });
});

app.post('/ativar-e-gerar-login', (req, res) => {
    const key = req.body.key;
    if (!chavesValidas[key]) return res.json({ sucesso: false, mensagem: "Key inválida ou já usada!" });
    
    const usuarioGerado = "dluxo_" + crypto.randomBytes(2).toString('hex');
    const senhaGerada = crypto.randomBytes(3).toString('hex');
    
    usuariosCadastrados[usuarioGerado] = { senha: senhaGerada, dias: 30 };
    delete chavesValidas[key]; // Queima a chave usada
    res.json({ sucesso: true, usuario: usuarioGerado, senha: senhaGerada });
});

app.post('/login-usuario', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuariosCadastrados[usuario] && usuariosCadastrados[usuario].senha === senha) {
        res.json({ sucesso: true, dias: usuariosCadastrados[usuario].dias });
    } else {
        res.json({ sucesso: false, mensagem: "Usuário ou senha inválidos!" });
    }
});

app.post('/enviar-ordem', (req, res) => {
    filaDeComandos.push({ acao: req.body.acao });
    res.json({ enviado: true });
});

app.get('/pegar-ordem', (req, res) => {
    if (filaDeComandos.length > 0) {
        res.json(filaDeComandos.shift());
    } else {
        res.json({ acao: null });
    }
});

app.listen(port, () => {
    console.log(`Servidor Dluxo ativo na porta: ${port}`);
});
