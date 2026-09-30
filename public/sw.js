// public/sw.js
// Simple Service Worker for Sudoku PWA
// Cache‑first for static assets, network‑first for navigation updates.

const CACHE_NAME = 'zen-sudoku-v1';
// List of assets to cache on install. Adjust paths as needed.
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Vite built assets – they are served from /assets/*
  // We'll cache everything under /assets during install via runtime caching.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches if needed.
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  // For navigation requests, try network first, fallback to cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  // For other requests, use cache‑first strategy.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Clone response and store in cache for future.
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
        return response;
      }).catch(() => {
        // Optional: fallback for failed requests (e.g., offline image placeholder)
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
