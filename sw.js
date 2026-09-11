// Recordá bumpear esta versión en cada deploy
const CACHE_NAME = 'mandalas-v16';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  const isHTML = event.request.mode === 'navigate' ||
                 (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTML){
    // Red primero para el documento: así los cambios llegan sin esperar a que expire la caché
    event.respondWith(
      fetch(event.request).then(function(response){
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        return response;
      }).catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request).then(function(response){
        if (response && response.status === 200 && event.request.method === 'GET'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        }
        return response;
      }).catch(function(){
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
