// sw.js — 최소한의 오프라인 셸 캐싱
// 실제 API 응답(네이버 프록시, 업종전망 등)은 캐싱하지 않고 항상 네트워크로 감.
// 앱 셸(index.html, 아이콘 등)만 캐싱해서 오프라인에서도 빈 화면 대신 UI는 뜨게 함.

const CACHE_NAME = 'moonhoesa-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API 호출(naver-proxy, vercel opinion 등)은 절대 캐싱하지 않고 그냥 통과
  const isApiCall =
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('vercel.app');

  if (isApiCall) {
    return; // 브라우저 기본 네트워크 요청 그대로 진행
  }

  // 앱 셸 파일만 cache-first, 나머지는 network-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
