import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, test } from './helpers'
import { prepareCategories } from './category-helpers'
import { historySnapshot, stop } from './history-helpers'
import { openPlans, readPlans } from './practice-plan-helpers'

test('方案失败：读取不伪造空成功、已提交丢响应按原命令重试，停止重试不删已存项', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareCategories(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers'),
        list = handlers.get('practice-plans:list'),
        change = handlers.get('practice-plans:change')
      Reflect.set(globalThis, '__failPlanRead', true)
      Reflect.set(globalThis, '__dropPlanReply', true)
      Reflect.set(globalThis, '__planRequests', [])
      ipcMain.removeHandler('practice-plans:list')
      ipcMain.handle('practice-plans:list', (event) =>
        Reflect.get(globalThis, '__failPlanRead')
          ? { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '定向方案读取失败' } }
          : list(event),
      )
      ipcMain.removeHandler('practice-plans:change')
      ipcMain.handle('practice-plans:change', async (event, command) => {
        Reflect.get(globalThis, '__planRequests').push(structuredClone(command))
        const result = await change(event, command)
        if (Reflect.get(globalThis, '__dropPlanReply')) {
          Reflect.set(globalThis, '__dropPlanReply', false)
          return { ok: true, value: { invalidReply: true } }
        }
        return result
      })
    })
    await page.reload()
    const panel = await openPlans(page)
    await expect(panel.getByRole('alert')).toContainText('定向方案读取失败')
    await expect(panel.getByLabel('方案名称', { exact: true })).toBeDisabled()
    await application.evaluate(() => Reflect.set(globalThis, '__failPlanRead', false))
    await panel.getByRole('button', { name: '重试读取练习方案', exact: true }).click()
    await panel.getByLabel('方案名称', { exact: true }).fill('丢响应方案')
    await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('结果尚未确认')
    const first = (await readPlans(page))[0]!
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    await expect(panel.getByLabel('方案名称', { exact: true })).toHaveValue('丢响应方案')
    await panel.getByRole('button', { name: '重试原方案操作', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
    expect(await readPlans(page)).toEqual([first])
    const requests = await application.evaluate(() => Reflect.get(globalThis, '__planRequests'))
    expect(requests).toHaveLength(2)
    expect(requests[1]).toEqual(requests[0])
    await application.evaluate(() => Reflect.set(globalThis, '__dropPlanReply', true))
    await panel.getByLabel('方案名称', { exact: true }).fill('停止重试方案')
    await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('结果尚未确认')
    await panel.getByRole('button', { name: '停止重试并核对', exact: true }).click()
    expect(await readPlans(page)).toHaveLength(2)
    await expect(page.getByRole('link', { name: '设置与数据', exact: true })).toHaveAttribute(
      'aria-disabled',
      'false',
    )
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('plan-original-retry.json', {
      body: JSON.stringify({ requests, plans: await readPlans(page) }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

for (const failed of [false, true]) {
  test(`方案正常关闭等待在途保存：${failed ? '失败返回窗口原目标重试' : '成功退出重开保持'}`, async ({
    testDataDirectory,
  }, info) => {
    const prepared = await prepareCategories(testDataDirectory, info.project.name)
    let instance = { application: prepared.application, page: prepared.page }
    try {
      const panel = await openPlans(instance.page)
      await instance.application.evaluate(({ ipcMain, dialog }, failed) => {
        const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice-plans:change')
        let hold = true
        ipcMain.removeHandler('practice-plans:change')
        ipcMain.handle('practice-plans:change', async (event, command) => {
          if (hold && command.kind === 'save') {
            hold = false
            const result = failed
              ? { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '定向方案保存失败' } }
              : await original(event, command)
            await new Promise<void>((resolve) =>
              Reflect.set(globalThis, '__releasePlanSave', resolve),
            )
            return result
          }
          return original(event, command)
        })
        dialog.showMessageBox = (async (...args: unknown[]) => {
          const options = args[args.length - 1] as { defaultId: number; buttons: string[] }
          if (options.defaultId !== 0 || options.buttons[0] !== '返回窗口')
            throw new Error('默认关闭选项不正确')
          return { response: 0, checkboxChecked: false }
        }) as typeof dialog.showMessageBox
      }, failed)
      await instance.page.evaluate(() => {
        ;(globalThis as unknown as { desktop: DesktopApi }).desktop.practice.onBeforeClose(() =>
          Reflect.set(globalThis, '__planCloseSeen', true),
        )
      })
      await panel.getByLabel('方案名称', { exact: true }).fill('关闭等待方案')
      await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
      await expect
        .poll(() =>
          instance.application.evaluate(() => typeof Reflect.get(globalThis, '__releasePlanSave')),
        )
        .toBe('function')
      await instance.application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]!.close(),
      )
      await expect
        .poll(() => instance.page.evaluate(() => Reflect.get(globalThis, '__planCloseSeen')))
        .toBe(true)
      expect(instance.application.windows()).toHaveLength(1)
      if (failed) {
        await instance.application.evaluate(() => Reflect.get(globalThis, '__releasePlanSave')())
        await expect(panel.getByRole('alert')).toContainText('定向方案保存失败')
        await expect(panel.getByLabel('方案名称', { exact: true })).toHaveValue('关闭等待方案')
        await expect(
          instance.page.getByRole('link', { name: '设置与数据', exact: true }),
        ).toHaveAttribute('aria-disabled', 'true')
        await panel.getByRole('button', { name: '重试原方案操作', exact: true }).click()
        await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
        await expect(
          instance.page.getByRole('link', { name: '设置与数据', exact: true }),
        ).toHaveAttribute('aria-disabled', 'false')
      } else {
        const closed = instance.application.waitForEvent('close')
        await instance.application.evaluate(() => Reflect.get(globalThis, '__releasePlanSave')())
        await closed
        instance = await launchApplication(testDataDirectory, info.project.name)
      }
      expect((await readPlans(instance.page)).map((plan) => plan.name)).toEqual(['关闭等待方案'])
    } finally {
      await instance.application
        .evaluate(() => Reflect.get(globalThis, '__releasePlanSave')?.())
        .catch(() => {})
      await stop(instance.application)
    }
  })
}
