import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      defaultImport: 'component',  // 默认 import 就是 Vue 组件
    }),
    codeInspectorPlugin({
      bundler: 'vite',
      behavior: {
        locate: false,
        copy: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
