import { writeFile, readFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, launchApplication, test } from '../../tests/e2e/helpers'

test('已提交版本：IPC错误码、拒绝跳题不写入及运行身份', async ({ testDataDirectory }, info) => {
  const source = join(testDataDirectory, 'probe.md')
  await writeFile(source, '---\nschema_version: 1\ntopic_id: review-probe\ntopic_title: 审核夹具\n---\n\n## probe-1 | 审核题\n\n标签：检查\n难度：基础\n\n### 题目\n\n独立题干\n\n### 参考答案\n\n独立答案\n')
  const { application, page } = await launchApplication(testDataDirectory, 'development')
  try {
    const identity = await application.evaluate(({ app }) => ({ appPath: app.getAppPath(), userData: app.getPath('userData'), executable: process.execPath, packaged: app.isPackaged }))
    expect(resolve(identity.appPath)).toBe(resolve('out/main'))
    expect(identity.userData).toBe(testDataDirectory)
    expect(identity.packaged).toBe(false)
    await expect(page.getByText('20261026.3-v002', { exact: false })).toBeVisible()
    await application.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }) }, source)
    const result = await page.evaluate(async () => {
      const api = (globalThis as any).desktop
      const preview = await api.library.previewImport()
      if (!preview.ok) throw new Error(JSON.stringify(preview))
      const imported = await api.library.commitImport(preview.value.token)
      if (!imported.ok) throw new Error(JSON.stringify(imported))
      const started = await api.practice.start({ requestId: crypto.randomUUID(), topicId: null, count: 'all', replace: null })
      if (!started.ok) throw new Error(JSON.stringify(started))
      const cursor = (ack: any) => ({ sessionId: ack.sessionId, position: ack.position, revision: ack.revision })
      const draft = { revision: 0, text: '' }
      const hidden = await api.practice.read({ sessionId: null })
      const nextHidden = await api.practice.navigate({ requestId: crypto.randomUUID(), cursor: cursor(started.value), draft, direction: 'next' })
      const revealed = await api.practice.reveal({ requestId: crypto.randomUUID(), cursor: cursor(started.value), draft })
      if (!revealed.ok) throw new Error(JSON.stringify(revealed))
      const before = await api.practice.read({ sessionId: null })
      const skip = await api.practice.navigate({ requestId: crypto.randomUUID(), cursor: cursor(revealed.value), draft: { revision: 1, text: '不应保存' }, direction: 'skip' })
      const after = await api.practice.read({ sessionId: null })
      return { hidden, nextHidden, before, skip, after }
    })
    expect(result.hidden.value.item).not.toHaveProperty('answer')
    expect(result.nextHidden).toMatchObject({ ok: false, error: { code: 'REVEAL_REQUIRED' } })
    expect(result.before.value.item.answer.markdown).toBe('独立答案')
    expect(result.skip).toMatchObject({ ok: false, error: { code: 'ALREADY_REVEALED' } })
    expect(result.after).toEqual(result.before)
    await info.attach('ipc-and-identity.json', { body: JSON.stringify({ identity, result }), contentType: 'application/json' })
  } finally { await application.close() }
})

test('已提交版本：恢复目录创建故障保留真实诊断', async ({ testDataDirectory }, info) => {
  const { application, page } = await launchApplication(testDataDirectory, 'development')
  try {
    const exportDirectory = await mkdtemp(join(tmpdir(), 'embedded-practice-review-export-'))
    const backupPath = join(exportDirectory, 'probe-backup.sqlite3')
    await application.evaluate(({ app, dialog }, file) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: file })
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
      dialog.showMessageBox = (async (...args: any[]) => ({ response: args.at(-1).title === '确认恢复完整备份' ? 1 : 0, checkboxChecked: false })) as any
      // 仅抑制测试进程自动重启，保留生产恢复路径和日志写入。
      app.relaunch = () => {}
    }, backupPath)
    const prepared = await page.evaluate(async () => {
      const api = (globalThis as any).desktop
      const exported = await api.backup.export()
      if (!exported.ok) throw new Error(JSON.stringify(exported))
      const preview = await api.backup.preview()
      if (!preview.ok) throw new Error(JSON.stringify(preview))
      return preview.value
    })
    expect(prepared.summary.schemaVersion).toBe(10)
    await application.evaluate(({ app }) => {
      const fs = process.getBuiltinModule('node:fs/promises')
      const path = process.getBuiltinModule('node:path')
      const original = fs.mkdir
      fs.mkdir = (async (...args: any[]) => {
        if (String(args[0]) === path.join(app.getPath('userData'), 'restore-transaction')) {
          fs.mkdir = original
          throw new Error('EPERM REVIEW_DIRECTORY_CREATE_SENTINEL')
        }
        return (original as any)(...args)
      }) as any
    })
    const exited = application.waitForEvent('close')
    const result = await page.evaluate((token) => (globalThis as any).desktop.backup.restore({ token }), prepared.token)
    expect(result).toMatchObject({ ok: false, error: { code: 'RESTORE_FAILED' } })
    await exited
    const log = await readFile(join(testDataDirectory, 'logs', 'application.log'), 'utf8')
    expect(log).toContain('EPERM REVIEW_DIRECTORY_CREATE_SENTINEL')
    expect(result.error.message).not.toContain('REVIEW_DIRECTORY_CREATE_SENTINEL')
    await info.attach('restore-log.json', { body: JSON.stringify({ result, log }), contentType: 'application/json' })
  } finally { await application.close().catch(() => {}) }
})
