/**
 * Add or edit a School — one modal for both.
 *
 * Editing used to be a separate full-page route (`/schools/:id/edit`,
 * `SchoolFormScreen` + `SchoolForm`). Removed in favour of this, so there is
 * one way to add or edit a school, not two. Warehouses and Tailoring
 * Centers had the same modal-add/edit pattern once; both screens are
 * view-only now, so this is the only add/edit modal left in Locations.
 */

import { ChevronDown } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert, Modal } from '@/components'
import { toApiError } from '@/api/errors'
import type { School, SchoolLevel, Warehouse } from '@/api/types'
import { useSaveSchool } from '../hooks/useSaveSchool'

interface AddSchoolModalProps {
  isOpen: boolean
  onClose: () => void
  warehouses: Warehouse[]
  /** Present when editing; absent when adding. */
  school?: School | null
  onSuccess?: (school: School) => void
}

export function AddSchoolModal({
  isOpen,
  onClose,
  warehouses,
  school,
  onSuccess,
}: AddSchoolModalProps) {
  const [name, setName] = useState(school?.name ?? '')
  const [level, setLevel] = useState<SchoolLevel | ''>(school?.level ?? 'PS')
  // '' means "nothing chosen yet", not "no warehouses" — `warehouses` arrives
  // from an async fetch that has often not resolved on first render, so
  // seeding this from `warehouses[0]` at mount time would frequently seed it
  // from an empty list. The effective value below falls back to the first
  // warehouse once the list has actually loaded, computed at render time
  // rather than synced back into state.
  const [warehouseId, setWarehouseId] = useState(
    school?.primary_warehouse ? String(school.primary_warehouse) : '',
  )
  const [address, setAddress] = useState(school?.address ?? '')

  const effectiveWarehouseId = warehouseId || (warehouses[0] ? String(warehouses[0].id) : '')

  const save = useSaveSchool(school?.id)
  const error = save.error ? toApiError(save.error) : null
  const fieldError = (fieldName: string) => error?.fields?.[fieldName]?.[0]

  function handleReset() {
    setName(school?.name ?? '')
    setLevel(school?.level ?? 'PS')
    setWarehouseId(school?.primary_warehouse ? String(school.primary_warehouse) : '')
    setAddress(school?.address ?? '')
    save.reset()
  }

  function handleClose() {
    handleReset()
    onClose()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !level || !effectiveWarehouseId) return

    save.mutate(
      {
        name: name.trim(),
        level,
        primary_warehouse: Number(effectiveWarehouseId),
        // As-is, not `|| undefined` — an edit that clears the address needs
        // an explicit "", or PATCH omits the key and the old value survives.
        address: address.trim(),
      },
      {
        onSuccess: (saved) => {
          handleClose()
          onSuccess?.(saved)
        },
      },
    )
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={school ? 'Edit School' : 'Add School'}
      subtitle={
        school
          ? 'Update this school’s details.'
          : 'Register a new school and assign it to a dispatch warehouse.'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && !error.fields && <Alert tone="error">{error.message}</Alert>}

        <div className="schools-form-field">
          <label htmlFor="modal-school-name" className="schools-form-label">
            School Name <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            id="modal-school-name"
            type="text"
            className="schools-form-input"
            placeholder="e.g. St. Mary's Primary School"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          {fieldError('name') && (
            <p className="schools-form-error">{fieldError('name')}</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="schools-form-field">
            <label htmlFor="modal-school-type" className="schools-form-label">
              School Type <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div className="schools-form-select-wrapper">
              <select
                id="modal-school-type"
                className="schools-form-select"
                value={level}
                onChange={(e) => setLevel(e.target.value as SchoolLevel)}
                required
              >
                <option value="PS">Primary (PS)</option>
                <option value="HS">High School (HS)</option>
              </select>
              <ChevronDown size={14} className="schools-form-select-chevron" aria-hidden />
            </div>
            {fieldError('level') && (
              <p className="schools-form-error">{fieldError('level')}</p>
            )}
          </div>

          <div className="schools-form-field">
            <label htmlFor="modal-school-warehouse" className="schools-form-label">
              Primary Warehouse <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div className="schools-form-select-wrapper">
              <select
                id="modal-school-warehouse"
                className="schools-form-select"
                value={effectiveWarehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Choose a warehouse…
                </option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="schools-form-select-chevron" aria-hidden />
            </div>
            {fieldError('primary_warehouse') && (
              <p className="schools-form-error">{fieldError('primary_warehouse')}</p>
            )}
          </div>
        </div>

        <div className="schools-form-field">
          <label htmlFor="modal-school-address" className="schools-form-label">
            Address / Location
          </label>
          <input
            id="modal-school-address"
            type="text"
            className="schools-form-input"
            placeholder="e.g. Namayemba Village, Bugiri District"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {fieldError('address') && (
            <p className="schools-form-error">{fieldError('address')}</p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 8,
            paddingTop: 16,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <button
            type="button"
            className="schools-modal-btn-secondary"
            onClick={handleClose}
            disabled={save.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="schools-modal-btn-primary"
            disabled={save.isPending || !name.trim() || !level || !effectiveWarehouseId}
          >
            {save.isPending
              ? 'Saving…'
              : school
                ? 'Save Changes'
                : 'Add School'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
