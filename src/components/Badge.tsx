/**
 * Status badge — section 05.
 *
 * Tone is a presentation choice, not a business rule. Deciding which tone a
 * given order status gets belongs in `domain/`, so that the mapping is
 * testable and this component stays dumb.
 */

import type { ReactNode } from 'react'

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'

interface BadgeProps {
  tone?: Tone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
