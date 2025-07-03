// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // Increase warning limit for AI models
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        content: resolve(__dirname, 'src/js/content.js'),
        background: resolve(__dirname, 'src/js/background.js'),
      },
      output: {
        // Set predictable filenames for entry JS files
        entryFileNames: 'js/[name].js',
        // Set predictable filenames for assets like CSS
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/style.css';
          }
          return 'assets/[name].[ext]';
        },
        format: 'es', // Ensure ES modules format
        // Manual chunking to separate AI library
        manualChunks: (id) => {
          if (id.includes('@xenova/transformers')) {
            return 'ai-lib';
          }
          if (id.includes('onnxruntime-web')) {
            return 'ai-runtime';
          }
        },
      },
      external: [],
    },
    target: 'es2020', // Support for modern JavaScript features
  },
  define: {
    global: 'globalThis', // Fix for some libraries that expect global
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'icons',
          dest: '.'
        },
        {
          src: 'src/popup.html',
          dest: '.'
        }
      ]
    })
  ],
});