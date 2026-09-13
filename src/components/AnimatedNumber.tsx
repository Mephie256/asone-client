/**
 * A number that counts up to its value.
 *
 * Two things it has to get right, and both are easy to get wrong:
 *
 * **It counts from the previous value, not from zero.** Queries go stale
 * after thirty seconds, so a figure on the dashboard is refetched while
 * somebody is looking at it. Restarting from zero every time made a stock
 * level appear to reset — 16,482 dropping to 0 and climbing back looks like
 * a fault, not a flourish. Only the first appearance starts at zero.
 *
 * **It obeys `prefers-reduced-motion`.** Somebody who has asked their
 * system for less movement gets the number, immediately. The rest of the
 * stylesheet honours that setting; this has to as well.
 */

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number | undefined
  loading?: boolean
  durationMs?: number
}

/** Ease-out expo: fast at first, settling gently. */
function ease(progress: number): number {
  return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

export function AnimatedNumber({
  value,
  loading = false,
  durationMs = 900,
}: AnimatedNumberProps) {
  // Initialised from the value rather than zero, so a figure that is already
  // loaded on first render does not animate at all — there is nothing to
  // announce, it was simply there.
  const [displayValue, setDisplayValue] = useState(value ?? 0)

  // What is on screen right now, readable without re-running the effect.
  // State cannot serve here: the effect would have to depend on it and
  // would then restart the animation on every frame it produced.
  const shown = useRef(displayValue)

  // Read once. Someone who changes this setting mid-session will see the
  // old behaviour until reload, which is a fair trade for not holding a
  // media-query listener open on every figure on the screen.
  const [reduced] = useState(prefersReducedMotion)

  useEffect(() => {
    // Nothing to animate: the reduced-motion path renders `value` straight
    // out below, so there is no state to keep in step.
    if (loading || value === undefined || reduced) return

    const from = shown.current
    if (from === value) return

    const startTime = performance.now()
    let frame = 0

    function step(now: number) {
      const progress = Math.min((now - startTime) / durationMs, 1)
      const current = Math.round(from + (value! - from) * ease(progress))

      shown.current = current
      setDisplayValue(current)

      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, loading, durationMs, reduced])

  if (loading) return <span>—</span>

  // Derived during render rather than pushed into state by the effect —
  // which is both simpler and what the lint rule is asking for.
  const shownValue = reduced ? (value ?? 0) : displayValue
  return <span>{shownValue.toLocaleString()}</span>
}
