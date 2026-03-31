const CACHE_NAME = 'ty-db-v1'

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['./', './index.html'])
        })
    )
    self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return
    }
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const responseClone = response.clone()
                caches.open(CACHE_NAME).then((cache) => {
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, responseClone)
                    }
                })
                return response
            })
            .catch(() => {
                return caches.match(event.request)
            })
    )
})
