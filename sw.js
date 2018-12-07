//Cache names
const staticCacheName = 'reviewAppCache';
const dynamicCacheName = 'reviewAppDynamic'
const imgsCache = 'reviewAppImgsCache';
const allCaches = [staticCacheName, imgsCache];

//Cache assets immediately the page loads
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(staticCacheName).then(cache => {
			return cache.addAll([
				'/',
				'/index.html',
				'/css/styles.css',
				'/js/main.js',
				'/js/restaurant_info.js',
				'/restaurant.html',
				'/restaurant.html?id=1',
				'/restaurant.html?id=2',
				'/restaurant.html?id=3',
				'/restaurant.html?id=4',
				'/restaurant.html?id=5',
				'/restaurant.html?id=6',
				'/restaurant.html?id=7',
				'/restaurant.html?id=8',
				'/restaurant.html?id=9',
				'/restaurant.html?id=10',

			]);
		})
	);
});

//Delete old cache when new cache comes up
self.addEventListener('activate', event => {
	event.waitUntil(caches.keys().then(cacheNames => {
		return Promise.all(cacheNames.filter(cacheName => {
			return cacheName.startsWith('reviewApp') && !allCaches.includes(cacheName);
		}).map(cacheName => {
			return caches['delete'](cacheName);
		}));
	})); 
});

//Respond with assets in case of request
self.addEventListener('fetch', event => {
	let requestUrl = new URL(event.request.url);
	if((requestUrl.origin === location.origin) && (requestUrl.pathname === '/')){
		event.respondWith(caches.match('/index.html'));
		return;
	}
	event.respondWith(
		caches.match(event.request).then(cacheResponse => {
			return cacheResponse || fetch(event.request).then(networkResponse => {
				return caches.open(dynamicCacheName).then(cache => {
					cache.put(event.request, networkResponse.clone());
					return networkResponse;
				});
			});
		})
	);	
});