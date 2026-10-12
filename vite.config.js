import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import contentManifest from './build/contentManifestPlugin.js';

const VENDOR = {
  react: ['/node_modules/react/', '/node_modules/react-dom/', '/node_modules/react-router', '/node_modules/scheduler/'],
  editor: ['/node_modules/@codemirror/', '/node_modules/@uiw/', '/node_modules/@lezer/', '/node_modules/codemirror/', '/node_modules/style-mod/', '/node_modules/w3c-keyname/', '/node_modules/crelt/'],
  markdown: ['/node_modules/react-markdown/', '/node_modules/remark', '/node_modules/micromark', '/node_modules/mdast', '/node_modules/unified/', '/node_modules/hast', '/node_modules/prism-react-renderer/'],
};

export default defineConfig({
  plugins: [react(), contentManifest()],
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // One lazy chunk per topic: its lesson + all its questions.
          const m = id.match(/\/src\/content\/topics\/([^/]+)\//);
          if (m) return `topic-${m[1]}`;
          for (const [name, parts] of Object.entries(VENDOR)) if (parts.some((p) => id.includes(p))) return name;
          return undefined;
        },
      },
    },
  },
});
