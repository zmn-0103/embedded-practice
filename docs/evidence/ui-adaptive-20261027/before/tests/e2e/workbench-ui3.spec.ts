import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ElectronApplication, Locator, Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { chooseTheme, themeBusinessSnapshot, verifyThemeTarget } from './theme-helpers'
import {
  noWorkbenchOverflow,
  prepareWorkbench,
  settleWorkbench,
  workbenchBank,
} from './workbench-helpers'

async function size(application: ElectronApplication, width = 1440) {
  await application.evaluate(
    ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 900),
    width,
  )
}

async function inView(locator: Locator) {
  await expect(locator).toBeInViewport({ ratio: 1 })
  expect((await locator.boundingBox())!.y).toBeGreaterThanOrEqual(0)
}

async function capture(page: Page, info: TestInfo, name: string, geometry?: unknown) {
  await settleWorkbench(page)
  await info.attach(`${name}.png`, { body: await page.screenshot(), contentType: 'image/png' })
  if (geometry)
    await info.attach(`${name}.json`, {
      body: JSON.stringify(geometry, null, 2),
      contentType: 'application/json',
    })
}

async function prepareReal(directory: string, info: TestInfo, extraCategories = 0) {
  const manifest = JSON.parse(
    await readFile('question-banks/releases/v000-20261024/全量题库清单.json', 'utf8'),
  ) as { files: { file: string; topicId: string; board: string }[] }
  const instance = await launchApplication(directory, info.project.name, '题库')
  try {
    const runtime = await verifyThemeTarget(
      instance.application,
      instance.page,
      directory,
      info.project.name,
    )
    await info.attach('ui3-runtime.json', {
      body: JSON.stringify(runtime),
      contentType: 'application/json',
    })
    await size(instance.application)
    await importHistoryFiles(
      instance.application,
      instance.page,
      manifest.files.map((file) => resolve(file.file)),
    )
    await instance.page.evaluate(
      async ({ files, extraCategories }) => {
        const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
        const titles = [
          ...new Set(files.map((file) => file.board)),
          ...Array.from({ length: extraCategories }, (_, index) => `独立布局分类 ${index + 1}`),
        ]
        for (const title of titles) {
          const result = await api.library.updateCategory({ kind: 'create', title })
          if (!result.ok) throw new Error(result.error.message)
        }
        const navigation = await api.library.listQuestions({
          topicId: null,
          archived: false,
          page: 1,
        })
        if (!navigation.ok) throw new Error(navigation.error.message)
        for (const file of files) {
          const category = navigation.value.categories.find((item) => item.title === file.board)!
          const result = await api.library.updateCategory({
            kind: 'assign',
            topicId: file.topicId,
            categoryId: category.categoryId,
          })
          if (!result.ok) throw new Error(result.error.message)
        }
      },
      { files: manifest.files, extraCategories },
    )
    await chooseTheme(instance.page, '晴空蓝')
    await openPage(instance.page, '题库')
    await expect(instance.page.getByText('共 419 题', { exact: true })).toBeVisible()
    return instance
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}

test('第三轮分类：真实419题与大量展开分类只有树滚动，搜索固定且第20题定位/列表位置保持', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareReal(testDataDirectory, info, 12)
  try {
    const before = themeBusinessSnapshot(testDataDirectory)
    for (const font of [17, 22]) {
      await chooseTheme(page, '晴空蓝', 'light', font)
      await openPage(page, '题库')
      const navigation = page.getByRole('complementary', {
        name: '题库分类与专题导航',
        exact: true,
      })
      for (const button of await navigation.locator('.category-toggle').all())
        if ((await button.getAttribute('aria-expanded')) === 'false') await button.click()
      const scrollable = await navigation.evaluate((element) => {
        const browser = globalThis as unknown as {
          getComputedStyle: (node: unknown) => { overflowY: string }
        }
        return [element, ...element.querySelectorAll('*')]
          .filter(
            (node) =>
              node.clientHeight > 0 &&
              node.scrollHeight > node.clientHeight + 1 &&
              /auto|scroll/.test(browser.getComputedStyle(node).overflowY),
          )
          .map((node) => ({
            class: node.getAttribute('class'),
            client: node.clientHeight,
            scroll: node.scrollHeight,
          }))
      })
      expect(scrollable).toHaveLength(1)
      expect(scrollable[0]!.class).toBe('category-tree')
      const search = navigation.getByRole('searchbox', { name: '题库专题检索', exact: true })
      await inView(search)
      await navigation.locator('.category-tree').evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })
      await inView(search)
      await search.fill('GPIO')
      await expect(
        navigation.getByRole('button', { name: /题库专题：.*GPIO/ }).first(),
      ).toBeVisible()
      await search.clear()
      await page.getByLabel('专题', { exact: true }).selectOption('stm32f103-gpio')
      await expect(page.locator('.question-row')).toHaveCount(20)
      const list = page.locator('.question-list-scroll')
      const row = page.locator('.question-row').nth(19)
      await row.scrollIntoViewIfNeeded()
      const top = await list.evaluate((element) => element.scrollTop)
      const title = await row.locator('.question-row-title').textContent()
      await row.click()
      await inView(
        page
          .getByRole('article', { name: '题目内容', exact: true })
          .getByRole('heading', { name: title!, exact: true }),
      )
      expect(await list.evaluate((element) => element.scrollTop)).toBe(top)
      await capture(page, info, `category-row20-1440-${font}`, {
        scrollable,
        listTopBefore: top,
        listTopAfter: await list.evaluate((element) => element.scrollTop),
      })
      await noWorkbenchOverflow(page)
    }
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

async function scrollPage(page: Page, fraction: number) {
  await page.evaluate((fraction) => {
    const browser = globalThis as unknown as {
      scrollTo: (x: number, y: number) => void
      document: { documentElement: { scrollHeight: number } }
      innerHeight: number
    }
    browser.scrollTo(
      0,
      (browser.document.documentElement.scrollHeight - browser.innerHeight) * fraction,
    )
  }, fraction)
  await settleWorkbench(page)
}

test('第三轮返回：900px/22px长答案顶部中部末尾均可返回，保存失败保留原输入/队列并可重试', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareWorkbench(testDataDirectory, info.project.name)
  let fault = false
  try {
    const answer =
      Array.from(
        { length: 50 },
        (_, index) => `第${index + 1}段参考说明，保持正常字号与完整内容。`,
      ).join('\n\n') + '\n\nUI3-LAST-ANSWER-LINE'
    await writeFile(file, workbenchBank().replace('WORKBENCH-ANSWER-1\n', `${answer}\n`))
    await importHistoryFiles(application, page, [file])
    await chooseTheme(page, '晴空蓝', 'light', 22)
    await size(application, 900)
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('长答案阅读前已经保存的草稿')
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByLabel('练习参考答案', { exact: true })).toBeVisible()
    const back = page.getByRole('button', { name: '保存后返回', exact: true })
    await expect(back).toBeEnabled()
    for (const fraction of [0, 0.5, 1]) {
      await scrollPage(page, fraction)
      await inView(back)
    }
    const last = page.getByText('UI3-LAST-ANSWER-LINE', { exact: true })
    await inView(last)
    const bar = await page.locator('.practice-actions').boundingBox()
    const end = await last.boundingBox()
    expect(end!.y + end!.height).toBeLessThanOrEqual(bar!.y)
    expect(
      await page
        .locator('.practice-action-reserve')
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(bar!.height)
    await capture(page, info, 'practice-answer-bottom-900-22', { last: end, actions: bar })
    const before = themeBusinessSnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER ui3_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '第三轮返回保存失败'); END",
        ),
      false,
    )
    fault = true
    const draft = '返回失败也必须保留的新输入\n'.repeat(60)
    await input.fill(draft)
    await expect(page.locator('.practice-save')).toHaveText('保存失败')
    await scrollPage(page, 1)
    await back.click()
    await expect(input).toHaveValue(draft)
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20')
    await inView(page.locator('.practice-actions [role="alert"]'))
    await inView(page.getByRole('button', { name: '重试保存', exact: true }))
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await capture(page, info, 'practice-return-failed-900-22')
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER ui3_draft_fault'), false)
    fault = false
    await page.getByRole('button', { name: '重试保存', exact: true }).click()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await back.click()
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(input).toHaveValue(draft)
    await expect(page.getByLabel('练习参考答案', { exact: true })).toBeVisible()
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20')
    await noWorkbenchOverflow(page)
  } finally {
    if (fault)
      withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER ui3_draft_fault'), false)
    await stop(application)
  }
})

