// sw.js — 최소한의 오프라인 셸 캐싱
// 실제 API 응답(네이버 프록시, 업종전망 등)은 캐싱하지 않고 항상 네트워크로 감.
// 앱 셸(index.html, 아이콘 등)은 "네트워크 우선, 실패하면 캐시" 방식으로 바꿈
// (예전엔 캐시 우선이라, index.html을 새로 배포해도 브라우저가 예전 캐시를
// 계속 보여주는 문제가 있었음 — 이 앱은 자주 업데이트되니 신선도가 더 중요함).

const CACHE_NAME = 'moonhoesa-shell-v2';
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

  // 앱 셸 파일: 네트워크 우선(최신 버전 바로 반영), 오프라인일 때만 캐시로 대체
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
