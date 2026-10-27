import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import { expect, launchApplication, openPage, test } from './helpers'
import {
  addCategory,
  assignTopic,
  categoryChange,
  categoryList,
  openCategoryManager,
} from './category-helpers'
import { openPlans, readPlans, savePlan } from './practice-plan-helpers'
import {
  captureHistory,
  historySnapshot,
  importHistoryFiles,
  stop,
  withHistoryDatabase,
} from './history-helpers'

const board = (page: Page, title: string) =>
  page.getByRole('article', { name: `板块：${title}`, exact: true })

function bank(topic: string, title: string, count: number, omitFirst = false) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${title}\n---\n\n` +
    Array.from({ length: count }, (_, i) => i + 1)
      .filter((n) => !omitFirst || n !== 1)
      .map((n) => {
        const difficulty = (['基础', '进阶', '综合', null] as const)[(n - 1) % 4]
        return `## q-${n} | 入口题 ${n}\n\n标签：板块样本\n${difficulty ? `难度：${difficulty}\n` : ''}\n### 题目\n\nBOARD-BODY-${topic}-${n}\n\n### 参考答案\n\nBOARD-ANSWER-${topic}-${n}\n\n`
      })
      .join('')
  )
}

async function runtime(
  application: ElectronApplication,
  page: Page,
  directory: string,
  info: TestInfo,
) {
  const actual = await application.evaluate(({ app }) => ({
    executable: process.execPath,
    appPath: app.getAppPath(),
    packaged: app.isPackaged,
    userData: app.getPath('userData'),
    electron: process.versions.electron,
    node: process.versions.node,
    arguments: process.argv,
  }))
  expect(actual.userData).toBe(directory)
  expect(actual.packaged).toBe(info.project.name === 'packaged')
  expect(actual.electron).toBe('42.11.15')
  if (actual.packaged)
    expect(resolve(actual.executable)).toBe(
      resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
    )
  else {
    expect(resolve(actual.appPath)).toBe(resolve('out/main'))
    expect(actual.arguments).toContain(resolve('out/main/index.js'))
  }
  await expect(page.locator('footer')).toContainText('20261027.1-ui-clarity')
  const schema = withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())
  expect(schema).toEqual({ user_version: 10 })
  await info.attach('runtime.json', {
    body: JSON.stringify({ ...actual, schema, build: '20261027.1-ui-clarity' }, null, 2),
    contentType: 'application/json',
  })
}

async function prepare(directory: string, project: string) {
  const source = join(directory, '板块独立样本')
  await mkdir(source)
  const paths = ['board-a', 'board-b', 'board-c'].map((id) => join(source, `${id}.md`))
  await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23))
  await writeFile(paths[1]!, bank('board-b', '自定义专题', 3))
  await writeFile(paths[2]!, bank('board-c', '未归属专题', 1))
  const instance = await launchApplication(directory, project, '题库')
  try {
    await importHistoryFiles(instance.application, instance.page, paths)
    const communication = await addCategory(instance.page, '通信协议')
    const personal = await addCategory(instance.page, '我的重点')
    await addCategory(instance.page, '空分类')
    await assignTopic(instance.page, 'board-a', communication)
    await assignTopic(instance.page, 'board-b', personal)
    return { ...instance, communication, personal, paths }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}

