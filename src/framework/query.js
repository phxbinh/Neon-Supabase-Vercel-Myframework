// src/framework/query.js
const cache = new Map(); // key (string) → { data, status, subscribers: Set() }

export const queryClient = {
  getQueryData(key) {
    return cache.get(key)?.data;
  },

  setQueryData(key, updater) {
    const entry = cache.get(key) || { data: null, status: 'idle', subscribers: new Set() };
    entry.data = typeof updater === 'function' ? updater(entry.data) : updater;
    entry.status = 'success';
    cache.set(key, entry);
    entry.subscribers.forEach(cb => cb());
  },

  invalidateQueries(keyPrefix) {
    for (const [k, entry] of cache) {
      if (k.startsWith(keyPrefix)) {
        entry.status = 'stale';
        entry.subscribers.forEach(cb => cb());
      }
    }
  },

  subscribe(key, callback) {
    const entry = cache.get(key) || { subscribers: new Set() };
    entry.subscribers.add(callback);
    cache.set(key, entry);
    return () => entry.subscribers.delete(callback);
  },

  // Để dùng trong loader (SSR)
  prefetch(key, fetcher) {
    if (cache.has(key) && cache.get(key).status === 'success') {
      return Promise.resolve(cache.get(key).data);
    }
    return fetcher().then(data => {
      this.setQueryData(key, data);
      return data;
    });
  }
};