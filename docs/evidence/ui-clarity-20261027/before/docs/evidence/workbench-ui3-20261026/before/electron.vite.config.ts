import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'import-preparation': resolve(
            __dirname,
            'src/main/services/library/import-preparation.ts',
          ),
          'library-import': resolve(__dirname, 'src/main/services/library/library-import.ts'),
          practice: resolve(__dirname, 'src/main/services/practice/practice.ts'),
          backup: resolve(__dirname, 'src/main/services/backup/backup.ts'),
          'restore-files': resolve(__dirname, 'src/main/services/backup/restore-files.ts'),
        },
      },
    },
  },
  preload: {
    // 沙箱预加载不能在运行时加载任意 Node 模块，依赖需打入单一文件。
    build: { externalizeDeps: false },
  },
  renderer: {
    plugins: [
      react(),
      {
        name: 'development-csp',
        apply: 'serve',
        // 热更新需要内联引导脚本与本机连接；生产构建继续使用 HTML 中的严格策略。
        transformIndexHtml: (html) =>
          html
            .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
            .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
            .replace("connect-src 'none'", "connect-src 'self' ws://127.0.0.1:*"),
      },
    ],
    server: { host: '127.0.0.1' },
  },
})
