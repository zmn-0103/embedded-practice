import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function ImageZoom({ src, alt, close }: { src: string; alt: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState<number>()
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return createPortal(
    <dialog
      ref={dialog}
      className="image-zoom"
      aria-label={`图片预览：${alt || '未命名图片'}`}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="image-zoom-panel">
        <div className="button-row">
          <button type="button" onClick={close}>
            关闭图片
          </button>
          <button
            type="button"
            disabled={zoom <= 1}
            onClick={() => setZoom((value) => value - 0.5)}
          >
            缩小图片
          </button>
          <button
            type="button"
            disabled={zoom >= 3}
            onClick={() => setZoom((value) => value + 0.5)}
          >
            放大图片
          </button>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
        <div className="image-zoom-scroll">
          <img
            src={src}
            alt={alt}
            width={width === undefined ? undefined : Math.min(32_768, Math.round(width * zoom))}
            onLoad={(event) => setWidth(event.currentTarget.naturalWidth)}
          />
        </div>
      </div>
    </dialog>,
    document.body,
  )
}

export function ResourceImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  return failed ? (
    <span className="image-error">图片无法解码或读取：{alt || '未命名图片'}</span>
  ) : (
    <>
      <button
        type="button"
        className="image-preview"
        aria-label={`放大查看：${alt || '未命名图片'}`}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </button>
      {open && <ImageZoom src={src} alt={alt} close={() => setOpen(false)} />}
    </>
  )
}
