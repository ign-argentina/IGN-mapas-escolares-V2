import { defineConfig } from 'vite'

export default defineConfig({
  base: '/mapasescolares-v2/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/fabric')) {
            return 'vendor-fabric'
          }
          if (id.includes('node_modules/lucide')) {
            return 'vendor-lucide'
          }
          if (
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/html2canvas') ||
            id.includes('node_modules/dompurify')
          ) {
            return 'vendor-export'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})