import { useEffect, useId, useState } from 'react'

const MAX_VISIBLE_TAGS = 50

export function TagPicker({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  value: string | null
  options: string[]
  disabled: boolean
  onChange: (value: string | null) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const matches = options.filter((tag) => tag.toLowerCase().includes((value ?? '').toLowerCase()))
  const visible = matches.slice(0, MAX_VISIBLE_TAGS)
  const expanded = open && !disabled
  const active = highlighted < visible.length ? highlighted : -1
  useEffect(() => {
    if (expanded && active >= 0)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, expanded, id])
  function choose(tag: string) {
    onChange(tag)
    setOpen(false)
    setHighlighted(-1)
  }
  return (
    <div
      className="tag-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={`${id}-input`}>标签</label>
      <div className="tag-picker-input">
        <input
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? `${id}-options` : undefined}
          aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
          placeholder="搜索并选择标签，也可填写完整标签"
          autoComplete="off"
          value={value ?? ''}
          disabled={disabled}
          onFocus={() => {
            setOpen(true)
            setHighlighted(-1)
          }}
          onChange={(event) => {
            onChange(event.currentTarget.value || null)
            setOpen(true)
            setHighlighted(-1)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setHighlighted(
                visible.length === 0
                  ? -1
                  : event.key === 'ArrowDown'
                    ? (active + 1) % visible.length
                    : (active <= 0 ? visible.length : active) - 1,
              )
            } else if (event.key === 'Enter' && expanded && active >= 0) {
              event.preventDefault()
              choose(visible[active]!)
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="tag-clear"
            aria-label={`${label}清除`}
            disabled={disabled}
            onClick={() => {
              onChange(null)
              setHighlighted(-1)
            }}
          >
            清除
          </button>
        )}
      </div>
      {expanded && (
        <div className="tag-suggestions">
          <ul id={`${id}-options`} role="listbox" aria-label={`${label}候选`}>
            {visible.map((tag, index) => (
              <li key={tag} role="presentation">
                <button
                  type="button"
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && <p>暂无匹配标签；仍可按填写的完整标签筛选。</p>}
          {matches.length > MAX_VISIBLE_TAGS && (
            <p>共 {matches.length} 个匹配标签，显示前 50 个，请继续输入缩小范围。</p>
          )}
        </div>
      )}
    </div>
  )
}
