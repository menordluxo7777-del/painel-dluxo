const express = require('express');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline'); // Biblioteca nativa para ler o que você digita no terminal
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
let chavesValidas = {};
let usuariosCadastrados = {};
let filaDeComandos = [];

const DISCORD_WEBHOOK_URL = 'COLE_SEU_WEBHOOK_DO_DISCORD_AQUI';

// Função profissional para gerar chaves sem derrubar o servidor
function gerarChavesDluxo(quantidade) {
    console.log(`\n[ADMIN] Gerando +${quantidade} chaves de ativação...`);
    console.log("=======================================");
    for (let i = 0; i < quantidade; i++) {
        const novaKey = "DLUXO-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        chavesValidas[novaKey] = true;
        console.log(`> Key: ${novaKey}`);
    }
    console.log("=======================================\n");
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/ativar-e-gerar-login', (req, res) => {
    const key = req.body.key;
    if (!chavesValidas[key]) return res.json({ sucesso: false, mensagem: "Key inválida!" });
    const usuarioGerado = "dluxo_" + crypto.randomBytes(2).toString('hex');
    const senhaGerada = crypto.randomBytes(3).toString('hex');
    usuariosCadastrados[usuarioGerado] = { senha: senhaGerada, dias: 30 };
    delete chavesValidas[key];
    res.json({ sucesso: true, usuario: usuarioGerado, senha: senhaGerada });
});

app.post('/login-usuario', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuariosCadastrados[usuario] && usuariosCadastrados[usuario].senha === senha) {
        res.json({ sucesso: true, dias: usuariosCadastrados[usuario].dias });
    } else {
        res.json({ sucesso: false, mensagem: "Incorreto!" });
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

app.post('/enviar-feedback', async (req, res) => {
    const { usuario, mensagem } = req.body;
    if (!mensagem) return res.json({ sucesso: false, mensagem: "Vazia!" });
    if (DISCORD_WEBHOOK_URL === 'COLE_SEU_WEBHOOK_DO_DISCORD_AQUI') {
        console.log(`[Feedback de @${usuario}]: ${mensagem}`);
        return res.json({ sucesso: true });
    }
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "Dluxo VIP - Feedback",
                content: `📩 **Novo Feedback!**\n**Usuário:** \`@${usuario}\`\n**Mensagem:** ${mensagem}`
            })
        });
        res.json({ sucesso: true });
    } catch (error) { res.json({ sucesso: false }); }
});

// 🛠️ MONITOR DE COMANDOS DO TERMINAL (Para você digitar na janela preta)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (input) => {
    const partes = input.trim().split(' ');
    if (partes[0] === '/gerarkey') {
        const qtd = parseInt(partes[1]) || 5; // Se você não digitar o número, gera 5 por padrão
        gerarChavesDluxo(qtd);
    } else {
        console.log("[Sistema] Comando não reconhecido. Use: /gerarkey [quantidade]");
    }
});

app.listen(port, () => {
    console.log(`Servidor Dluxo Cloud ativo na porta: ${port}`);
    console.log("Dica: Digite /gerarkey [numero] aqui a qualquer momento para criar mais chaves!");
    gerarChavesDluxo(5);
});

