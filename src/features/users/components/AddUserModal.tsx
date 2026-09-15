/**
 * "+ Add User" — a 3-step wizard: details, review, done.
 *
 * There is no modal/dialog component anywhere else in this codebase yet —
 * this is the first one. Kept local to this feature rather than promoted to
 * `components/` until a second caller needs a modal shell, so the general
 * case is designed from two examples instead of guessed from one.
 *
 * Step 1 collects the fields; step 2 (of 3 — see the design's "Step 1 of 3")
 * is folded into a review inside step 3 here, because the design's own
 * screenshots show only steps 1 and 3 — nothing distinguishes a separate
 * step 2 from the review. Confirm with the design owner if a distinct
 * middle step is meant to exist.
 *
 * Phone Number is rendered because the design calls for it, but is not sent
 * anywhere: the server's User model has no phone_number field or column at
 * all. Typing one here is silently discarded on submit. This needs either a
 * backend field or a decision to drop the input — see the summary given
 * alongside this screen.
 *
 * A fourth, undesigned state follows a successful Confirm: the server
 * returns the generated password once, on this response only, and it is
 * never emailed (see `api/users.ts`). Dropping it silently would leave the
 * lead with an account they cannot hand off, so it is shown here even
 * though no screenshot covers this moment.
 *
 * `prefill` is this same wizard reached from a registration request instead
 * of a blank form: the fields simply start filled in with what the
 * registrant already gave, still editable, in case a lead needs to correct
 * a typo before assigning a role. `onCreate` is still what actually submits,
 * so the caller decides whether that means `POST /auth/users/` or approving
 * the request; this component only decides what to ask and what to show
 * back.
 *
 * Rendered through a portal into `document.body`, not in place. This is a
 * plain `position: fixed` overlay, not `Modal.tsx`'s `<dialog>` — a real
 * `<dialog>` promotes itself to the browser's top layer regardless of where
 * it sits in the tree, but a `fixed` div is still a descendant of wherever
 * it is mounted, and any ancestor between it and `<body>` is free to affect
 * it. Screens render this from deep inside `AppShell`'s grid, and that grid
 * was enough to squeeze the overlay into the content column instead of the
 * full viewport. Mounting at `<body>` sidesteps the question of which
 * ancestor was responsible, the same way `Modal.tsx` does by construction.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import * as catalogApi from '@/api/catalog'
import { Badge, Button, Select, TextField } from '@/components'
import { toApiError, type ApiError } from '@/api/errors'
import type { RegistrationRequest, RoleInfo } from '@/api/types'

/** What either creation path returns: the account, and its password once. */
interface Created {
  user: { first_name: string; email: string }
  password: string | null
}

interface AddUserModalProps {
  roles: RoleInfo[]
  onClose: () => void
  /** Pre-fills name, email and phone, and skips straight to the role step. */
  prefill?: RegistrationRequest
  onCreate: (input: {
    first_name: string
    last_name: string
    email: string
    role: string
    warehouse?: number
    school?: number
    must_change_password: true
  }) => Promise<Created>
}

interface Draft {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role: string
  site: string
}

const EMPTY: Draft = { firstName: '', lastName: '', email: '', phoneNumber: '', role: '', site: '' }

