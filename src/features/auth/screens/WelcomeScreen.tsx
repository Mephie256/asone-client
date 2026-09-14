/**
 * Welcome — the way into the system.
 *
 * Brand deck on the left, an invitation on the right. Two ways on: start
 * onboarding, or sign in with an account you already have.
 *
 * "Get Started Onboarding" leads to the registration form. It creates no
 * account: `POST /auth/register/` records a request and emails a code to
 * prove the address. A Program Lead or Operations Manager then approves it
 * and assigns the role — which is the point the account actually exists,
 * because every transaction in this system records who performed it, and
 * nobody self-assigns what they are allowed to do.
 */

import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark, Button, LoadingScreen, ServerUnreachable } from '@/components'
import { SplitAuthLayout } from '../components/SplitAuthLayout'
import { useAuth } from '../hooks/useAuth'
import { paths } from '@/routes/paths'

export function WelcomeScreen() {
  const { status, retry } = useAuth()
  const navigate = useNavigate()

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

        <Button size="lg" onClick={() => navigate(paths.createAccount)}>
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
