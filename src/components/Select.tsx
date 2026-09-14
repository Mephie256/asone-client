/**
 * Outlined select — the dropdown counterpart to `TextField`.
 *
 * Same frame and notched label so a form mixing text fields and a role or
 * site picker reads as one system, not two different controls glued
 * together.
 */

import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'> {
  label: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, children, ...select }: SelectProps) {
  const id = useId()
  const errorId = `${id}-error`
  const invalid = Boolean(error)

  return (
    <div className={`textfield${invalid ? ' textfield--invalid' : ''}`}>
      <div className="textfield__frame">
        <label className="textfield__label" htmlFor={id}>
          {label}
        </label>

        <select
          id={id}
          className="textfield__input textfield__select"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          {...select}
        >
          {children}
        </select>
      </div>

      {error && (
        <p className="textfield__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}
