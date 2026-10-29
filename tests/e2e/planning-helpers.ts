import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { localDay, type PlanningChange, type QuotaRow } from '../../src/shared/contracts/planning'
export function changePlanning(page: Page, input: PlanningChange) {
  return page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.change(input),
    input,
  )
}
export async function planningHome(page: Page, day = localDay()) {
  const result = await page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.home(input),
    { day },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function goalProgress(page: Page, goalId: string) {
  const result = await page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.progress(input),
    { goalId },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export function goalScope(page: Page, goalId: string, setId?: string) {
  return page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.scope(input),
    { goalId, ...(setId ? { setId } : {}) },
  )
}
export async function quotaPreview(page: Page, rows: QuotaRow[]) {
  const result = await page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.previewQuota(input),
    { rows },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function calendarDay(page: Page, day = localDay(), eventPage = 1, roundPage = 1) {
  const result = await page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.day(input),
    { day, eventPage, roundPage },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
