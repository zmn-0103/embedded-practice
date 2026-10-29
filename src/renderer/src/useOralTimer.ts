import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PracticeEditorState } from './practice-controller'
import { createOralTimerController } from './oral-timer-controller'

export function useOralTimer(state: PracticeEditorState, visible: boolean) {
  const [timer] = useState(() => createOralTimerController())
  const lifecycle = useRef(0)
  const sessionId = state.view?.session.sessionId ?? null
  const position = state.view?.item?.position ?? null
  const available =
    visible &&
    state.view?.session.status === 'active' &&
    position !== null &&
    !state.view?.item?.revealed &&
    !state.busy &&
    !state.closing &&
    !state.pending
  const reason = !visible ? '已离开练习' : state.view?.item?.revealed ? '已揭晓答案' : '练习操作中'
  useLayoutEffect(() => {
    timer.select(sessionId, position, available, reason)
  }, [timer, sessionId, position, available, reason])
  useEffect(() => {
    const epoch = ++lifecycle.current
    let interval: ReturnType<typeof setInterval> | undefined
    const schedule = () => {
      if (timer.getState().timer?.status === 'running') {
        interval ??= setInterval(() => timer.tick(), 250)
      } else {
        clearInterval(interval)
        interval = undefined
      }
    }
    const unsubscribe = timer.subscribe(schedule)
    const unsubscribeNative = window.desktop.practice.onTimerPause(() => timer.pause('窗口未激活'))
    const blur = () => timer.pause('窗口失去焦点')
    const hidden = () => {
      if (document.hidden) timer.pause('窗口已隐藏')
    }
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', hidden)
    schedule()
    return () => {
      unsubscribe()
      unsubscribeNative()
      clearInterval(interval)
      window.removeEventListener('blur', blur)
      document.removeEventListener('visibilitychange', hidden)
      queueMicrotask(() => {
        if (epoch === lifecycle.current) timer.dispose()
      })
    }
  }, [timer])
  return timer
}
