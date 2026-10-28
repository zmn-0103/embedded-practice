import { randomUUID, createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { expect, openPage, test } from './helpers'
import {
  captureHistory,
  historyBank,
  importHistoryFiles,
  stop,
  withHistoryDatabase,
} from './history-helpers'
import { a, changeSet, controlBank, controlRecords } from './practice-control-helpers'
import { endFlow, startFlow } from './practice-flow-helpers'
import { createStudyRound, exportMaterial, prepareStudy, saveNote } from './study-helpers'

test('题单主动选择三类材料，正文/代码/图片可离开来源使用，默认不含个人内容或答案', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const folder = join(testDataDirectory, 'material-source')
    await mkdir(join(folder, 'assets'), { recursive: true })
    const png = await readFile(resolve('tests/fixtures/images/small.png'))
    await writeFile(join(folder, 'assets/history.png'), png)
    const file = join(folder, '材料.md')
    await writeFile(
      file,
      historyBank().replace(
        'HISTORY-BODY-OLD-history-a-1',
        'HISTORY-BODY-OLD-history-a-1\n\n| DMA | UART |\n| --- | --- |\n| 内存 | 外设 |',
      ),
    )
    await importHistoryFiles(application, page, [file])
    const imageIdentity = { topicId: 'history-a', questionId: 'q-1' }
    await createStudyRound(page, 'OWN-独立作答\n```c\nint transfer = 1;\n```', [imageIdentity])
    expect(
      await saveNote(page, {
        ...imageIdentity,
        expectedRevision: 0,
        text: 'NOTE-完成条件\n```c\nwait_tc();\n```',
      }),
    ).toMatchObject({ ok: true })
    const setId = randomUUID()
    expect(
      await changeSet(page, {
        kind: 'save',
        setId,
        name: '导出复习题单',
        items: [imageIdentity, a(1)],
      }),
    ).toMatchObject({ ok: true })
    // 源图/源题文件移走后，导出只能依赖入库资源。
    await rename(join(folder, 'assets/history.png'), join(folder, 'moved.png'))
    await rename(file, join(folder, 'moved.md'))
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    // 前面通过真实桥接准备保存题单，重载后让页面从持久数据读取该定义。
    await page.reload()
    await expect(page.locator('.app-shell')).toBeVisible()
    await openPage(page, '题库')
    await page.locator('.question-selection-panel > summary').click()
    const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await panel.getByLabel('选用固定题单', { exact: true }).selectOption(setId)
    const exporter = panel.locator('.material-export')
    await exporter.locator('summary').click()
    await expect(exporter.getByLabel('复习材料包含内容')).toHaveValue('questions')
    for (const mode of ['questions', 'answers', 'personal'] as const) {
      const target = info.outputPath(`${mode}.md`)
      await application.evaluate(({ dialog }, filePath) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath })
      }, target)
      await exporter.getByLabel('复习材料包含内容').selectOption(mode)
      await exporter
        .getByRole('button', { name: '确认范围与内容并选择保存位置…', exact: true })
        .click()
      await expect(exporter.getByRole('status')).toContainText(target)
      const markdown = await readFile(target, 'utf8')
      expect(markdown).toContain('共2题')
      expect(markdown.indexOf('HISTORY-BODY-OLD-history-a-1')).toBeLessThan(
        markdown.indexOf('CONTROL-OLD-BODY-control-a-1'),
      )
      expect(markdown).toMatch(/\| DMA\s+\| UART/)
      expect(markdown).not.toMatch(/practice-image:|assets\/history\.png|file:\/\//)
      const resource = markdown.match(/!\[历史图\]\((review-assets-[\w-]+\/[a-f0-9]+\.png)\)/)?.[1]
      expect(resource).toBeTruthy()
      expect(await readFile(join(dirname(target), resource!))).toEqual(png)
      expect(resource).toContain(createHash('sha256').update(png).digest('hex'))
      if (mode === 'answers') {
        expect(markdown).toContain('HISTORY-ANSWER-OLD-history-a-1')
        expect(markdown).toContain('int value = 1;')
      } else expect(markdown).not.toContain('HISTORY-ANSWER-OLD')
      if (mode === 'personal') {
        expect(markdown).toContain('OWN-独立作答')
        expect(markdown).toContain('NOTE-完成条件')
        expect(markdown).toContain('wait_tc();')
        expect(markdown).toContain('当前版本尚无已结束轮次的实际作答')
        expect(markdown).toContain('并非当时笔记快照')
      } else expect(markdown).not.toMatch(/OWN-独立作答|NOTE-完成条件|wait_tc/)
    }
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await captureHistory(application, page, info, 'material-export.png')
  } finally {
    await stop(application)
  }
})

