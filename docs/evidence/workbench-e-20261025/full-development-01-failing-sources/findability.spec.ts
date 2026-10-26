import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { ListRequest } from '../../src/shared/contracts/library-desktop'
import { expect, launchApplication, openPage, test } from './helpers'

function bank(topic = 'find-a', metadata = false, archive = false) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${topic === 'find-a' ? 'A 找题专题' : 'B 独立专题'}\n---\n\n` +
    Array.from({ length: topic === 'find-a' ? 48 : 3 }, (_, index) => {
      const number = index + 1
      if (archive && number === 1) return ''
      const tag = topic === 'find-b' ? '仅B专题' : number === 1 ? '归档独有' : 'ARM Cortex'
      return (
        `## q-${String(number).padStart(2, '0')} | 保留位置问题 ${number}\n\n` +
        `标签：共同, ${tag}, 检索标签${String(number).padStart(2, '0')}${number === 45 ? ', 仅后页标签' : ''}${metadata ? ', 新增候选' : ''}\n难度：基础\n\n` +
        `### 题目\n\n题干 ${number}。\n\n` +
        (number === 21 ? '阅读位置验证段落，保持题目和答案的阅读上下文。\n\n'.repeat(40) : '') +
        `### 参考答案\n\nFIND-ANSWER-${topic}-${number}\n\n` +
        (number === 21 ? '长答案阅读段落，用于切页后准确恢复位置。\n\n'.repeat(40) : '')
      )
    }).join('')
  )
}
async function importFiles(application: ElectronApplication, page: Page, files: string[]) {
  await openPage(page, '题库')
  await application.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
  }, files)
  await page.getByRole('button', { name: '导入题库', exact: true }).click()
  await page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
  await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
}
async function prepare(directory: string, project: string) {
  const sources = join(directory, '中文 题库')
  await mkdir(sources)
  const file = join(sources, 'A.md')
  const other = join(sources, 'B.md')
  await writeFile(file, bank())
  await writeFile(other, bank('find-b'))
  const instance = await launchApplication(directory, project, '题库')
  await instance.application.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.setSize(1280, 820)
  })
  await importFiles(instance.application, instance.page, [file, other])
  return { ...instance, file }
}
async function list(page: Page, changes: Partial<ListRequest> = {}) {
  const result = await page.evaluate(
    (request) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
    { topicId: 'find-a', archived: false, page: 1, ...changes },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
async function current(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
async function capture(application: ElectronApplication, info: TestInfo, name: string) {
  const png = await application.evaluate(async ({ BrowserWindow }) =>
    (await BrowserWindow.getAllWindows()[0]!.capturePage()).toPNG().toString('base64'),
  )
  await info.attach(name, { body: Buffer.from(png, 'base64'), contentType: 'image/png' })
}
async function secondPage(page: Page) {
  await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
  await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
}

test('找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await secondPage(page)
    await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
    await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
    await page.getByRole('region', { name: '参考答案', exact: true }).scrollIntoViewIfNeeded()
    const before = await page.evaluate(() => Reflect.get(globalThis, 'scrollY') as number)
    expect(before).toBeGreaterThan(500)
    await openPage(page, '设置与数据')
    expect(await page.content()).not.toContain('FIND-ANSWER-find-a-21')
    expect(await page.locator('body').ariaSnapshot()).not.toContain('FIND-ANSWER-find-a-21')
    await openPage(page, '题库')
    await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
    await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
    await expect(page.getByLabel('专题', { exact: true })).toHaveValue('find-a')
    await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
    await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
      'FIND-ANSWER-find-a-21',
    )
    await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(before)
    await capture(application, info, 'library-reading-restored.png')
  } finally {
    await application.close()
  }
})

test('找题：标签候选跨分页、独立于筛选、限定专题，支持鼠标/键盘/无匹配/清除', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    const first = await list(page)
    expect(first.tagOptions).toContain('仅后页标签')
    expect(first.tagOptions).not.toContain('仅B专题')
    expect(new Set(first.tagOptions).size).toBe(first.tagOptions.length)
    await page.getByLabel('专题', { exact: true }).selectOption('find-a')
    const picker = page.getByRole('combobox', { name: '题库标签', exact: true })
    await picker.fill('arm')
    await expect(page.getByRole('option', { name: 'ARM Cortex', exact: true })).toBeVisible()
    await picker.press('ArrowDown')
    await picker.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 })
    await expect(picker).toHaveValue('arm')
    await expect(picker).toHaveAttribute('aria-expanded', 'true')
    await picker.press('Enter')
    await expect(picker).toHaveValue('ARM Cortex')
    await expect(picker).toHaveAttribute('aria-expanded', 'false')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 47 题', { exact: true })).toBeVisible()
    expect(
      (
        await list(page, {
          filters: {
            query: '无结果',
            tag: null,
            difficulty: null,
            mastery: 'all',
            favoritesOnly: false,
          },
        })
      ).tagOptions,
    ).toEqual(first.tagOptions)
    await picker.fill('仅后页')
    await page.getByRole('option', { name: '仅后页标签', exact: true }).click()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await picker.fill('不存在的标签')
    await expect(page.getByText('暂无匹配标签；仍可按填写的完整标签筛选。')).toBeVisible()
    await picker.press('Escape')
    await expect(picker).toHaveAttribute('aria-expanded', 'false')
    await page.getByRole('button', { name: '题库标签清除', exact: true }).click()
    await expect(picker).toHaveValue('')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
    expect(await current(page)).toBeNull()
    await picker.click()
    expect(first.tagOptions.length).toBeGreaterThan(50)
    await expect(
      page.getByRole('listbox', { name: '题库标签候选' }).getByRole('option'),
    ).toHaveCount(50)
    await expect(page.getByText(/共 52 个匹配标签，显示前 50 个/)).toBeVisible()
    await capture(application, info, 'tag-candidates.png')
  } finally {
    await application.close()
  }
})

