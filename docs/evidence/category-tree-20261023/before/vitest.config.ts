module.exports = {
  test: {
    // 恢复副本可能带有 tests/unit 路径，必须按仓库根目录限定发现范围。
    include: ['tests/unit/**/*.test.ts'],
  },
} satisfies import('vitest/config').ViteUserConfig
