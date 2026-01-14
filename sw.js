
const CACHE_NAME = 'wife-clock-v1';
// 暂时不写复杂的缓存逻辑，只为了满足 PWA 安装条件
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // 保持网络透传
});
