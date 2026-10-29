import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import {
  ORAL_DURATIONS,
  type OralDuration,
  type OralTimerController,
} from '../oral-timer-controller'

export function OralTimer({
  controller,
  disabled,
}: {
  controller: OralTimerController
  disabled: boolean
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState)
  const panel = useRef<HTMLElement>(null)
  const timer = state.timer
  useEffect(() => {
    if (disabled) controller.pause('练习操作中')
  }, [controller, disabled])
  const seconds = Math.ceil((timer?.remaining ?? 120000) / 1000)
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const blocked = disabled || !state.available
  function keepControlsVisible() {
    const element = panel.current
    if (!element || !state.enabled) return
    const box = element.getBoundingClientRect()
    const reserved =
      Number.parseFloat(getComputedStyle(element).getPropertyValue('--practice-actions-height')) ||
      0
    if (box.top < 0 || box.bottom > window.innerHeight - reserved) window.scrollBy(0, box.top - 8)
  }
  // 仅主动展开或聚焦定位，倒数更新与到时不干扰阅读位置。
  useLayoutEffect(() => {
    if (state.enabled) keepControlsVisible()
  }, [state.enabled])
  return (
    <section
      ref={panel}
      onFocusCapture={keepControlsVisible}
      className="oral-timer"
      aria-label="口述计时"
      data-enabled={state.enabled}
    >
      <label className="oral-timer-toggle">
        <input
          type="checkbox"
          checked={state.enabled}
          disabled={disabled || !timer || (!state.available && !state.enabled)}
          onChange={(event) => controller.enable(event.currentTarget.checked)}
        />
        启用口述计时（可选）
      </label>
      {state.enabled && timer && (
        <>
          <div className="oral-timer-controls">
            <span
              role="timer"
              aria-live="off"
              aria-label="本题剩余时间"
              className="oral-timer-clock"
            >
              {clock}
            </span>
            <label>
              本题时长
              <select
                aria-label="本题口述时长"
                disabled={blocked || timer.status === 'running'}
                value={timer.duration}
                onChange={(event) =>
                  controller.reset(Number(event.currentTarget.value) as OralDuration)
                }
              >
                {ORAL_DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration / 60} 分钟
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={blocked || timer.status === 'expired'}
              onClick={() => (timer.status === 'running' ? controller.pause() : controller.start())}
            >
              {timer.status === 'running'
                ? '暂停计时'
                : timer.status === 'paused'
                  ? '继续计时'
                  : '开始计时'}
            </button>
            <button type="button" disabled={blocked} onClick={() => controller.reset()}>
              重置本题计时
            </button>
            <span className="muted">
              {timer.status === 'idle'
                ? '尚未开始'
                : timer.status === 'running'
                  ? '口述中'
                  : timer.status === 'paused'
                    ? `已暂停 · ${timer.reason}`
                    : '已到时'}
            </span>
          </div>
          {timer.status === 'expired' && (
            <p role="status" className="oral-timer-reminder">
              本题口述计时已到。
              {state.available ? '仍可继续思考和输入，由你决定何时查看参考答案。' : ''}
            </p>
          )}
          <p className="muted oral-timer-hint">
            修改时长或重置会重新计本题；新题默认2分钟，须自行开始。到时仅提醒，关闭程序后计时重置。
          </p>
        </>
      )}
    </section>
  )
}
