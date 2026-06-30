const CACHE='body-tracker-v4.0.0-20260630-4';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon.svg'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE && key.startsWith('body-tracker-')).map(key=>caches.delete(key)))) .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      if(new URL(event.request.url).origin===self.location.origin){
        caches.open(CACHE).then(cache=>cache.put(event.request, copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
  );
});
