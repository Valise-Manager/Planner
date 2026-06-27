/**
 * Valise Manager — Servidor Local
 * ================================
 * Serve o app em http://localhost:3000 para que o botão
 * "Salvar Como..." abra o diálogo nativo de escolha de pasta.
 *
 * Pré-requisito: Node.js instalado (https://nodejs.org)
 *
 * Como usar:
 *   1. Coloque este arquivo na mesma pasta do index.html
 *   2. Abra o terminal nessa pasta
 *   3. Execute:  node server.js
 *   4. Acesse:   http://localhost:3000
 *   5. Para encerrar: Ctrl + C no terminal
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname; // mesma pasta do server.js

const MIME = {
    '.html' : 'text/html; charset=utf-8',
    '.css'  : 'text/css; charset=utf-8',
    '.js'   : 'application/javascript; charset=utf-8',
    '.json' : 'application/json; charset=utf-8',
    '.png'  : 'image/png',
    '.jpg'  : 'image/jpeg',
    '.jpeg' : 'image/jpeg',
    '.ico'  : 'image/x-icon',
    '.svg'  : 'image/svg+xml',
    '.webp' : 'image/webp',
    '.woff' : 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf'  : 'font/ttf',
};

const server = http.createServer((req, res) => {
    // Remove query string e decodifica caracteres especiais
    let urlPath = decodeURIComponent(req.url.split('?')[0]);

    // Redireciona raiz para index.html
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);

    // Impede acesso a arquivos fora da pasta do app (segurança básica)
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Acesso negado.');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Arquivo não encontrado: ${urlPath}`);
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Erro interno do servidor.');
            }
            return;
        }

        const ext  = path.extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('✅  Valise Manager rodando em:');
    console.log(`    👉  http://localhost:${PORT}`);
    console.log('');
    console.log('    Abra o endereço acima no Chrome ou Edge.');
    console.log('    Para encerrar o servidor: pressione Ctrl + C');
    console.log('');
});
