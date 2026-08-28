import { useState, useMemo, useEffect, useRef, useCallback } from "react"

export interface UseGraphNavigationOptions<T> {
  data: T[]
  interval?: "days" | "weeks" | "months"
  defaultWindowSize?: number
  enabled?: boolean
  minWindowSize?: number
}

export function useGraphNavigation<T extends { label?: string }>({
  data,
  interval = "days",
  defaultWindowSize,
  enabled = true,
  minWindowSize = 3
}: UseGraphNavigationOptions<T>) {
  // Determine standard default window size based on interval
  const resolvedDefaultSize = useMemo(() => {
    if (defaultWindowSize) return Math.min(data.length, defaultWindowSize)
    if (interval === "days") return Math.min(data.length, 7)
    if (interval === "weeks") return Math.min(data.length, 4)
    if (interval === "months") return Math.min(data.length, 6)
    return Math.min(data.length, 7)
  }, [defaultWindowSize, interval, data.length])

  // Current window size (number of points to show)
  const [windowSize, setWindowSize] = useState<number>(resolvedDefaultSize)

  // Offset from the end (0 = latest data, >0 = scrolled back in time)
  const [offsetFromEnd, setOffsetFromEnd] = useState<number>(0)

  // Reset offset and sync windowSize when interval or defaultSize changes
  useEffect(() => {
    setWindowSize(resolvedDefaultSize)
    setOffsetFromEnd(0)
  }, [interval, resolvedDefaultSize])

  // Ensure windowSize stays within [minWindowSize, data.length]
  const clampedWindowSize = useMemo(() => {
    return Math.max(minWindowSize, Math.min(data.length, windowSize))
  }, [minWindowSize, data.length, windowSize])

  // Maximum allowed offset to not scroll beyond index 0
  const maxOffset = Math.max(0, data.length - clampedWindowSize)
  const clampedOffset = Math.max(0, Math.min(maxOffset, offsetFromEnd))

  // Calculate slice indices
  const endIndex = data.length - clampedOffset
  const startIndex = Math.max(0, endIndex - clampedWindowSize)

  const visibleData = useMemo(() => {
    if (!enabled) return data
    return data.slice(startIndex, endIndex)
  }, [data, enabled, startIndex, endIndex])

  const canScrollPast = startIndex > 0
  const canScrollFuture = clampedOffset > 0
  const canZoomIn = clampedWindowSize > minWindowSize
  const canZoomOut = clampedWindowSize < data.length
  const isModified = clampedOffset > 0 || clampedWindowSize !== resolvedDefaultSize

  const scrollPast = useCallback((step = 1) => {
    setOffsetFromEnd(prev => Math.min(maxOffset, prev + step))
  }, [maxOffset])

  const scrollFuture = useCallback((step = 1) => {
    setOffsetFromEnd(prev => Math.max(0, prev - step))
  }, [])

  const zoomIn = useCallback((step = 1) => {
    setWindowSize(prev => Math.max(minWindowSize, prev - step))
  }, [minWindowSize])

  const zoomOut = useCallback((step = 1) => {
    setWindowSize(prev => Math.min(data.length, prev + step))
  }, [data.length])

  const reset = useCallback(() => {
    setWindowSize(resolvedDefaultSize)
    setOffsetFromEnd(0)
  }, [resolvedDefaultSize])

  // Ref for chart wrapper element to listen to wheel events non-passively
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        // Ctrl + Wheel -> Zoom In / Zoom Out
        e.preventDefault()
        if (e.deltaY < 0) {
          zoomIn(1)
        } else if (e.deltaY > 0) {
          zoomOut(1)
        }
      } else {
        // Normal Wheel -> Scroll into past / future
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (Math.abs(delta) > 5) {
          e.preventDefault()
          if (delta < 0) {
            // Wheel up/left -> Go to past
            scrollPast(1)
          } else {
            // Wheel down/right -> Go to future
            scrollFuture(1)
          }
        }
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", handleWheel)
    }
  }, [enabled, zoomIn, zoomOut, scrollPast, scrollFuture])

  return {
    containerRef,
    visibleData,
    startIndex,
    endIndex,
    totalPoints: data.length,
    windowSize: clampedWindowSize,
    offsetFromEnd: clampedOffset,
    canScrollPast,
    canScrollFuture,
    canZoomIn,
    canZoomOut,
    isModified,
    scrollPast,
    scrollFuture,
    zoomIn,
    zoomOut,
    reset
  }
}
