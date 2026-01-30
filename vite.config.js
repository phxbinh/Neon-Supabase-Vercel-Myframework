/*
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
*/
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',  // mặc định là '/', nhưng tốt hơn nên explicit
  build: {
    outDir: 'dist',         // client build vào đây
    emptyOutDir: true,
    sourcemap: true,        // giúp debug crash trên Vercel
    rollupOptions: {
      // Nếu có external deps không cần bundle (ví dụ node builtins)
      external: [], // thêm nếu cần
    },
  },
  ssr: {                        // quan trọng cho SSR custom
    noExternal: ['@neondatabase/serverless', '../framework/**'], // tránh external Neon nếu nó gây lỗi
    target: 'node',             // build cho Node.js (Vercel dùng Node)
  },
  server: {
    open: true,
    port: 5173,               // optional, nhưng rõ ràng hơn
  },
});