# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning.spec.ts >> 备考题单去重、CAS与删除失效，当前版本覆盖/归档分开，超500不截断
- Location: tests\e2e\planning.spec.ts:259:5

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "error": Object {
-     "code": "LIMIT_EXCEEDED",
+     "code": "NOT_FOUND",
    },
    "ok": false,
  }
```

# Test source

```ts
  242 |         draft,
  243 |       })
  244 |       if (!second.ok) throw Error(second.error.message)
  245 |       return api.rateAndAdvance({
  246 |         requestId: crypto.randomUUID(),
  247 |         cursor: { sessionId: ack.sessionId, position: 0, revision: second.value.revision },
  248 |         draft,
  249 |         rating: null,
  250 |       })
  251 |     }, next.value)
  252 |     expect(outcome).toMatchObject({ ok: true })
  253 |     expect((await planningHome(page)).counts).toMatchObject({ ratingAttempts: 1, reveals: 2 })
  254 |   } finally {
  255 |     await stop(application)
  256 |   }
  257 | })
  258 | 
  259 | test('备考题单去重、CAS与删除失效，当前版本覆盖/归档分开，超500不截断', async ({
  260 |   testDataDirectory,
  261 | }, info) => {
  262 |   const { application, page, file } = await prepareControl(testDataDirectory, info, 501)
  263 |   try {
  264 |     const one = randomUUID(),
  265 |       two = randomUUID(),
  266 |       goalId = randomUUID()
  267 |     expect(
  268 |       await changeSet(page, { kind: 'save', setId: one, name: '目标范围一', items: [a(1), a(2)] }),
  269 |     ).toMatchObject({ ok: true })
  270 |     expect(
  271 |       await changeSet(page, { kind: 'save', setId: two, name: '目标范围二', items: [a(2), b(1)] }),
  272 |     ).toMatchObject({ ok: true })
  273 |     const command = {
  274 |       kind: 'exam' as const,
  275 |       goalId,
  276 |       name: '嵌入式面试准备',
  277 |       deadline: '2026-11-30',
  278 |       setIds: [one, two],
  279 |       expectedRevision: 0,
  280 |     }
  281 |     const saved = await changePlanning(page, command)
  282 |     expect(await changePlanning(page, command)).toEqual(saved)
  283 |     expect(await goalScope(page, goalId)).toMatchObject({
  284 |       ok: true,
  285 |       value: { items: [a(1), a(2), b(1)] },
  286 |     })
  287 |     await createStudyRound(page, '口述练习', [a(1)])
  288 |     expect(await goalProgress(page, goalId)).toMatchObject({
  289 |       total: 3,
  290 |       active: 3,
  291 |       practiced: 1,
  292 |       rated: 1,
  293 |       mastered: 0,
  294 |     })
  295 |     await writeFile(file, controlBank('control-a', 501, true, 2))
  296 |     await importHistoryFiles(application, page, [file])
  297 |     expect(await goalProgress(page, goalId)).toMatchObject({
  298 |       total: 3,
  299 |       active: 2,
  300 |       archived: 1,
  301 |       practiced: 0,
  302 |       rated: 0,
  303 |     })
  304 |     expect(await changeSet(page, { kind: 'delete', setId: one })).toMatchObject({ ok: true })
  305 |     expect(await goalProgress(page, goalId)).toMatchObject({
  306 |       sets: [
  307 |         { setId: one, name: null },
  308 |         { setId: two, name: '目标范围二' },
  309 |       ],
  310 |     })
  311 |     expect(await goalScope(page, goalId)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  312 |     expect(await goalScope(page, goalId, two)).toMatchObject({
  313 |       ok: true,
  314 |       value: { sourceSetId: two, items: [a(2), b(1)] },
  315 |     })
  316 |     expect(
  317 |       await changePlanning(page, { ...command, name: '改名保留失效范围', expectedRevision: 1 }),
  318 |     ).toMatchObject({ ok: true, value: { revision: 2 } })
  319 |     expect(
  320 |       await changePlanning(page, { ...command, deadline: null, expectedRevision: 0 }),
  321 |     ).toMatchObject({ ok: false, error: { code: 'CONFLICT' } })
  322 |     if (!saved.ok || saved.value?.type !== 'exam') throw Error('目标未保存')
  323 |     expect(
  324 |       await changePlanning(page, { kind: 'exam-delete', expected: saved.value }),
  325 |     ).toMatchObject({ ok: false, error: { code: 'CONFLICT' } })
  326 |     const large = randomUUID(),
  327 |       tail = randomUUID(),
  328 |       largeGoal = randomUUID()
  329 |     await changeSet(page, {
  330 |       kind: 'save',
  331 |       setId: large,
  332 |       name: '500题范围',
  333 |       items: Array.from({ length: 500 }, (_, i) => a(i + 1)),
  334 |     })
  335 |     await changeSet(page, { kind: 'save', setId: tail, name: '追加一题', items: [a(501)] })
  336 |     await changePlanning(page, {
  337 |       ...command,
  338 |       goalId: largeGoal,
  339 |       name: '大目标',
  340 |       setIds: [large, tail],
  341 |     })
> 342 |     expect(await goalScope(page, largeGoal)).toMatchObject({
      |                                              ^ Error: expect(received).toMatchObject(expected)
  343 |       ok: false,
  344 |       error: { code: 'LIMIT_EXCEEDED' },
  345 |     })
  346 |     expect(await goalScope(page, largeGoal, large)).toMatchObject({
  347 |       ok: true,
  348 |       value: { sourceSetId: large },
  349 |     })
  350 |   } finally {
  351 |     await stop(application)
  352 |   }
  353 | })
  354 | 
  355 | test('配额优先方式/不足/重复与候选只读，确认后固定队列，日历两类分页', async ({
  356 |   testDataDirectory,
  357 | }, info) => {
  358 |   const { application, page } = await prepareControl(testDataDirectory, info)
  359 |   try {
  360 |     await createStudyRound(page, '较早练习', [a(1)])
  361 |     const weak: QuotaRow[] = [
  362 |       { topicId: 'control-a', count: 2, priority: 'weak' },
  363 |       { topicId: 'control-b', count: 2, priority: 'oldest' },
  364 |     ]
  365 |     const before = withHistoryDatabase(testDataDirectory, controlRecords),
  366 |       preview = await quotaPreview(page, weak)
  367 |     expect(preview.ready).toBe(true)
  368 |     expect(preview.rows[0]?.items.map((item) => item.questionId)).toEqual(['q-1', 'q-2'])
  369 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  370 |     const oldest = await quotaPreview(page, [
  371 |       { topicId: 'control-a', count: 27, priority: 'oldest' },
  372 |     ])
  373 |     expect(oldest.rows[0]?.items.at(-1)?.questionId).toBe('q-1')
  374 |     const random = await quotaPreview(page, [
  375 |       { topicId: 'control-a', count: 27, priority: 'random' },
  376 |     ])
  377 |     expect(new Set(random.rows[0]?.items.map((item) => item.questionId)).size).toBe(27)
  378 |     expect(
  379 |       await quotaPreview(page, [
  380 |         { topicId: 'control-b', count: 4, priority: 'weak' },
  381 |         { topicId: 'missing-topic', count: 2, priority: 'random' },
  382 |       ]),
  383 |     ).toMatchObject({
  384 |       ready: false,
  385 |       rows: [
  386 |         { available: 3, deficit: 1, items: expect.any(Array) },
  387 |         { topicTitle: null, available: 0, deficit: 2, items: [] },
  388 |       ],
  389 |     })
  390 |     expect(
  391 |       await changePlanning(page, {
  392 |         kind: 'quota',
  393 |         expectedRevision: 0,
  394 |         rows: [weak[0]!, weak[0]!],
  395 |       }),
  396 |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  397 |     const settings = { kind: 'quota' as const, expectedRevision: 0, rows: weak },
  398 |       saved = await changePlanning(page, settings)
  399 |     expect(await changePlanning(page, settings)).toEqual(saved)
  400 |     const selected = await selectForPractice(
  401 |       page,
  402 |       preview.rows.flatMap((row) =>
  403 |         row.items.map(({ topicId, questionId }) => ({ topicId, questionId })),
  404 |       ),
  405 |       '分专题配额组卷',
  406 |     )
  407 |     const started = await startFlow(page, {
  408 |       requestId: randomUUID(),
  409 |       topicId: null,
  410 |       count: 'all',
  411 |       replace: null,
  412 |       selected,
  413 |     })
  414 |     if (!started.ok) throw Error(started.error.message)
  415 |     const queue = flowQueue(testDataDirectory, started.value.sessionId)
  416 |     await changePlanning(page, {
  417 |       ...settings,
  418 |       expectedRevision: 1,
  419 |       rows: [{ topicId: 'control-b', count: 1, priority: 'random' }],
  420 |     })
  421 |     await quotaPreview(page, weak)
  422 |     expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(queue)
  423 |     expect(
  424 |       await page.evaluate(() =>
  425 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  426 |           sessionId: null,
  427 |         }),
  428 |       ),
  429 |     ).toMatchObject({ ok: true, value: { session: { sessionId: started.value.sessionId } } })
  430 |     for (let n = 1; n <= 27; n++)
  431 |       await saveNote(page, { ...a(n), expectedRevision: 0, text: `日历笔记 ${n}` })
  432 |     const day = await calendarDay(page)
  433 |     expect(day.events).toHaveLength(20)
  434 |     expect(day.eventTotal).toBe(29)
  435 |     expect(await calendarDay(page, localDay(), 99, 99)).toMatchObject({
  436 |       eventPage: 2,
  437 |       roundPage: 1,
  438 |       eventTotal: 29,
  439 |       roundTotal: 2,
  440 |     })
  441 |     const month = await page.evaluate(
  442 |       (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.month(input),
```