test('板块入口：空库默认页可搜索和键盘浏览22份规划，不种分类或启动空练习', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '知识板块',
  )
  try {
    await page.reload()
    await expect(page.getByRole('link', { name: '学习总览', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await openPage(page, '知识板块')
    await expect(page.getByRole('link', { name: '知识板块', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.locator('.board-card')).toHaveCount(15)
    await runtime(application, page, testDataDirectory, info)
    const c = board(page, 'C语言')
    await expect(c.locator('.board-count')).toHaveText('0 题 · 待补题')
    await expect(c.getByRole('button', { name: '进入板块：C语言', exact: true })).toBeDisabled()
    await c.locator('summary').focus()
    await c.locator('summary').press('Enter')
    await expect(c.getByText('数据类型与表达式', { exact: true })).toBeVisible()
    await page.getByLabel('显示拓展方向', { exact: true }).check()
    await expect(page.locator('.board-card')).toHaveCount(22)
    await page.getByLabel('显示拓展方向', { exact: true }).uncheck()
    const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
    await search.fill('Linux')
    await expect(page.locator('.board-card')).toHaveCount(2)
    await search.fill('Verilog')
    await expect(board(page, 'FPGA与数字设计')).toBeVisible()
    await search.fill('不存在的规划方向')
    await expect(
      page.getByText('没有匹配板块，请调整搜索或有题筛选。', { exact: true }),
    ).toBeVisible()
    await search.fill('')
    await captureHistory(application, page, info, 'boards-empty.png')
    await page.getByRole('button', { name: '按条件开始练习', exact: true }).focus()
    await page.getByRole('button', { name: '按条件开始练习', exact: true }).press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    expect(historySnapshot(testDataDirectory).sessions).toEqual([])
    expect((await categoryList(page)).categories).toEqual([])
    await page.context().setOffline(true)
    await page.reload()
    await openPage(page, '知识板块')
    await expect(board(page, 'C语言')).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  } finally {
    await stop(application)
  }
})

test('板块入口：改名移动移除后旧轮队列/草稿/历史/方案逐行保持，正常重开继续原轮', async ({
  testDataDirectory,
}, info) => {
  const prepared = await prepare(testDataDirectory, info.project.name)
  let instance = { application: prepared.application, page: prepared.page }
  try {
    await openPage(instance.page, '开始练习')
    await instance.page.getByText('按分类选择专题', { exact: true }).click()
    await instance.page.getByRole('button', { name: '练习分类：通信协议', exact: true }).click()
    await instance.page.getByLabel('练习专题', { exact: true }).selectOption('board-a')
    await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
    await instance.page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('第一题合成作答')
    await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await instance.page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
    const draft = '板块调整前的第二题草稿\n    keep_original_queue();'
    await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
    await instance.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await instance.page.getByText('筛选练习题目', { exact: true }).click()
    await instance.page.getByLabel('练习难度', { exact: true }).selectOption('进阶')
    const plan = await savePlan(instance.page, '保留原条件的中等练习')
    expect(plan.options.filters.difficulty).toBe('进阶')
    const protectedRows = historySnapshot(testDataDirectory)
    const plans = await readPlans(instance.page)
    await openPage(instance.page, '题库')
    const manager = await openCategoryManager(instance.page)
    await manager.getByRole('button', { name: '修改或移除分类', exact: true }).click()
    await manager.getByLabel('要修改的分类', { exact: true }).selectOption(prepared.communication)
    await manager.getByLabel('分类新名称', { exact: true }).fill('我的通信复习')
    await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
    await expect
      .poll(
        async () =>
          (await categoryList(instance.page)).categories.find(
            (c) => c.categoryId === prepared.communication,
          )?.title,
      )
      .toBe('我的通信复习')
    await assignTopic(instance.page, 'board-a', prepared.personal)
    await categoryChange(instance.page, { kind: 'delete', categoryId: prepared.communication })
    expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
    expect(await readPlans(instance.page)).toEqual(plans)
    await openPage(instance.page, '知识板块')
    await expect(board(instance.page, '通信协议').locator('.board-count')).toHaveText(
      '0 题 · 待补题',
    )
    await expect(board(instance.page, '我的重点').locator('.board-count')).toHaveText('26 题')
    await expect(
      instance.page.getByRole('region', { name: '继续上次练习', exact: true }),
    ).toContainText('第 2 / 23 题')
    const closed = instance.application.waitForEvent('close')
    await instance.application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.close(),
    )
    await closed
    instance = await launchApplication(testDataDirectory, info.project.name, '知识板块')
    await runtime(instance.application, instance.page, testDataDirectory, info)
    expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
    expect(await readPlans(instance.page)).toEqual(plans)
    const panel = await openPlans(instance.page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(plan.planId)
    await expect(panel).toContainText('难度：中（进阶）')
    await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
    await openPage(instance.page, '知识板块')
    await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
    await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      draft,
    )
    await expect(
      instance.page.locator('.practice-heading').getByLabel('难度：中（进阶）', { exact: true }),
    ).toBeVisible()
    await expect(instance.page.getByText('BOARD-ANSWER-board-a-2', { exact: true })).toHaveCount(0)
    expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
    await info.attach('protected-learning-rows.json', {
      body: JSON.stringify({ rows: protectedRows, plans }, null, 2),
      contentType: 'application/json',
    })
  } finally {
    await stop(instance.application)
  }
})

test('板块入口：旧筛选慢响应不能覆盖新板块，计数读取失败明确重试且不写库', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
      const control = {
        held: false,
        finished: false,
        fail: false,
        release: undefined as (() => void) | undefined,
      }
      Reflect.set(globalThis, 'boardReadControl', control)
      ipcMain.removeHandler('library:list-questions')
      ipcMain.handle('library:list-questions', async (event, request) => {
        if (control.fail && request.topicId === null && !request.filters && !request.category) {
          control.fail = false
          return {
            ok: false,
            error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟板块题数读取失败' },
          }
        }
        const result = await original(event, request)
        if (request.filters?.query === '延迟旧条件' && !control.held) {
          control.held = true
          await new Promise<void>((done) => {
            control.release = done
          })
          control.finished = true
        }
        return result
      })
    })
    await page.getByLabel('题库搜索', { exact: true }).fill('延迟旧条件')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').held))
      .toBe(true)
    await openPage(page, '知识板块')
    await board(page, '通信协议')
      .getByRole('button', { name: '进入板块：通信协议', exact: true })
      .click()
    await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
    await application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').release())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').finished))
      .toBe(true)
    await page.evaluate(
      () =>
        new Promise<void>((done) => {
          const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (cb: () => void) => void
          frame(() => frame(done))
        }),
    )
    await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
    await application.evaluate(() => {
      Reflect.get(globalThis, 'boardReadControl').fail = true
    })
    await openPage(page, '知识板块')
    await expect(page.getByRole('alert')).toContainText('定向模拟板块题数读取失败')
    await expect(page.locator('.board-card')).toHaveCount(0)
    await page.getByRole('button', { name: '重新读取板块', exact: true }).click()
    await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await application
      .evaluate(() => Reflect.get(globalThis, 'boardReadControl')?.release?.())
      .catch(() => {})
    await stop(application)
  }
})

