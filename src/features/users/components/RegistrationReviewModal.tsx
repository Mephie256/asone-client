/**
 * Approve or decline a pending registration request.
 *
 * Reuses `Modal` — the shared dialog shell. This dialog only shows what the
 * registrant already gave (name, email, phone, whether they verified their
 * address) and asks the one question that matters: approve or decline.
 * Approve is always available — a request with a verified email is ready to
 * become somebody's account the moment a lead says so, and the role itself
 * is picked one step later, not here.
 *
 * Clicking "Approve & Create Account" hands off to `AddUserModal` — the same
 * wizard "+ Add User" opens — pre-filled with this person's details so a
 * lead only does the one thing a registrant could not: pick the role (and a
 * site, if that role needs one). That is one dialog closing and another
 * opening, not two screens layered on top of each other.
 */

import { useState } from 'react'
import { Badge, Button, Modal } from '@/components'
import { toApiError, type ApiError } from '@/api/errors'
import { AddUserModal } from './AddUserModal'
import { useDeclineRegistration } from '../hooks/useRegistrationRequests'
import * as registrationsApi from '@/api/registrations'
import type { RegistrationRequest, RoleInfo } from '@/api/types'

interface RegistrationReviewModalProps {
  request: RegistrationRequest
  roles: RoleInfo[]
  onClose: () => void
}

type View = 'review' | 'decline' | 'declined' | 'assign-role'

export function RegistrationReviewModal({ request, roles, onClose }: RegistrationReviewModalProps) {
  const [view, setView] = useState<View>('review')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<ApiError | null>(null)

  const declineMutation = useDeclineRegistration()

  async function handleDecline() {
    setError(null)
    try {
      await declineMutation.mutateAsync({ id: request.id, notes: notes.trim() || undefined })
      setView('declined')
    } catch (cause) {
      setError(toApiError(cause))
    }
  }

  if (view === 'assign-role') {
    return (
      <AddUserModal
        roles={roles}
        prefill={request}
        onClose={onClose}
        onCreate={(input) => registrationsApi.approve(request.id, input)}
      />
    )
  }

  const title =
    view === 'declined'
      ? 'Request declined'
      : view === 'decline'
        ? 'Decline this request?'
        : 'Review registration request'

  return (
    <Modal open title={title} onClose={onClose} size="sm">
      {view === 'review' && (
        <>
          {error && <p className="modal__error">{error.message}</p>}

          <div className="modal__review">
            <div className="modal__review-row">
              <span className="modal__review-label">Full Name</span>
              <span className="modal__review-value modal__review-value--accent">
                {request.first_name} {request.last_name}
              </span>
            </div>
            <div className="modal__review-row">
              <span className="modal__review-label">Email Address</span>
              <span className="modal__review-value">{request.email}</span>
            </div>
            <div className="modal__review-row">
              <span className="modal__review-label">Phone Number</span>
              <span className="modal__review-value">{request.phone_number || '—'}</span>
            </div>
            <div className="modal__review-row">
              <span className="modal__review-label">Email Verified</span>
              <Badge tone={request.is_email_verified ? 'success' : 'warning'}>
                {request.is_email_verified ? 'Verified' : 'Not yet verified'}
              </Badge>
            </div>
          </div>

          <div className="modal__actions">
            <Button variant="secondary" onClick={() => setView('decline')} disabled={declineMutation.isPending}>
              Decline
            </Button>
            <Button onClick={() => setView('assign-role')}>Approve & Create Account</Button>
          </div>
        </>
      )}

      {view === 'decline' && (
        <>
          {error && <p className="modal__error">{error.message}</p>}

          <p className="modal__body-note">
            No account is created and nothing is emailed to {request.first_name}. They will simply
            see no reply and may submit the form again.
          </p>

          <label className="stack-field">
            <span className="stack-field__label">Notes (optional, for your own record)</span>
            <textarea
              className="stack-field__input"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="modal__actions">
            <Button variant="secondary" onClick={() => setView('review')} disabled={declineMutation.isPending}>
              Back
            </Button>
            <Button variant="danger" onClick={() => void handleDecline()} disabled={declineMutation.isPending}>
              {declineMutation.isPending ? 'Declining…' : 'Confirm Decline'}
            </Button>
          </div>
        </>
      )}

      {view === 'declined' && (
        <>
          <p className="modal__body-note">
            The request from {request.first_name} {request.last_name} has been declined.
          </p>
          <div className="modal__actions">
            <Button onClick={onClose}>Done</Button>
          </div>
        </>
      )}
    </Modal>
  )
}
