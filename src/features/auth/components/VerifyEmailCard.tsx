/**
 * Confirming the address a just-submitted registration request was made
 * with. Mirrors `VerifyCodeCard`'s shape — both are "enter the 6-digit code
 * we emailed you" moments — but this one sits right after Create Account,
 * before any lead is involved: it unlocks the request for review, it does
 * not create an account or sign anyone in.
 */

import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Alert, Button, OtpInput } from '@/components'
import type { ApiError } from '@/api/errors'

const CODE_LENGTH = 6

interface VerifyEmailCardProps {
  email: string
  onSubmit: (code: string) => void
  pending: boolean
  error: ApiError | null
}

export function VerifyEmailCard({ email, onSubmit, pending, error }: VerifyEmailCardProps) {
  const [code, setCode] = useState('')
  const complete = code.length === CODE_LENGTH

  return (
    <div className="auth-card">
      <div className="auth-card__halo">
        <Mail size={30} aria-hidden />
      </div>

      <h1 className="auth-card__title">Verify Your Email</h1>

      <p className="auth-card__body">
        We've sent a {CODE_LENGTH}-digit verification code to <strong>{email}</strong>
      </p>

      {error && <Alert tone="error">{error.message}</Alert>}

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={onSubmit}
        length={CODE_LENGTH}
        disabled={pending}
        invalid={Boolean(error)}
      />

      <Button size="lg" disabled={!complete || pending} onClick={() => onSubmit(code)}>
        {pending ? 'Verifying…' : 'Verify Code'}
      </Button>
    </div>
  )
}
