import type { PracticeAck, PracticeResult } from '../../src/shared/contracts/practice'

// 只在本次 Electron 临时库中用真实练习服务建立历史，不直接伪造作答行。
export async function seedHistory(
  { app }: Pick<typeof import('electron'), 'app'>,
  input: { directory: string; rounds: number },
) {
  const path = process.getBuiltinModule('node:path')
  const root = path.resolve(input.directory)
  if (
    root !== app.getPath('userData') ||
    path.dirname(root) !== path.resolve(process.getBuiltinModule('node:os').tmpdir()) ||
    !path.basename(root).startsWith('embedded-practice-') ||
    !Number.isInteger(input.rounds) ||
    input.rounds < 1 ||
    input.rounds > 30
  )
    throw new Error('历史夹具范围无效。')
  const load = process
    .getBuiltinModule('node:module')
    .createRequire(path.join(app.getAppPath(), 'history-test.cjs'))
  const entry = [
    path.join(app.getAppPath(), 'out/main/practice.js'),
    path.join(app.getAppPath(), 'practice.js'),
  ].find((file) => process.getBuiltinModule('node:fs').existsSync(file))
  if (!entry) throw new Error('缺少构建后的练习服务。')
  const built = load(entry) as typeof import('../../src/main/services/practice/practice')
  const errors: string[] = []
  const service = await built.openPracticeService(path.join(root, 'practice.sqlite3'), (error) => {
    errors.push(error instanceof Error ? error.message : String(error))
  })
  const id = () => process.getBuiltinModule('node:crypto').randomUUID()
  const value = <T>(result: PracticeResult<T>): T => {
    if (!result.ok) throw new Error('历史夹具练习失败：' + result.error.code)
    return result.value
  }
  const cursor = (ack: PracticeAck) => ({
    sessionId: ack.sessionId,
    position: ack.position,
    revision: ack.revision,
  })
  const empty = { revision: 0, text: '' }
  const sessions: string[] = []
  try {
    for (let round = 0; round < input.rounds; round++) {
      let ack = value(
        service.start({
          requestId: id(),
          topicId: 'history-a',
          count: 'all',
          replace: null,
          mode: round % 2 === 0 ? 'sequential' : 'random',
        }),
      )
      sessions.push(ack.sessionId)
      while (ack.status === 'active') {
        const view = value(service.read({ sessionId: ack.sessionId }))
        if (!view?.item) throw new Error('历史夹具缺少当前题。')
        if (view.item.questionId !== 'q-1') {
          ack = value(
            service.navigate({
              requestId: id(),
              cursor: cursor(ack),
              draft: empty,
              direction: 'skip',
            }),
          )
          continue
        }
        const draft =
          round % 3 === 2
            ? empty
            : {
                revision: 1,
                text: `HISTORY-DRAFT-${round}\r\n<script>literal</script>\nint value = ${round};`,
              }
        if (round % 3 === 1) {
          value(service.saveDraft({ sessionId: ack.sessionId, position: ack.position, draft }))
          ack = value(service.end({ requestId: id(), cursor: cursor(ack), draft }))
        } else {
          ack = value(service.reveal({ requestId: id(), cursor: cursor(ack), draft }))
          ack = value(
            service.rateAndAdvance({
              requestId: id(),
              cursor: cursor(ack),
              draft,
              rating: round % 3 === 0 ? '掌握' : null,
            }),
          )
          if (round === 0) {
            ack = value(
              service.navigate({
                requestId: id(),
                cursor: cursor(ack),
                draft: empty,
                direction: 'previous',
              }),
            )
            ack = value(
              service.rateAndAdvance({
                requestId: id(),
                cursor: cursor(ack),
                draft,
                rating: '不熟',
              }),
            )
          }
        }
      }
    }
    const untouched = value(
      service.start({ requestId: id(), topicId: 'history-a', count: 'all', replace: null }),
    )
    value(service.end({ requestId: id(), cursor: cursor(untouched), draft: empty }))
    let other = value(
      service.start({ requestId: id(), topicId: 'history-b', count: 'all', replace: null }),
    )
    const otherDraft = { revision: 1, text: 'OTHER-TOPIC-DRAFT 不可串题' }
    other = value(service.reveal({ requestId: id(), cursor: cursor(other), draft: otherDraft }))
    value(
      service.rateAndAdvance({
        requestId: id(),
        cursor: cursor(other),
        draft: otherDraft,
        rating: '不会',
      }),
    )
    return {
      sessions,
      untouchedSessionId: untouched.sessionId,
      otherSessionId: other.sessionId,
      errors,
    }
  } finally {
    service.close()
  }
}
