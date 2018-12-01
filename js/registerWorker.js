//Register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('Service Worker Registered!@#'))
    .catch(() => console.log('Failed to register Service Worker!!!'));
}