test('板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值', async ({
  testDataDirectory,
}, info) => {
  const { application, page, paths } = await prepare(testDataDirectory, info.project.name)
  try {
    await runtime(application, page, testDataDirectory, info)
    await openPage(page, '知识板块')
    await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
    await expect(board(page, '我的重点').locator('.board-count')).toHaveText('3 题')
    await expect(
      board(page, '未分类').getByRole('button', { name: '进入板块：未分类', exact: true }),
    ).toHaveText('未分类 · 1 题')
    await expect(
      board(page, '全部题库').getByRole('button', { name: '进入板块：全部题库', exact: true }),
    ).toHaveText('全部题库 · 27 题')
    await expect(
      board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
    ).toBeDisabled()
    const enter = board(page, '通信协议').getByRole('button', {
      name: '进入板块：通信协议',
      exact: true,
    })
    await enter.focus()
    await enter.press('Enter')
    await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
    await expect(page.locator('.question-list li')).toHaveCount(20)
    await expect(page.locator('.question-list .difficulty-badge')).toHaveCount(20)
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(page.locator('.question-list li')).toHaveCount(3)
    for (const [value, label, count] of [
      ['基础', '易（基础）', 6],
      ['进阶', '中（进阶）', 6],
      ['综合', '难（综合）', 6],
      ['未分级', '未分级', 5],
    ] as const) {
      await page.getByLabel('题库难度', { exact: true }).selectOption({ label })
      await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue(value)
      await page.getByRole('button', { name: '筛选题库', exact: true }).click()
      await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
      await expect(
        page.locator('.question-list').getByLabel(`难度：${label}`, { exact: true }),
      ).toHaveCount(count)
    }
    await page.getByLabel('题库搜索', { exact: true }).fill('不会匹配')
    await page.getByLabel('题库只看收藏', { exact: true }).check()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await openPage(page, '知识板块')
    await board(page, '通信协议')
      .getByRole('button', { name: '进入板块：通信协议', exact: true })
      .click()
    await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('题库只看收藏', { exact: true })).not.toBeChecked()
    await expect(page.getByRole('navigation', { name: '题目分页', exact: true })).toContainText(
      '1 / 2',
    )
    await page.locator('.question-list li > button').first().click()
    await expect(
      page
        .getByRole('article', { name: '题目内容', exact: true })
        .getByLabel('难度：易（基础）', { exact: true }),
    ).toBeVisible()
    for (const [title, count] of [
      ['我的重点', 3],
      ['未分类', 1],
      ['全部题库', 27],
    ] as const) {
      await openPage(page, '知识板块')
      await board(page, title)
        .getByRole('button', { name: `进入板块：${title}`, exact: true })
        .click()
      await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
    }
    await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
    await importHistoryFiles(application, page, [paths[0]!])
    await openPage(page, '知识板块')
    await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
    await board(page, '通信协议')
      .getByRole('button', { name: '查看归档：通信协议', exact: true })
      .click()
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
    await expect(page.locator('.question-list li')).toHaveCount(1)
  } finally {
    await stop(application)
  }
})

