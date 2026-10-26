import { useEffect, useRef, useState } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'

export function PracticeFavorite({
  identity,
  disabled,
  onBusyChange,
  onOperation,
}: {
  identity: QuestionIdentity
  disabled: boolean
  onBusyChange: (busy: boolean) => void
  onOperation: (operation: Promise<boolean>) => void
}) {
  const [favorite, setFavorite] = useState<boolean>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const live = useRef(false)
  const pending = useRef<boolean | undefined>(undefined)
  const locked = useRef(false)
  useEffect(() => {
    live.current = true
    let current = true
    setFavorite(undefined)
    setError('')
    void window.desktop.library
      .getQuestion(identity)
      .then((result) => {
        if (!current) return
        if (result.ok) setFavorite(result.value.favorite)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取收藏状态，请重试。')
      })
    return () => {
      current = false
      live.current = false
    }
  }, [identity.topicId, identity.questionId, attempt])
  function save() {
    if (disabled || locked.current || favorite === undefined) return
    const target = pending.current ?? !favorite
    pending.current = target
    locked.current = true
    setBusy(true)
    setError('')
    onBusyChange(true)
    const work = (async () => {
      try {
        const result = await window.desktop.library.setFavorite({ ...identity, favorite: target })
        if (!result.ok) throw new Error(result.error.message)
        pending.current = undefined
        if (live.current) setFavorite(result.value.favorite)
        return true
      } catch (failure) {
        if (live.current)
          setError(
            `收藏保存尚未确认：${failure instanceof Error ? failure.message : '请重试原操作。'}`,
          )
        return false
      } finally {
        locked.current = false
        if (live.current) setBusy(false)
        onBusyChange(false)
      }
    })()
    onOperation(work)
  }
  return (
    <div className="practice-favorite">
      <button
        type="button"
        disabled={disabled || busy || (favorite === undefined && !error)}
        aria-pressed={favorite ?? false}
        onKeyDown={(event) => {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
        }}
        onClick={(event) => {
          if (event.detail > 1) return
          if (favorite === undefined) setAttempt((value) => value + 1)
          else save()
        }}
      >
        {busy
          ? '正在保存收藏…'
          : favorite === undefined
            ? error
              ? '重试读取收藏'
              : '正在读取收藏…'
            : pending.current !== undefined
              ? '重试收藏操作'
              : favorite
                ? '取消收藏'
                : '收藏本题'}
      </button>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </div>
  )
}
