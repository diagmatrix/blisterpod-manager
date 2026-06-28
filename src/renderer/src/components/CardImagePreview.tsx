import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Delay before the preview appears, so it only shows on a deliberate hover. */
const HOVER_DELAY_MS = 450
/** Preview width in px; height derives from the card aspect ratio (488/680). */
const PREVIEW_WIDTH = 224
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 680) / 488)
/** Gap between the cursor and the preview edge. */
const CURSOR_OFFSET = 16
/** Minimum margin to keep the preview inside the viewport. */
const VIEWPORT_MARGIN = 8

interface PreviewState {
  src: string
  x: number
  y: number
}

function PreviewPortal({ src, x, y }: PreviewState) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Prefer the right of the cursor, flip to the left if it would overflow.
  let left = x + CURSOR_OFFSET
  if (left + PREVIEW_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
    left = x - CURSOR_OFFSET - PREVIEW_WIDTH
  }
  const top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(y - PREVIEW_HEIGHT / 2, window.innerHeight - PREVIEW_HEIGHT - VIEWPORT_MARGIN)
  )

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 transition-opacity duration-150"
      style={{ left, top, width: PREVIEW_WIDTH, opacity: visible ? 1 : 0 }}
    >
      <img
        src={src}
        alt=""
        className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-black/30"
      />
    </div>,
    document.body
  )
}

/**
 * Hover-to-preview for card rows: spread `bind(src)` onto the hoverable element
 * and render `element` once anywhere in the tree. After a short hover delay a
 * large card image appears as a tooltip near the cursor.
 */
export function useCardImagePreview() {
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const timerRef = useRef<number | null>(null)
  const posRef = useRef({ x: 0, y: 0 })

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const bind = useCallback(
    (src: string | null) => ({
      onMouseEnter: (e: React.MouseEvent) => {
        if (!src) return
        posRef.current = { x: e.clientX, y: e.clientY }
        clearTimer()
        timerRef.current = window.setTimeout(() => {
          setPreview({ src, ...posRef.current })
        }, HOVER_DELAY_MS)
      },
      onMouseMove: (e: React.MouseEvent) => {
        posRef.current = { x: e.clientX, y: e.clientY }
        setPreview((prev) => (prev && prev.src === src ? { ...prev, x: e.clientX, y: e.clientY } : prev))
      },
      onMouseLeave: () => {
        clearTimer()
        setPreview(null)
      },
    }),
    [clearTimer]
  )

  const element = preview ? <PreviewPortal {...preview} /> : null

  return { bind, element }
}