test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    const measurements = []
    for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
      for (const theme of ['light', 'dark'] as const) {
        await application.evaluate(
          ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
          theme === 'light' ? 1440 : 900,
        )
        await openPage(page, '设置与数据')
        await page.getByRole('radio', { name: palette, exact: true }).check()
        await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
        await page
          .getByLabel('正文字号', { exact: true })
          .selectOption(theme === 'dark' ? '22' : '17')
        await page.getByRole('button', { name: '保存并应用', exact: true }).click()
        await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
        await openPage(page, '知识板块')
        await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
        const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
        await expect(search).toHaveCSS(
          'background-color',
          theme === 'dark'
            ? {
                松间绿: 'rgb(27, 36, 32)',
                晴空蓝: 'rgb(30, 39, 53)',
                暖沙金: 'rgb(46, 39, 30)',
                暮山紫: 'rgb(43, 35, 52)',
              }[palette]!
            : {
                松间绿: 'rgb(252, 253, 251)',
                晴空蓝: 'rgb(250, 252, 254)',
                暖沙金: 'rgb(253, 250, 244)',
                暮山紫: 'rgb(252, 250, 253)',
              }[palette]!,
        )
        await search.focus()
        await search.press('Tab')
        const toggle = page.getByLabel('显示拓展方向', { exact: true })
        await expect(toggle).toBeFocused()
        await toggle.press('Space')
        await expect(toggle).toBeChecked()
        const summary = board(page, 'C语言').locator('summary')
        await summary.focus()
        await summary.press('Enter')
        await expect(
          board(page, 'C语言').getByText('数据类型与表达式', { exact: true }),
        ).toBeVisible()
        await expect(summary).toHaveCSS('box-shadow', /0px 0px 0px 2px, .*0px 0px 0px 4px/)
        const dimensions = await page.evaluate(() => {
          const browser = globalThis as unknown as {
            innerWidth: number
            document: { documentElement: { scrollWidth: number; clientWidth: number } }
          }
          return {
            viewport: browser.innerWidth,
            clientWidth: browser.document.documentElement.clientWidth,
            scrollWidth: browser.document.documentElement.scrollWidth,
          }
        })
        expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
        await page.evaluate(() =>
          (Reflect.get(globalThis, 'scrollTo') as (x: number, y: number) => void)(0, 0),
        )
        if (palette === '松间绿')
          await captureHistory(application, page, info, `boards-${theme}.png`)
        const enter = board(page, '通信协议').getByRole('button', {
          name: '进入板块：通信协议',
          exact: true,
        })
        await enter.focus()
        await enter.press('Enter')
        await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
        await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
        await page.getByLabel('题库浏览', { exact: true }).press('Tab')
        const managementSummary = page.locator(
          '.library-management-tools .category-manager > summary',
        )
        await expect(managementSummary).toBeFocused()
        if (
          (await page
            .locator('.library-management-tools .category-manager')
            .getAttribute('open')) !== null
        ) {
          await managementSummary.press('Enter')
          await expect(
            page.locator('.library-management-tools .category-manager'),
          ).not.toHaveAttribute('open')
        }
        await managementSummary.press('Tab')
        await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toBeFocused()
        const navigationSummary = page.locator(
          '.library-navigation .topic-navigation-panel > summary',
        )
        for (
          let step = 0;
          step < 16 &&
          !(await navigationSummary.evaluate(
            (element) => element === element.ownerDocument.activeElement,
          ));
          step++
        )
          await page.keyboard.press('Tab')
        await expect(navigationSummary).toBeFocused()
        await navigationSummary.press('Tab')
        await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
        const ratios = await page.evaluate(() => {
          const browser = globalThis as unknown as {
            document: { querySelector: (selector: string) => unknown }
            getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
          }
          const luminance = (rgb: string) =>
            rgb
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map(Number)
              .map((v) => {
                const c = v / 255
                return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
              })
              .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
          return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
            const style = browser.getComputedStyle(
              browser.document.querySelector(`.question-list .difficulty-${tone}`),
            )
            const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
              (a, b) => b - a,
            )
            return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
          })
        })
        for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
        measurements.push({ palette, theme, dimensions, ratios })
        if (palette === '松间绿')
          await captureHistory(application, page, info, `difficulty-${theme}.png`)
        expect(historySnapshot(testDataDirectory)).toEqual(before)
      }
    }
    await info.attach('board-appearance-measurements.json', {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
