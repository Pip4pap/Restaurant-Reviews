importScripts('/js/idb.js');

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

//Populate IDB with restaurant json
/******************Create Indexed DB******************/
const dbPromise = idb.open('restaurantDB', 1, upgradeDB => {
  switch(upgradeDB.oldVersion){
    case 0:
      upgradeDB.createObjectStore('restaurants');
  }
});

const idbKeyVal = {
  get(key){
    return dbPromise.then(db => {
      return db
        .transaction('restaurants')
        .objectStore('restaurants')
        .get(key);
    });
  },
  set(key, val){
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').put(val, key);
      return tx.complete;
    });
  }
};

fetch('http://localhost:1337/restaurants')
	.then(response => response.json())
	.then(json => {
	  idbKeyVal.set('restaurants', json);
	  return json;
	});

//Respond with assets in case of request
self.addEventListener('fetch', event => {
	let requestUrl = new URL(event.request.url);
	if((requestUrl.origin === location.origin) && (requestUrl.pathname === '/')){
		event.respondWith(caches.match('/index.html'));
		return;
	}
	if(requestUrl.port === '1337'){
		/*if(event.request.method !== 'GET'){
			console.log('Filtering out non-GET method');
			return;
		}*/
		event.respondWith(idbResponse(event.request));
	}
	else{
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
	}
	
});

// //Respond with IDB json
const idbResponse = request => {
	if(navigator.onLine){
		return idbKeyVal.get('restaurants')
		.then(restaurants => {
			if(restaurants.length){ //If IDB is populated with restaurants, return them
				return restaurants;
			}
			return fetch('http://localhost:1337/restaurants')	//Else, fetch from network, store and respond
			.then(response => response.json())
			.then(json => {
				idbKeyVal.set('restaurants', json);
				return json;
			})
		})
		.then(response => new Response(JSON.stringify(response)))
		.catch(error => console.log('Bad request made'));
	} else {
		return idbKeyVal.get('restaurants')
		/*.then(return (restaurants))*/
		.then(response => new Response(JSON.stringify(response)))
		.catch(error => console.log('Bad request made'));
	}
}