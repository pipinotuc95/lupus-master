const PREFIX='lupus-master-'+encodeURIComponent(new URL('.',self.location).pathname)+'-shell-';
const CACHE=PREFIX+'github-pages-v1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./engine.js','./roles.js','./audio.js','./storage.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./boat-horn.mp3'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(r=>r.ok?r:caches.match('./index.html')).catch(()=>caches.match('./index.html')));return}
 if(ASSETS.some(p=>new URL(p,self.location).href===url.href))event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request).then(hit=>hit||fetch(event.request))));
});
self.addEventListener('message',event=>{if(event.data==='VERIFY_OFFLINE')event.waitUntil(caches.open(CACHE).then(async cache=>{const ok=(await Promise.all(ASSETS.map(p=>cache.match(p)))).every(Boolean);event.ports[0]?.postMessage({ready:ok,version:CACHE})}))});
