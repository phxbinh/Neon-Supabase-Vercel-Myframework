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

export default defineConfig(({ command }) => {
  const isSSR = command === 'build' && process.argv.includes('--ssr');

  return {
    build: {
      outDir: isSSR ? 'dist/server' : 'dist/client',
      emptyOutDir: true,
      ssr: isSSR ? 'src/entry-server.js' : false,  // entry server mới
      rollupOptions: {
        input: isSSR ? undefined : 'index.html',  // client giữ nguyên
      },
    },
    server: {
      open: true,
    },
  };
});