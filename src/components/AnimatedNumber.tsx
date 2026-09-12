import { useEffect, useState } from 'react'

interface AnimatedNumberProps {
  value: number | undefined
  loading?: boolean
  durationMs?: number
}

export function AnimatedNumber({
  value,
  loading = false,
  durationMs = 900,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (loading || value === undefined) {
      setDisplayValue(0)
      return
    }

    if (value === 0) {
      setDisplayValue(0)
      return
    }

    const start = 0
    const target = value
    const startTime = performance.now()

    let animationFrameId: number

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Ease-out expo curve for a smooth, premium count up
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(start + (target - start) * ease)

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(target)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [value, loading, durationMs])

  if (loading) return <span>—</span>
  return <span>{displayValue.toLocaleString()}</span>
}
