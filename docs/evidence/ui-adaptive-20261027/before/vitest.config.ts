module.exports = {
  test: {
    // 恢复副本可能带有 tests/unit 路径，必须按仓库根目录限定发现范围。
    include: ['tests/unit/**/*.test.ts'],
    // 并行启动 worker 在资源受限时会超时，文件被跳过而总数仍显示通过；串行保证全部文件实际执行。
    fileParallelism: false,
  },
} satisfies import('vitest/config').ViteUserConfig
