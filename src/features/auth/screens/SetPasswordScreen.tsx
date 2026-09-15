/**
 * Replace the password you were handed — the gate between signing in and
 * using the system.
 *
 * ---------------------------------------------------------------------------
 * Why this screen had to exist
 * ---------------------------------------------------------------------------
 * The server refuses **every** request from an account with
 * `must_change_password` set, with `403 "Set a new password before using the
 * system."` Every account starts that way: a lead creates one, hands over a
 * password they also know, and the account is not that person's until they
 * replace it.
 *
 * The client knew this — `AuthProvider` has computed a `gated` status since
 * the beginning — and then let a gated user straight into the dashboard,
 * where all fourteen requests 403'd. What they saw was "Your dashboard could
 * not be loaded", an empty sidebar, and no way forward. It looked like a
 * broken account rather than one step they had not taken; the account was
 * fine and nothing told them what to do.
 *
 * So `RequireAuth` now sends a gated user here, and this screen is the only
 * thing they can reach until the gate clears.
 *
 * ---------------------------------------------------------------------------
 * It asks for the current password
 * ---------------------------------------------------------------------------
 * `/auth/password/change/` takes both, and that is right even here: the
 * password was handed over in person or by message, so proving they hold it
 * is what makes the new one theirs. It also means somebody who walks up to
 * an unlocked laptop cannot take the account over.
 *
 * The response carries a fresh token pair, which `api/auth.changePassword`
 * stores — the old ones are blacklisted server-side the moment the password
 * changes, so without that the user is signed out the instant they succeed.
 */

import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import * as authApi from '@/api/auth'
import { toApiError, type ApiError } from '@/api/errors'
import { Alert, BrandMark, Button, LoadingScreen, PasswordField, ServerUnreachable } from '@/components'
import { paths } from '@/routes/paths'
import { SplitAuthLayout } from '../components/SplitAuthLayout'
import { useAuth } from '../hooks/useAuth'

export function SetPasswordScreen() {
  const { status, user, refresh, retry } = useAuth()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)

  if (status === 'loading') return <LoadingScreen message="Checking your session…" />
  if (status === 'unreachable') return <ServerUnreachable onRetry={retry} />
  if (status === 'anonymous' || status === 'challenged') {
    return <Navigate to={paths.signIn} replace />
  }
  // The gate is clear — either it never applied or it has just been cleared.
  if (status === 'signedIn') return <Navigate to={paths.dashboard} replace />

  const mismatch = confirm !== '' && next !== confirm
  const ready = current.trim() && next.trim() && next === confirm && !pending

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return

    setPending(true)
    setError(null)
    try {
      await authApi.changePassword({ current_password: current, new_password: next })
      // Re-reads the user, which flips `gated` to `signedIn` and lets the
      // redirect above take them in.
      await refresh()
    } catch (cause) {
      setError(toApiError(cause))
      setPending(false)
    }
  }

  return (
    <SplitAuthLayout>
      <header className="signin__head">
        <BrandMark width={80} label="AsOne" />
        <h1 className="signin__title">Choose your password</h1>
        <p className="signin__subtitle">
          One step before you start. The password you were given is known to
          whoever set up your account — this one is yours alone.
        </p>
      </header>

      <form className="signin__form" onSubmit={handleSubmit} noValidate>
        {error && !error.fields && (
          <Alert tone="error">
            <strong>That did not work.</strong> {error.message}
          </Alert>
        )}

        <PasswordField
          label="Current password"
          autoComplete="current-password"
          required
          autoFocus
          value={current}
          error={error?.fields?.current_password?.[0]}
          onChange={(event) => setCurrent(event.target.value)}
        />

        <PasswordField
          label="New password"
          autoComplete="new-password"
          required
          value={next}
          error={error?.fields?.new_password?.[0]}
          onChange={(event) => setNext(event.target.value)}
        />

        <PasswordField
          label="Repeat new password"
          autoComplete="new-password"
          required
          value={confirm}
          /* Caught here rather than by the server, which is only sent one of
             them and so could never tell them apart. */
          error={mismatch ? 'The two passwords do not match.' : undefined}
          onChange={(event) => setConfirm(event.target.value)}
        />

        <Button type="submit" size="lg" full disabled={!ready}>
          {pending ? 'Saving…' : 'Save and continue'}
        </Button>

        {user && (
          <p className="signin__subtitle">
            Signed in as {user.email}. Not you?{' '}
            <a href={paths.signIn}>Sign in as somebody else</a>.
          </p>
        )}
      </form>
    </SplitAuthLayout>
  )
}
