// sw.js — Valise Manager (Desktop)
// Estratégia: Network First para o HTML principal (garante que você sempre
// veja a versão mais recente publicada no GitHub), Stale-While-Revalidate
// para os demais assets estáticos (CSS/JS/fontes/ícones).
//
// IMPORTANTE: sempre que fizer deploy de alterações (mesmo que não toquem
// neste ficheiro), suba o número da versão abaixo. É essa mudança de byte
// no sw.js que faz o navegador detetar uma atualização, instalar o novo
// worker e limpar o cache antigo. Sem isto, o navegador pode continuar a
// servir a versão anterior indefinidamente.
const CACHE_VERSION = 'v5';
const CACHE_NAME = `valise-manager-${CACHE_VERSION}`;

// Arquivos locais essenciais — se algum não puder ser cacheado, a instalação falha,
// então mantemos essa lista restrita ao que sabemos que sempre existe.
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

// Recursos extras (logo local + bibliotecas via CDN). São "best effort":
// se algum não existir ou a rede falhar no momento da instalação, isso
// NÃO deve impedir o cache dos arquivos essenciais acima.
const OPTIONAL_ASSETS = [
    './assets/Logo M01.png',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// ── INSTALL: pré-cacheamento dos assets locais ──────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(CORE_ASSETS);
            await Promise.all(
                OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => {}))
            );
        }).then(() => self.skipWaiting())
    );
});

// ── ACTIVATE: limpeza de caches antigos ─────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: estratégia por tipo de recurso ───────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Só tratamos requisições GET; o resto (ex.: POST) segue direto pela rede.
    if (request.method !== 'GET') return;

    // HTML principal: Network First (garante versão fresca; cai para cache se offline)
    if (request.mode === 'navigate' || request.url.endsWith('.html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Demais recursos (CSS, JS, fontes, ícones): Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ── Helpers de estratégia ───────────────────────────────────────────────────

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || caches.match('./index.html');
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const networkFetch = fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    if (cached) return cached;
    return (await networkFetch) || undefined;
}
