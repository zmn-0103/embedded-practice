import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { expect, test } from './helpers'
import {
  alternatePng,
  captureHistory,
  historyBank,
  importHistoryFiles,
  stop,
  withHistoryDatabase,
} from './history-helpers'
import { controlRecords } from './practice-control-helpers'
import { prepareUpdates, selectUpdateQuestion, updatesBank } from './content-updates-helpers'
import { settleWorkbench } from './workbench-helpers'

test('仅图片变化仍可看两版入库图片，来源移走仍完整，不误称文字同即内容同', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareUpdates(testDataDirectory, info)
  try {
    const folder = join(testDataDirectory, '更新图片来源')
    await mkdir(join(folder, 'assets'), { recursive: true })
    const image = join(folder, 'assets/history.png'),
      file = join(folder, '图片题.md')
    const originalPng = await readFile(resolve('tests/fixtures/images/small.png'))
    await copyFile(resolve('tests/fixtures/images/small.png'), image)
    await writeFile(file, historyBank())
    await importHistoryFiles(application, page, [file])
    await writeFile(image, alternatePng)
    await importHistoryFiles(application, page, [file])
    await rename(image, join(folder, 'moved.png'))
    await rename(file, join(folder, 'moved.md'))
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const panel = await selectUpdateQuestion(page, '历史题 1')
    await panel.locator('summary').first().click()
    const question = panel.getByLabel('题干内容差异', { exact: true })
    await expect(question).toContainText('文字相同')
    await expect(question).toContainText('图片、引用或另一分区仍可能有变化')
    const images = question.getByRole('img', { name: '历史图', exact: true })
    await expect(images).toHaveCount(2)
    const imageWidths = () =>
      images.evaluateAll((elements) =>
        elements.map((element) => Reflect.get(element, 'naturalWidth')),
      )
    await expect.poll(imageWidths).toEqual([2, 3])
    const urls: string[] = await images.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('src')!),
    )
    expect(urls.every((url) => url.startsWith('practice-image://'))).toBe(true)
    const bytes = await application.evaluate(
      ({ net }, urls) =>
        Promise.all(
          urls.map(async (url) =>
            Array.from(new Uint8Array(await (await net.fetch(url)).arrayBuffer())),
          ),
        ),
      urls,
    )
    expect(Buffer.from(bytes[0]!)).toEqual(originalPng)
    expect(Buffer.from(bytes[1]!)).toEqual(alternatePng)
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toHaveCount(0)
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await captureHistory(application, page, info, 'image-differences.png')
  } finally {
    await stop(application)
  }
})

test('答案差异慢响应在改选旧版后丢弃，版本读取失败保留错误并可重试，答案单独变化可识别', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareUpdates(testDataDirectory, info)
  try {
    await writeFile(file, updatesBank(3))
    await importHistoryFiles(application, page, [file])
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('content-updates:compare')
      let held = false
      ipcMain.removeHandler('content-updates:compare')
      ipcMain.handle('content-updates:compare', async (event, input) => {
        if (!held && input.part === 'answer') {
          held = true
          await new Promise<void>((resolve) => {
            Reflect.set(globalThis, '__releaseAnswerDifference', resolve)
          })
        }
        const value = await original(event, input)
        if (input.part === 'answer') Reflect.set(globalThis, '__answerDifferenceDone', true)
        return value
      })
    })
    let panel = await selectUpdateQuestion(page)
    await panel.locator('summary').first().click()
    await expect(panel.getByLabel('题干内容差异', { exact: true })).toContainText(
      'UPDATES-BODY-3-1',
    )
    await panel.getByRole('button', { name: '查看参考答案变化', exact: true }).click()
    await expect
      .poll(() =>
        application.evaluate(() => typeof Reflect.get(globalThis, '__releaseAnswerDifference')),
      )
      .toBe('function')
    await panel.getByRole('radio', { name: '对照内容版本1', exact: true }).check()
    await application.evaluate(() => Reflect.get(globalThis, '__releaseAnswerDifference')())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__answerDifferenceDone')))
      .toBe(true)
    await settleWorkbench(page)
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toHaveCount(0)
    await expect(panel).not.toContainText('UPDATES-ANSWER')
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('content-updates:versions')
      let fail = true
      ipcMain.removeHandler('content-updates:versions')
      ipcMain.handle('content-updates:versions', (event, input) => {
        if (fail) {
          fail = false
          return { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '版本定向读取失败' } }
        }
        return original(event, input)
      })
    })
    panel = await selectUpdateQuestion(page, '组卷题 A 2')
    await panel.locator('summary').first().click()
    await expect(panel.getByRole('alert')).toContainText('版本定向读取失败')
    await panel.getByRole('button', { name: '重试读取内容版本', exact: true }).click()
    await expect(panel.getByLabel('题干内容差异', { exact: true })).toContainText('文字相同')
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toHaveCount(0)
    await panel.getByRole('button', { name: '查看参考答案变化', exact: true }).click()
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toContainText(
      'UPDATES-ANSWER-2-2',
    )
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toContainText(
      'UPDATES-ANSWER-3-2',
    )
  } finally {
    await stop(application)
  }
})

test('切到另一题后迟到的题干差异不能覆盖或泄漏旧题，首次题仅显示无更早版本', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareUpdates(testDataDirectory, info)
  try {
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('content-updates:compare')
      ipcMain.removeHandler('content-updates:compare')
      ipcMain.handle('content-updates:compare', async (event, input) => {
        if (input.questionId === 'q-1' && input.topicId === 'control-a') {
          await new Promise<void>((resolve) => {
            Reflect.set(globalThis, '__releaseQuestionDifference', resolve)
          })
          const result = await original(event, input)
          Reflect.set(globalThis, '__questionDifferenceDone', true)
          return result
        }
        return original(event, input)
      })
    })
    let panel = await selectUpdateQuestion(page)
    await panel.locator('summary').first().click()
    await expect
      .poll(() =>
        application.evaluate(() => typeof Reflect.get(globalThis, '__releaseQuestionDifference')),
      )
      .toBe('function')
    panel = await selectUpdateQuestion(page, '组卷题 A 4')
    await application.evaluate(() => Reflect.get(globalThis, '__releaseQuestionDifference')())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__questionDifferenceDone')))
      .toBe(true)
    await settleWorkbench(page)
    await panel.locator('summary').first().click()
    await expect(panel).toContainText('没有更早内容版本可对照')
    await expect(panel).not.toContainText('UPDATES-BODY-2-1')
    await expect(panel.getByLabel('题干内容差异', { exact: true })).toHaveCount(0)
  } finally {
    await stop(application)
  }
})
