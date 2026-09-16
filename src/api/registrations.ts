/**
 * Reviewing registration requests — Program Lead and Operations Manager only.
 *
 * The other half of `requestAccount`/`confirmRegistration` in `auth.ts`: those
 * two let anyone ask for an account and prove their address; everything here
 * is what a lead does once such a request is sitting there verified.
 *
 * `approve` is the same operation as `users.create()` — it supplies the one
 * thing a registrant could not (the role, and the site it requires) and
 * returns the same shape: the account, and a password shown back once. It is
 * never emailed, so losing it here means using `users.setPassword()` after.
 */

import { get, post } from './http'
import type { Page, RegistrationRequest, UserAdmin } from './types'

/** What `approve` returns — the account created, and its password, once. */
export interface ApprovedRegistration {
  user: UserAdmin
  password: string | null
  detail: string
}

export function list(params?: {
  status?: 'PENDING' | 'APPROVED' | 'DECLINED'
  page?: number
}) {
  return get<Page<RegistrationRequest>>('/auth/registration-requests/', params ?? undefined)
}

export function retrieve(id: number) {
  return get<RegistrationRequest>(`/auth/registration-requests/${id}/`)
}

/**
 * Approve — supplies the role (and site, if that role requires one) a
 * registrant could not choose for themselves. Creates the account and emails
 * a confirmation code, exactly as `users.create()` does.
 *
 * 409 if the request was already approved or declined by somebody else in
 * the meantime; 400 if the email was never verified.
 */
export function approve(
  id: number,
  body: { role: string; warehouse?: number; school?: number },
) {
  return post<ApprovedRegistration>(`/auth/registration-requests/${id}/approve/`, body)
}

/**
 * Decline — no account is created and nothing is emailed to the registrant.
 * `notes` is for the lead's own record; the registrant never sees it.
 */
export function decline(id: number, body?: { notes?: string }) {
  return post<RegistrationRequest>(`/auth/registration-requests/${id}/decline/`, body ?? {})
}
