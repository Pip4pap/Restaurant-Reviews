//Cache names
const staticCacheName = 'reviewAppCache';
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
				'/data/restaurants.json',
				'/js/dbhelper.js',
				'/js/main.js',
				'/js/restaurant_info.js',
				'restaurant.html'
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
	if(requestUrl.origin === location.origin){
		if(requestUrl.pathname === '/'){
			event.respondWith(caches.match('/index.html'));
			return;
		}
		if(requestUrl.pathname.startsWith('/img/')){
			event.respondWith(servePhoto(event.request));
			return;
		}
	}
	event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request);
		})
	);
});

const servePhoto = request => {
	let storageUrl = request.url.replace(/[0-9]\.jpg$/, '');
	return caches.open(imgsCache).then(cache => {
		return cache.match(storageUrl).then(response => {
			if(response) return response;

			return fetch(request).then(networkResponse => {
				cache.put(storageUrl, networkResponse.clone());
				return networkResponse;
			});
		});
	});
} 


























/*//Functions
function fetchFromNetworkAndCache(e) {
  if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;
  return fetch(e.request).then(res => {
    // Foreign requests may be res.type === 'opaque' and missing a url
    if (!res.url) return res;
    // Regardless, don't cache other origin's assets
    if (new URL(res.url).origin !== location.origin) return res;
    return caches.open(staticCacheName).then(cache => {
      // TODO: figure out if the content is new and therefore the page needs a reload.
      cache.put(e.request, res.clone());
      return res;
    });
  }).catch(err => console.error(e.request.url, err));
}

function handleNoCacheMatch(e) {
  return fetchFromNetworkAndCache(e);
}*/