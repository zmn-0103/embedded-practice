import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { NoteController } from './note-controller'

export function useNoteSaveCoordinator() {
  const savers = useRef(new Set<NoteController>())
  const job = useRef<Promise<boolean> | undefined>(undefined)
  const [blocked, setBlocked] = useState(false)
  const [flushing, setFlushing] = useState(false)
  const hasPending = useCallback(() => [...savers.current].some((saver) => saver.hasPending()), [])
  const register = useCallback(
    (saver: NoteController) => {
      savers.current.add(saver)
      let revision = saver.getState().note?.revision
      const refresh = () => {
        const note = saver.getState().note
        if (note && note.revision !== revision) {
          revision = note.revision
          for (const other of savers.current) {
            const current = other.getState().note
            if (
              other !== saver &&
              current &&
              current.topicId === note.topicId &&
              current.questionId === note.questionId &&
              current.revision !== note.revision &&
              !other.hasPending()
            )
              void other.load()
          }
        }
        setBlocked(hasPending())
      }
      const unsubscribe = saver.subscribe(refresh)
      refresh()
      return () => {
        unsubscribe()
        savers.current.delete(saver)
        refresh()
      }
    },
    [hasPending],
  )
  const flush = useCallback((): Promise<boolean> => {
    if (job.current) return job.current
    if (!hasPending()) return Promise.resolve(true)
    setFlushing(true)
    const pending = (async () => {
      for (const saver of [...savers.current]) if (!(await saver.flush())) return false
      return !hasPending()
    })()
      .catch(() => false)
      .finally(() => {
        if (job.current === pending) job.current = undefined
        setBlocked(hasPending())
        setFlushing(false)
      })
    job.current = pending
    return pending
  }, [hasPending])
  return useMemo(
    () => ({ register, flush, hasPending, blocked, flushing }),
    [register, flush, hasPending, blocked, flushing],
  )
}
export const NoteSaveContext = createContext<ReturnType<typeof useNoteSaveCoordinator> | null>(null)
export function useNoteSaves() {
  const coordinator = useContext(NoteSaveContext)
  if (!coordinator) throw new Error('个人笔记需要页面保存协调器。')
  return coordinator
}
