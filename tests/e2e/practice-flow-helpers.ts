import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { StartPractice } from '../../src/shared/contracts/practice'
import type { PracticeDesktopResult } from '../../src/shared/contracts/practice-desktop'
import { expect, launchApplication, openPage } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'

export function flowBank(updated = false) {
  return (
    `---\nschema_version: 1\ntopic_id: flow-main\ntopic_title: 复习流程样本\n---\n\n` +
    Array.from({ length: 6 }, (_, i) => i + 1)
      .filter((n) => !updated || n !== 3)
      .map(
        (n) =>
          `## q-${n} | 复习题 ${n}\n\n标签：复习样本\n难度：基础\n\n### 题目\n\nFLOW-${updated ? 'NEW' : 'OLD'}-QUESTION-${n}\n\n### 参考答案\n\nFLOW-${updated ? 'NEW' : 'OLD'}-ANSWER-${n}\n\n`,
      )
      .join('')
  )
}

export async function prepareFlow(directory: string, info: TestInfo) {
  const folder = join(directory, 'flow-source')
  await mkdir(folder)
  const file = join(folder, '练习样本.md')
  await writeFile(file, flowBank())
  const instance = await launchApplication(directory, info.project.name)
  try {
    const actual = await instance.application.evaluate(({ app }) => ({
      exe: process.execPath,
      data: app.getPath('userData'),
      packaged: app.isPackaged,
    }))
    expect(actual.data).toBe(directory)
    expect(actual.packaged).toBe(info.project.name === 'packaged')
    if (actual.packaged) {
      const target = process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']
      if (!target) throw new Error('必须显式指定新EXE')
      expect(actual.exe.toLowerCase()).toBe(resolve(target).toLowerCase())
    }
    await expect(instance.page.locator('footer')).toContainText('20261028.2-note-favorite-fix')
    expect(withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())).toEqual(
      {
        user_version: 13,
      },
    )
    await info.attach('practice-flow-runtime', {
      body: JSON.stringify(actual),
      contentType: 'application/json',
    })
    await importHistoryFiles(instance.application, instance.page, [file])
    await openPage(instance.page, '开始练习')
    return { ...instance, file }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}

export async function finishFlow(page: Page) {
  return page.evaluate(async () => {
    const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
    function value<T>(result: PracticeDesktopResult<T>): T {
      if (!result.ok) throw new Error(result.error.message)
      return result.value
    }
    let ack = value(
      await api.start({
        requestId: crypto.randomUUID(),
        topicId: 'flow-main',
        count: 'all',
        replace: null,
      }),
    )
    for (const rating of ['不会', '不熟', 'skip', null, '掌握'] as const) {
      const cursor = () => ({
        sessionId: ack.sessionId,
        position: ack.position,
        revision: ack.revision,
      })
      const draft = { revision: 1, text: `独立作答-${ack.position}` }
      if (rating === 'skip')
        ack = value(
          await api.navigate({
            requestId: crypto.randomUUID(),
            cursor: cursor(),
            draft,
            direction: 'skip',
          }),
        )
      else {
        ack = value(await api.reveal({ requestId: crypto.randomUUID(), cursor: cursor(), draft }))
        ack = value(
          await api.rateAndAdvance({
            requestId: crypto.randomUUID(),
            cursor: cursor(),
            draft,
            rating,
          }),
        )
      }
    }
    ack = value(
      await api.end({
        requestId: crypto.randomUUID(),
        cursor: { sessionId: ack.sessionId, position: ack.position, revision: ack.revision },
        draft: { revision: 0, text: '' },
      }),
    )
    const view = value(await api.read({ sessionId: ack.sessionId }))
    if (!view) throw new Error('缺少来源轮')
    return view
  })
}

export async function startFlow(page: Page, input: StartPractice) {
  return page.evaluate(
    (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
    input,
  )
}

export async function endFlow(page: Page) {
  return page.evaluate(async () => {
    const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
    const read = await api.read({ sessionId: null })
    if (!read.ok || !read.value?.item) throw new Error('缺少活动轮')
    const { session, item } = read.value
    return api.end({
      requestId: crypto.randomUUID(),
      cursor: {
        sessionId: session.sessionId,
        position: session.position,
        revision: session.revision,
      },
      draft: item.draft,
    })
  })
}

export function flowQueue(directory: string, sessionId: string) {
  return withHistoryDatabase(directory, (db) =>
    db
      .prepare(
        `SELECT q.question_id AS questionId,
    i.version_id AS versionId,i.title,i.draft,i.revealed_at AS revealed,i.rating,i.skipped_at AS skipped
    FROM practice_items i JOIN questions q ON q.id=i.question_id
    WHERE i.session_id=? ORDER BY i.position`,
      )
      .all(sessionId),
  )
}
