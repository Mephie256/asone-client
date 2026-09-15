/**
 * Pick a SKU by typing its code.
 *
 * A dropdown of forty entries is fine on a form somebody fills in twice a
 * year. It is the wrong control for a warehouse, where the person already
 * knows the code — it is printed on the shelf label and on the packing list
 * in their hand — and wants to type four digits rather than scroll a list
 * ordered by something they did not choose.
 *
 * Built on `<input list>` and `<datalist>` rather than a hand-rolled
 * combobox. The browser does the filtering, the keyboard handling, the
 * screen-reader announcements and the touch behaviour, and it does all of
 * them better than a first attempt would. It also means no new interaction
 * pattern enters this codebase for the sake of one field.
 *
 * Matching is on the code, the garment name and the size, so "1000" finds a
 * code and "tunic" finds a garment. The value the browser puts back in the
 * input is the option's `value`, which is why the code is the value and the
 * description is the label.
 */

import { useId, useMemo, useState } from 'react'
import type { Sku } from '@/api/types'

interface SkuPickerProps {
  skus: readonly Sku[]
  value: number | null
  onChange: (skuId: number | null) => void
  /** Ids omitted from the list — SKUs already used on another line. */
  exclude?: ReadonlySet<number>
  label: string
  id: string
  placeholder?: string
  disabled?: boolean
}

export function SkuPicker({
  skus,
  value,
  onChange,
  exclude,
  label,
  id,
  placeholder = 'Type a code, garment or size…',
  disabled,
}: SkuPickerProps) {
  const listId = useId()
  const chosen = skus.find((sku) => sku.id === value) ?? null

  /*
    The typed text is held separately from the chosen SKU. They are not the
    same thing: mid-word the text matches nothing, and clearing the field
    should clear the choice rather than silently keep the last valid one.
  */
  const [text, setText] = useState(chosen?.number ?? '')

  const options = useMemo(
    () => skus.filter((sku) => sku.id === value || !exclude?.has(sku.id)),
    [skus, value, exclude],
  )

  function resolve(next: string) {
    setText(next)
    const needle = next.trim().toLowerCase()
    if (!needle) {
      onChange(null)
      return
    }
    // Exact code first — that is what a scanner and a typed code both give.
    const match =
      options.find((sku) => sku.number.toLowerCase() === needle) ??
      options.find((sku) => describe(sku).toLowerCase() === needle) ??
      null
    onChange(match?.id ?? null)
  }

  return (
    <>
      <input
        id={id}
        className="input"
        type="text"
        list={listId}
        autoComplete="off"
        aria-label={label}
        /* Aria-invalid while the text matches nothing, so the field says so
           rather than looking filled in and posting nothing. */
        aria-invalid={text.trim() !== '' && value === null ? true : undefined}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        onChange={(event) => resolve(event.target.value)}
      />

      <datalist id={listId}>
        {options.map((sku) => (
          <option key={sku.id} value={sku.number}>
            {describe(sku)}
          </option>
        ))}
      </datalist>

      {/*
        The code alone does not tell anyone what they picked. Echoed back in
        words so a mistyped digit is caught before posting, not after.
      */}
      {chosen ? (
        <p className="field__hint">{describe(chosen)}</p>
      ) : text.trim() !== '' ? (
        <p className="field-error">No item matches “{text.trim()}”.</p>
      ) : null}
    </>
  )
}

function describe(sku: Sku): string {
  return `${sku.garment_name} size ${sku.size_name}`
}