test('轮次材料固定旧版本/本轮作答，题单采用新版本且不套旧作答；归档/坏资源/取消不覆盖文件', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareStudy(testDataDirectory, info)
  try {
    const round = await createStudyRound(page, 'OWN-旧版回答', [a(1), a(2)])
    const setId = randomUUID()
    await changeSet(page, { kind: 'save', setId, name: '版本与归档', items: [a(1)] })
    await writeFile(file, controlBank('control-a', 27, true))
    await importHistoryFiles(application, page, [file])
    const target = info.outputPath('version-material.md')
    await application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, target)
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(
      await exportMaterial(page, {
        source: { kind: 'round', sessionId: round.sessionId },
        mode: 'personal',
      }),
    ).toMatchObject({ ok: true, value: { questions: 2, images: 0 } })
    const personal = await readFile(target, 'utf8')
    expect(personal).toContain('CONTROL-OLD-BODY-control-a-1')
    expect(personal).toContain('OWN-旧版回答')
    expect(personal).not.toMatch(/CONTROL-NEW|CONTROL-OLD-ANSWER/)
    expect(
      await exportMaterial(page, {
        source: { kind: 'round', sessionId: round.sessionId },
        mode: 'answers',
      }),
    ).toMatchObject({ ok: true })
    expect(await readFile(target, 'utf8')).toContain('CONTROL-OLD-ANSWER-control-a-2')
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    expect(
      await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'personal' }),
    ).toMatchObject({ ok: true })
    const current = await readFile(target, 'utf8')
    expect(current).toContain('CONTROL-NEW-BODY-control-a-1')
    expect(current).toContain('当前版本尚无已结束轮次的实际作答')
    expect(current).not.toContain('OWN-旧版回答')
    await application.evaluate(({ dialog }) => {
      dialog.showSaveDialog = async () => ({ canceled: true, filePath: '' })
    })
    expect(
      await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'questions' }),
    ).toMatchObject({ ok: false, error: { code: 'CANCELLED' } })
    expect(await readFile(target, 'utf8')).toBe(current)
    await writeFile(file, controlBank('control-a', 27, true, 1))
    await importHistoryFiles(application, page, [file])
    expect(
      await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'questions' }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(await readFile(target, 'utf8')).toBe(current)

    const folder = join(testDataDirectory, 'broken-image-source')
    await mkdir(join(folder, 'assets'), { recursive: true })
    await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/history.png'))
    const imageFile = join(folder, '图片题.md')
    await writeFile(imageFile, historyBank())
    await importHistoryFiles(application, page, [imageFile])
    const imagesSet = randomUUID()
    await changeSet(page, {
      kind: 'save',
      setId: imagesSet,
      name: '坏资源拒绝',
      items: [{ topicId: 'history-a', questionId: 'q-1' }],
    })
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec("PRAGMA ignore_check_constraints=ON; UPDATE image_resources SET bytes=x'00'"),
      false,
    )
    await application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, target)
    const filesBefore = await readdir(dirname(target))
    expect(
      await exportMaterial(page, { source: { kind: 'set', setId: imagesSet }, mode: 'questions' }),
    ).toMatchObject({ ok: false, error: { code: 'FILE_ERROR' } })
    expect(await readdir(dirname(target))).toEqual(filesBefore)
    expect(await readFile(target, 'utf8')).toBe(current)
  } finally {
    await stop(application)
  }
})

test('活动轮/超500题整批拒绝；应用数据和非Markdown目标不写入', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info, 501)
  try {
    const started = await startFlow(page, {
      requestId: randomUUID(),
      topicId: 'control-a',
      count: 'all',
      replace: null,
    })
    if (!started.ok) throw new Error(started.error.message)
    expect(
      await exportMaterial(page, {
        source: { kind: 'round', sessionId: started.value.sessionId },
        mode: 'questions',
      }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    await endFlow(page)
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(
      await exportMaterial(page, {
        source: { kind: 'round', sessionId: started.value.sessionId },
        mode: 'questions',
      }),
    ).toMatchObject({ ok: false, error: { code: 'LIMIT_EXCEEDED' } })
    const setId = randomUUID()
    await changeSet(page, { kind: 'save', setId, name: '路径保护', items: [a(1)] })
    for (const target of [
      join(testDataDirectory, 'personal-data.md'),
      info.outputPath('not-markdown.txt'),
    ]) {
      await writeFile(target, '原有内容')
      await application.evaluate(({ dialog }, filePath) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath })
      }, target)
      expect(
        await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'questions' }),
      ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
      expect(await readFile(target, 'utf8')).toBe('原有内容')
    }
    const after = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(after.practice_sessions).toEqual(before.practice_sessions)
    expect(after.practice_items).toEqual(before.practice_items)
  } finally {
    await stop(application)
  }
})