test('第三轮窄窗：17/22px短题输入保持至少180px，唯一揭晓入口常驻且不提前挂载答案或历史', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await size(application, 900)
    for (const font of [17, 22]) {
      await chooseTheme(page, '晴空蓝', 'light', font)
      await openPage(page, '开始练习')
      await page
        .getByRole('button', { name: font === 17 ? '开始练习' : '继续练习', exact: true })
        .click()
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      const reveal = page.getByRole('button', { name: '查看参考答案', exact: true })
      await expect(reveal).toHaveCount(1)
      await inView(reveal)
      await inView(input)
      expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(180)
      expect(
        await input.evaluate(
          (element) => element.ownerDocument.defaultView!.getComputedStyle(element).fontSize,
        ),
      ).toBe(`${font}px`)
      await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
      await expect(page.getByText('WORKBENCH-ANSWER-1', { exact: true })).toHaveCount(0)
      await capture(page, info, `practice-unrevealed-900-${font}`, {
        reveal: await reveal.boundingBox(),
        input: await input.boundingBox(),
      })
      await noWorkbenchOverflow(page)
      await page.getByRole('button', { name: '保存后返回', exact: true }).click()
    }
  } finally {
    await stop(application)
  }
})

test('第三轮列表：短题72至88px、明确专题不重复来源，22px长中文标题完整且点击不移动列表', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    const longTitle = '用于检查大字号自然换行的完整中文题名与边界条件'.repeat(3)
    await writeFile(file, workbenchBank().replace('工作台题目 25', longTitle))
    await importHistoryFiles(application, page, [file])
    await size(application)
    const before = themeBusinessSnapshot(testDataDirectory)
    for (const font of [17, 22]) {
      await chooseTheme(page, '晴空蓝', 'light', font)
      await openPage(page, '题库')
      await page.getByLabel('专题', { exact: true }).selectOption('')
      await expect(
        page.locator('.question-row').first().locator('.question-row-meta'),
      ).toContainText('工作台验收专题')
      await page.getByLabel('专题', { exact: true }).selectOption('workbench-a')
      const row = page.locator('.question-row').first()
      const topic = row.locator('.question-row-topic')
      await expect(topic).toHaveClass(/visually-hidden/)
      expect((await topic.boundingBox())!.width).toBeLessThanOrEqual(1)
      expect((await topic.boundingBox())!.height).toBeLessThanOrEqual(1)
      await expect(row).toHaveAccessibleName(/工作台验收专题 · q-1(?:\s|$)/)
      if (font === 17) {
        for (const item of (await page.locator('.question-row').all()).slice(0, 5)) {
          const box = await item.boundingBox()
          expect(box!.height).toBeGreaterThanOrEqual(72)
          expect(box!.height).toBeLessThanOrEqual(88)
        }
      }
      expect(
        await row
          .locator('.question-row-title')
          .evaluate(
            (element) => element.ownerDocument.defaultView!.getComputedStyle(element).fontSize,
          ),
      ).toBe(`${font}px`)
      await page
        .getByRole('navigation', { name: '题目分页', exact: true })
        .getByRole('button', { name: '下一页', exact: true })
        .click()
      const last = page.locator('.question-row').last()
      const title = last.locator('.question-row-title')
      await expect(title).toHaveText(longTitle)
      await last.scrollIntoViewIfNeeded()
      expect(
        await title.evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
      ).toBe(true)
      const titleBox = await title.boundingBox()
      const metaBox = await last.locator('.question-row-meta').boundingBox()
      expect(metaBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height)
      const list = page.locator('.question-list-scroll')
      const top = await list.evaluate((element) => element.scrollTop)
      await last.click()
      await inView(
        page
          .getByRole('article', { name: '题目内容', exact: true })
          .getByRole('heading', { name: longTitle, exact: true }),
      )
      expect(await list.evaluate((element) => element.scrollTop)).toBe(top)
      await capture(page, info, `library-long-title-1440-${font}`, {
        title: titleBox,
        meta: metaBox,
        listTop: top,
      })
      await noWorkbenchOverflow(page)
    }
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('第三轮板块：真实题库有活动轮时首排不超过450px、两排可见，有题筛选不改归属与固定队列', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareReal(testDataDirectory, info)
  try {
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('板块布局检查保留的草稿')
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await page.getByRole('button', { name: '保存后返回', exact: true }).click()
    const before = themeBusinessSnapshot(testDataDirectory)
    await openPage(page, '知识板块')
    const cards = page.locator('.board-card')
    await expect(cards).toHaveCount(16)
    expect((await cards.first().boundingBox())!.y).toBeLessThanOrEqual(450)
    for (const card of (await cards.all()).slice(0, 8)) await inView(card)
    const positions = await cards.evaluateAll((elements) =>
      elements.slice(0, 8).map((element) => ({
        title: element.querySelector('h3')!.textContent,
        ...element.getBoundingClientRect().toJSON(),
      })),
    )
    await capture(page, info, 'boards-active-1440-17', positions)
    const conditions = page.getByLabel('本轮创建条件', { exact: true })
    await expect(conditions).not.toHaveAttribute('open', '')
    await conditions.locator('summary').click()
    await expect(conditions).toContainText('继续练习使用原固定队列')
    await conditions.locator('summary').click()
    await page.getByLabel('仅显示有题板块', { exact: true }).check()
    await expect(cards).toHaveCount(5)
    for (const card of await cards.all())
      await expect(card.locator('.board-count strong')).not.toHaveText('0')
    await page.getByLabel('仅显示有题板块', { exact: true }).uncheck()
    await expect(cards).toHaveCount(16)
    await page.getByRole('searchbox', { name: '搜索板块', exact: true }).fill('C语言')
    await expect(cards).toHaveCount(1)
    await page.getByRole('searchbox', { name: '搜索板块', exact: true }).clear()
    await chooseTheme(page, 'Claude 风格', 'dark', 22)
    await openPage(page, '知识板块')
    await expect(cards).toHaveCount(16)
    for (const title of await cards.locator('h3').all())
      expect(
        await title.evaluate((element) => element.scrollHeight <= element.clientHeight + 1),
      ).toBe(true)
    await noWorkbenchOverflow(page)
    await capture(page, info, 'boards-active-1440-22')
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})
