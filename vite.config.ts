import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  root: './playground',
  plugins: [vue()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [NodeModulesPolyfillPlugin()]
    }
  }
})