test('找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await page.getByLabel('专题', { exact: true }).selectOption('find-a')
    await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
      const control = {
        held: false,
        finished: false,
        release: undefined as (() => void) | undefined,
      }
      Reflect.set(globalThis, 'findabilitySlowRead', control)
      ipcMain.removeHandler('library:list-questions')
      ipcMain.handle('library:list-questions', async (event, request) => {
        const result = await original(event, request)
        if (request.topicId === 'find-a' && request.filters?.query === '迟到' && !control.held) {
          control.held = true
          await new Promise<void>((resolve) => {
            control.release = resolve
          })
          control.finished = true
        }
        return result
      })
    })
    await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('迟到')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').held))
      .toBe(true)
    await openPage(page, '设置与数据')
    await openPage(page, '题库')
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
    await expect(page.getByRole('heading', { name: '保留位置问题 1', exact: true })).toBeVisible()
    await application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').release())
    await expect
      .poll(() =>
        application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').finished),
      )
      .toBe(true)
    await page.evaluate(
      () =>
        new Promise((done) => {
          const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (
            callback: () => void,
          ) => void
          frame(() => frame(() => done(null)))
        }),
    )
    await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '保留位置问题 1', exact: true })).toBeVisible()
  } finally {
    await application
      .evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead')?.release?.())
      .catch(() => {})
    await application.close()
  }
})

test('找题：导入元数据使候选缓存失效，归档范围隔离，清除旧题选择', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  try {
    expect((await list(page)).tagOptions).not.toContain('新增候选')
    await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
    await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
    await writeFile(file, bank('find-a', true, true))
    await importFiles(application, page, [file])
    const active = await list(page)
    expect(active.total).toBe(47)
    expect(active.tagOptions).toContain('新增候选')
    expect(active.tagOptions).not.toContain('归档独有')
    const archived = await list(page, { archived: true })
    expect(archived.total).toBe(1)
    expect(archived.tagOptions).toContain('归档独有')
    expect(archived.tagOptions).not.toContain('新增候选')
    expect(await page.getByRole('region', { name: '参考答案', exact: true }).count()).toBe(0)
    expect(await page.getByRole('article', { name: '题目内容', exact: true }).count()).toBe(0)
  } finally {
    await application.close()
  }
})

test('找题：返回后读取失败保留条件和页码，重试仍查询原范围', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await secondPage(page)
    await openPage(page, '设置与数据')
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
      let fail = true
      ipcMain.removeHandler('library:list-questions')
      ipcMain.handle('library:list-questions', async (event, request) => {
        if (request.topicId === 'find-a' && fail) {
          fail = false
          return {
            ok: false,
            error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟返回读取失败' },
          }
        }
        return original(event, request)
      })
    })
    await openPage(page, '题库')
    await expect(page.getByRole('alert')).toContainText('定向模拟返回读取失败')
    await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
    await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
    await page.getByRole('button', { name: '重新读取题库', exact: true }).click()
    await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
    await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
    await expect(page.getByRole('alert')).toHaveCount(0)
  } finally {
    await application.close()
  }
})

test('找题：隐藏期间的收藏变化返回时重读，移除不再匹配的详情', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await page.getByRole('checkbox', { name: '题库只看收藏', exact: true }).check()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
    await openPage(page, '学习记录')
    await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await openPage(page, '题库')
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: '题库只看收藏', exact: true })).toBeChecked()
    await expect(page.getByRole('article', { name: '题目内容', exact: true })).toHaveCount(0)
  } finally {
    await application.close()
  }
})

test('找题：首页快捷条件不替换旧轮，明确开始/无匹配/继续保留原契约', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await page.getByRole('button', { name: /A 找题专题.*q-04/ }).click()
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('find-a')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('10')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    for (const rating of ['不会', '不熟', '掌握']) {
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await page.getByRole('button', { name: rating, exact: true }).click()
    }
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    const original = await current(page)
    expect(original?.session.position).toBe(3)
    await page.getByLabel('练习模式', { exact: true }).selectOption('random')
    for (const label of ['练不会', '练不熟', '练收藏']) {
      await page.getByRole('button', { name: label, exact: true }).click()
      await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
      expect(await current(page)).toEqual(original)
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(page.getByLabel('练习模式', { exact: true })).toHaveValue('random')
      await expect(page.getByLabel('本轮题数', { exact: true })).toHaveValue('10')
    }
    await page.getByLabel('练习专题', { exact: true }).selectOption('find-b')
    await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }),
    ).toBeDisabled()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    const resume = page.getByRole('region', { name: '继续上次练习', exact: true })
    await expect(resume).toContainText('A 找题专题')
    await expect(resume).toContainText('第 4 / 10 题')
    await capture(application, info, 'home-resume-priority.png')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    expect(await current(page)).toEqual(original)
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 4 / 10')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await page.getByLabel('练习专题', { exact: true }).selectOption('find-a')
    await page.getByRole('button', { name: '练不会', exact: true }).click()
    await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
    const replacement = await current(page)
    expect(replacement?.session.sessionId).not.toBe(original?.session.sessionId)
    expect(replacement?.session.filters?.mastery).toBe('不会')
    expect(replacement?.item?.questionId).toBe('q-01')
    expect(replacement?.item?.revealed).toBe(false)
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toHaveCount(0)
  } finally {
    await application.close()
  }
})
