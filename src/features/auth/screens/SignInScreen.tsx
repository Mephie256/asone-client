/**
 * Sign in — both steps.
 *
 * One route, two steps. The design draws them as separate screens, but they
 * are one sequence: a code screen reachable on its own URL could be landed on
 * with no challenge to answer, which is a dead end that has to be handled.
 * Which step shows is decided by the session's status, so that cannot happen.
 */

import { Navigate } from 'react-router-dom'
import { BrandMark, LoadingScreen, ServerUnreachable } from '@/components'
import { SignInForm } from '../components/SignInForm'
import { SplitAuthLayout } from '../components/SplitAuthLayout'
import { VerifyCodeCard } from '../components/VerifyCodeCard'
import { useAuth } from '../hooks/useAuth'
import { paths } from '@/routes/paths'

export function SignInScreen() {
  const { status, challenge, error, pending, requestCode, submitCode, restart, retry } =
    useAuth()

  // Still asking the server who this is. Rendering the form now would flash
  // sign-in at somebody who is already signed in.
  if (status === 'loading') return <LoadingScreen message="Checking your session…" />

  // Held tokens, no answer from the server — not a reason to offer sign-in.
  if (status === 'unreachable') return <ServerUnreachable onRetry={retry} />

  if (status === 'signedIn' || status === 'gated') {
    return <Navigate to={paths.dashboard} replace />
  }

  if (status === 'challenged' && challenge) {
    return (
      <SplitAuthLayout>
        <VerifyCodeCard
          challenge={challenge}
          onSubmit={submitCode}
          onRestart={restart}
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
        <h1 className="signin__title">AsOne Logistics</h1>
        <p className="signin__subtitle">Inventory Management</p>
      </header>

      <SignInForm
        onSubmit={({ email, password }) => requestCode(email, password)}
        pending={pending}
        error={error}
      />
    </SplitAuthLayout>
  )
}
