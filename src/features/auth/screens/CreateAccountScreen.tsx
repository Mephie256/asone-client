/**
 * Create Account — three states, one route.
 *
 * 1. The form: name, email, phone. Submitting immediately emails a code —
 *    `POST /auth/register/` sends it the moment the request is created.
 * 2. Verify Email: the registrant proves they hold that address. This does
 *    not create an account or sign anyone in — it unlocks the request for
 *    a lead to review.
 * 3. Submitted: confirmation that a lead's review is next. A second,
 *    separate code follows later, by email, once a lead approves and
 *    assigns a role — the same confirmation `POST /auth/users/` sends
 *    today.
 */

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import * as authApi from '@/api/auth'
import { toApiError, type ApiError } from '@/api/errors'
import type { RegistrationRequest } from '@/api/types'
import { BrandMark, Button, LoadingScreen, ServerUnreachable } from '@/components'
import { paths } from '@/routes/paths'
import { CreateAccountForm } from '../components/CreateAccountForm'
import { SplitAuthLayout } from '../components/SplitAuthLayout'
import { VerifyEmailCard } from '../components/VerifyEmailCard'
import { useAuth } from '../hooks/useAuth'

export function CreateAccountScreen() {
  const { status, retry } = useAuth()
  const [registration, setRegistration] = useState<RegistrationRequest | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)

  if (status === 'loading') return <LoadingScreen message="Checking your session…" />
  if (status === 'unreachable') return <ServerUnreachable onRetry={retry} />
  if (status === 'signedIn' || status === 'gated') {
    return <Navigate to={paths.dashboard} replace />
  }

  async function handleRequest(input: Parameters<typeof authApi.requestAccount>[0]) {
    setPending(true)
    setError(null)
    try {
      const created = await authApi.requestAccount(input)
      setRegistration(created)
    } catch (cause) {
      setError(toApiError(cause))
    } finally {
      setPending(false)
    }
  }

  async function handleVerify(code: string) {
    if (!registration) return
    setPending(true)
    setError(null)
    try {
      await authApi.confirmRegistration({ email: registration.email, code })
      setSubmitted(true)
    } catch (cause) {
      setError(toApiError(cause))
    } finally {
      setPending(false)
    }
  }

  if (submitted && registration) {
    return (
      <SplitAuthLayout>
        <div className="auth-card">
          <h1 className="auth-card__title">Request submitted</h1>
          <p className="auth-card__body">
            Your email is confirmed. AsOne's team will review your request and assign you a
            role — you'll hear from them at <strong>{registration.email}</strong> once that's
            done.
          </p>
          <Button onClick={() => (window.location.href = paths.signIn)}>Back to sign in</Button>
        </div>
      </SplitAuthLayout>
    )
  }

  if (registration) {
    return (
      <SplitAuthLayout>
        <VerifyEmailCard
          email={registration.email}
          onSubmit={handleVerify}
          pending={pending}
          error={error}
        />
      </SplitAuthLayout>
    )
  }

  return (
    <SplitAuthLayout>
      <header className="signin__head">
        <BrandMark width={80} label="AsOne" />
        <h1 className="signin__title">Create Your Account</h1>
        <p className="signin__subtitle">Join the unified uniform management network</p>
      </header>

      <CreateAccountForm onSubmit={handleRequest} pending={pending} error={error} />
    </SplitAuthLayout>
  )
}
