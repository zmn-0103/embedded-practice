import { describe, expect, it, vi } from 'vitest'
import { createOralTimerController } from '../../src/renderer/src/oral-timer-controller'

function setup() {
  let clock = 1000
  const timer = createOralTimerController(() => clock)
  timer.select('round-a', 0, true, '切换题目')
  return {
    timer,
    advance: (elapsed: number) => {
      clock += elapsed
    },
  }
}
describe('口述倒计时只作当前窗口的练习提醒', () => {
  it('默认关闭/2分钟，没有自动开始', () => {
    const { timer, advance } = setup()
    expect(timer.getState()).toMatchObject({
      enabled: false,
      timer: { duration: 120, remaining: 120000, status: 'idle' },
    })
    timer.start()
    advance(300000)
    timer.tick()
    expect(timer.getState().timer).toMatchObject({ remaining: 120000, status: 'idle' })
  })
  it('按实际单调截止时间处理不规则/延迟轮询，到时为0且只通知一次', () => {
    const { timer, advance } = setup(),
      changed = vi.fn()
    timer.enable(true)
    timer.start()
    timer.subscribe(changed)
    advance(12345)
    timer.tick()
    expect(timer.getState().timer?.remaining).toBe(107655)
    advance(200000)
    timer.tick()
    expect(timer.getState().timer).toMatchObject({ status: 'expired', remaining: 0 })
    const calls = changed.mock.calls.length
    advance(90000)
    timer.tick()
    timer.start()
    expect(changed).toHaveBeenCalledTimes(calls)
  })
  it('暂停结算实际余时，暂停期间不走，再开始接续余时', () => {
    const { timer, advance } = setup()
    timer.enable(true)
    timer.start()
    advance(1501)
    timer.pause()
    expect(timer.getState().timer).toMatchObject({ remaining: 118499, status: 'paused' })
    advance(400000)
    timer.tick()
    expect(timer.getState().timer?.remaining).toBe(118499)
    timer.start()
    advance(118498)
    timer.tick()
    expect(timer.getState().timer?.remaining).toBe(1)
    advance(1)
    timer.pause()
    expect(timer.getState().timer).toMatchObject({ status: 'expired', remaining: 0 })
  })
  it('重复开始不重置截止，重复暂停不扣除额外时间', () => {
    const { timer, advance } = setup()
    timer.enable(true)
    timer.start()
    advance(5000)
    timer.start()
    advance(5000)
    timer.pause()
    timer.pause()
    expect(timer.getState().timer?.remaining).toBe(110000)
  })
  it('关闭开关暂停，重新启用不会自动恢复', () => {
    const { timer, advance } = setup()
    timer.enable(true)
    timer.start()
    advance(10000)
    timer.enable(false)
    advance(60000)
    timer.enable(true)
    timer.tick()
    expect(timer.getState().timer).toMatchObject({ remaining: 110000, status: 'paused' })
  })
  it('本题可选时长和重置均须重新开始，不改别题计时', () => {
    const { timer, advance } = setup()
    timer.enable(true)
    timer.reset(60)
    timer.start()
    advance(1000)
    timer.select('round-a', 1, true, '切换题目')
    expect(timer.getState().timer).toMatchObject({
      duration: 120,
      remaining: 120000,
      status: 'idle',
    })
    timer.reset(300)
    timer.start()
    advance(2000)
    timer.select('round-a', 0, true, '切换题目')
    expect(timer.getState().timer).toMatchObject({
      duration: 60,
      remaining: 59000,
      status: 'paused',
    })
    timer.reset()
    expect(timer.getState().timer).toMatchObject({ duration: 60, remaining: 60000, status: 'idle' })
    timer.select('round-a', 1, true, '切换题目')
    expect(timer.getState().timer).toMatchObject({
      duration: 300,
      remaining: 298000,
      status: 'paused',
    })
  })
  it.each(['揭晓', '保存失败', '未知回执', '关闭准备', '返回首页'])(
    '%s阶段暂停且不可恢复，回到可操作状态仍须手动开始',
    (reason) => {
      const { timer, advance } = setup()
      timer.enable(true)
      timer.start()
      advance(7000)
      timer.select('round-a', 0, false, reason)
      timer.start()
      advance(600000)
      timer.tick()
      expect(timer.getState().timer).toMatchObject({ remaining: 113000, status: 'paused', reason })
      timer.select('round-a', 0, true, '')
      expect(timer.getState().timer?.status).toBe('paused')
    },
  )
  it('新轮默认关闭并清空旧计时，结束不再运行', () => {
    const { timer, advance } = setup()
    timer.enable(true)
    timer.start()
    advance(6000)
    timer.select('round-a', null, false, '本轮结束')
    advance(200000)
    timer.tick()
    expect(timer.getState().timer).toBeNull()
    timer.select('round-b', 0, true, '新轮')
    expect(timer.getState()).toMatchObject({
      enabled: false,
      timer: { remaining: 120000, status: 'idle' },
    })
    timer.select('round-a', 0, true, '原轮')
    expect(timer.getState()).toMatchObject({
      enabled: false,
      timer: { remaining: 120000, status: 'idle' },
    })
  })
  it('非法时长不改状态，释放后不再发通知', () => {
    const { timer, advance } = setup()
    timer.enable(true)
    const original = timer.getState()
    expect(() => timer.reset(30 as 60)).toThrow(RangeError)
    expect(timer.getState()).toBe(original)
    const changed = vi.fn()
    timer.subscribe(changed)
    timer.dispose()
    advance(500000)
    timer.tick()
    timer.enable(true)
    timer.select('round-b', 0, true, '')
    expect(changed).not.toHaveBeenCalled()
  })
})
