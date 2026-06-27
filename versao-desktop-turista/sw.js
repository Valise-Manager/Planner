// Service Worker — Valise Manager
// Objetivo: permitir "Adicionar à Tela de Início" (Android/iOS) e
// uso básico offline, fazendo cache do "app shell" (HTML/CSS/JS locais).
// Funciona em todos os navegadores modernos, incluindo Safari/iOS 11.3+.

const CACHE_NAME = 'valise-manager-v1';

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
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(CORE_ASSETS);
            await Promise.all(
                OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => {}))
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Só tratamos requisições GET; o resto (ex.: POST) segue direto pela rede.
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request)
                .then((response) => {
                    // Guarda uma cópia no cache para a próxima vez (estratégia
                    // "cache-first com atualização em segundo plano").
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Sem rede e sem cache para este recurso específico:
                    // se for navegação de página, devolve o app shell salvo.
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});