export function AddUserModal({ roles, onClose, onCreate, prefill }: AddUserModalProps) {
  const [step, setStep] = useState<1 | 3>(1)
  const [draft, setDraft] = useState<Draft>(
    prefill
      ? {
          ...EMPTY,
          firstName: prefill.first_name,
          lastName: prefill.last_name,
          email: prefill.email,
          phoneNumber: prefill.phone_number,
        }
      : EMPTY,
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [created, setCreated] = useState<Created | null>(null)

  const role = roles.find((entry) => entry.value === draft.role) ?? null
  const siteKind = role?.requires_site ?? null // "warehouse" | "school" | null

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => catalogApi.warehouses(),
    enabled: siteKind === 'warehouse',
  })
  const { data: schools } = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => catalogApi.schools(),
    enabled: siteKind === 'school',
  })

  const sites = siteKind === 'warehouse' ? warehouses?.results : siteKind === 'school' ? schools?.results : []

  const complete =
    draft.firstName.trim() &&
    draft.lastName.trim() &&
    draft.email.trim() &&
    draft.role &&
    (!siteKind || draft.site)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleConfirm() {
    if (!role) return
    setPending(true)
    setError(null)
    try {
      const result = await onCreate({
        first_name: draft.firstName,
        last_name: draft.lastName,
        email: draft.email,
        role: role.value,
        warehouse: siteKind === 'warehouse' && draft.site ? Number(draft.site) : undefined,
        school: siteKind === 'school' && draft.site ? Number(draft.site) : undefined,
        must_change_password: true,
      })
      setPending(false)
      if (result.password) {
        setCreated(result)
      } else {
        onClose()
      }
    } catch (cause) {
      setError(toApiError(cause))
      setPending(false)
    }
  }

  const siteName = sites?.find((entry) => String(entry.id) === draft.site)?.name

  return createPortal(
    <div className="adduser-overlay" role="presentation" onClick={onClose}>
      <div
        className="adduser-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="adduser__head">
          <h2 className="adduser__title" id="add-user-title">
            Add New User
          </h2>
          <span className="modal__step">Step {step} of 3</span>
          <button type="button" className="adduser__close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="modal__progress">
          <span className={`modal__progress-bar${step >= 1 ? ' modal__progress-bar--done' : ''}`} />
          <span className={`modal__progress-bar${step >= 3 ? ' modal__progress-bar--done' : ''}`} />
          <span className="modal__progress-bar" />
        </div>

        {step === 1 && (
          <div className="adduser__body">
            <div className="modal__grid">
              <TextField
                label="First Name"
                required
                value={draft.firstName}
                onChange={(event) => update('firstName', event.target.value)}
              />
              <TextField
                label="Last Name"
                required
                value={draft.lastName}
                onChange={(event) => update('lastName', event.target.value)}
              />
            </div>

            <TextField
              label="Email Address"
              type="email"
              required
              value={draft.email}
              onChange={(event) => update('email', event.target.value)}
            />

            <TextField
              label="Phone Number"
              type="tel"
              value={draft.phoneNumber}
              onChange={(event) => update('phoneNumber', event.target.value)}
            />

            <Select
              label="Role"
              required
              value={draft.role}
              onChange={(event) => {
                update('role', event.target.value)
                update('site', '')
              }}
            >
              <option value="" disabled>
                Select a role
              </option>
              {roles.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </Select>

            {siteKind && (
              <Select
                label="Assigned Site"
                required
                value={draft.site}
                onChange={(event) => update('site', event.target.value)}
              >
                <option value="" disabled>
                  Select a {siteKind}
                </option>
                {(sites ?? []).map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            )}

            {role && (
              <div className="modal__permissions-preview">
                <p className="modal__permissions-title">Role Permissions Preview</p>
                <p className="modal__permissions-summary">{role.summary}</p>
              </div>
            )}

            <div className="modal__actions">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!complete} onClick={() => setStep(3)}>
                Confirm
              </Button>
            </div>
          </div>
        )}

        {created && (
          <div className="adduser__body">
            <div className="modal__review">
              <div className="modal__review-row">
                <span className="modal__review-label">One-time password</span>
                <span className="modal__review-value modal__review-value--accent modal__review-value--mono">
                  {created.password}
                </span>
              </div>
            </div>
            <p className="modal__body-note">
              Shown once — pass this to {created.user.first_name} yourself. It is not emailed and
              cannot be shown again; use "set password" on their account if it is lost.
            </p>
            <div className="modal__actions">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}

        {step === 3 && role && !created && (
          <div className="adduser__body">
            {error && <p className="modal__error">{error.message}</p>}

            <div className="modal__review">
              <div className="modal__review-row">
                <span className="modal__review-label">Full Name</span>
                <span className="modal__review-value modal__review-value--accent">
                  {draft.firstName} {draft.lastName}
                </span>
              </div>
              <div className="modal__review-row">
                <span className="modal__review-label">Email Address</span>
                <span className="modal__review-value">{draft.email}</span>
              </div>
              <div className="modal__review-row">
                <span className="modal__review-label">Phone Number</span>
                <span className="modal__review-value">{draft.phoneNumber || '—'}</span>
              </div>
              <div className="modal__review-row">
                <span className="modal__review-label">System Role</span>
                <Badge tone="info">{role.label}</Badge>
              </div>
              {siteKind && (
                <div className="modal__review-row">
                  <span className="modal__review-label">Assigned Site</span>
                  <span className="modal__review-value">{siteName ?? '—'}</span>
                </div>
              )}
            </div>

            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setStep(1)} disabled={pending}>
                Back
              </Button>
              <Button onClick={() => void handleConfirm()} disabled={pending}>
                {pending ? 'Creating…' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
