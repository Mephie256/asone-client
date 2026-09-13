/**
 * Welcome — the way into the system.
 *
 * Brand deck on the left, an invitation on the right. Two ways on: start
 * onboarding, or sign in with an account you already have.
 *
 * "Get Started Onboarding" has nothing behind it. Accounts in this system
 * are created by a Program Lead or Operations Manager through
 * `POST /auth/users/` — there is no self-service sign-up endpoint, and given
 * that every transaction records who performed it, self-registration may not
 * be something AsOne wants at all. The button is rendered because the design
 * calls for it; it needs either an endpoint or a decision.
 */

import { Link, Navigate } from 'react-router-dom'
import { BrandMark, Button, LoadingScreen, ServerUnreachable } from '@/components'
import { SplitAuthLayout } from '../components/SplitAuthLayout'
import { useAuth } from '../hooks/useAuth'
import { paths } from '@/routes/paths'

export function WelcomeScreen() {
  const { status, retry } = useAuth()

  // Still asking the server who this is; showing the marketing panel now
  // would flash it at somebody already signed in.
  if (status === 'loading') return <LoadingScreen message="Checking your session…" />

  // Held tokens, no answer from the server — not a reason to offer sign-in.
  if (status === 'unreachable') return <ServerUnreachable onRetry={retry} />

  // Signed in already: "/" is the app, not an invitation to sign up. Without
  // this, visiting the root while authenticated lands on a screen offering
  // to sign in, which reads as having been signed out.
  if (status === 'signedIn' || status === 'gated') {
    return <Navigate to={paths.dashboard} replace />
  }

  return (
    <SplitAuthLayout>
      <div className="welcome">
        <header className="signin__head">
          <BrandMark width={80} label="AsOne" />
          <h1 className="signin__title">AsOne Logistics</h1>
          <p className="signin__subtitle">Inventory Management</p>
        </header>

        <p className="welcome__body">
          Streamline your warehouse operations, track uniforms across regions, and manage
          inventory allocations all in one unified logistics dashboard.
        </p>

        <Button size="lg" disabled>
          Get Started Onboarding
        </Button>

        <p className="signin__request">
          Already have an account?{' '}
          <Link className="link-accent" to={paths.signIn}>
            Sign In
          </Link>
        </p>
      </div>
    </SplitAuthLayout>
  )
}
