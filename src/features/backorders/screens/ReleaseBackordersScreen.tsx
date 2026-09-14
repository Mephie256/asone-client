/**
 * Release All Eligible — the confirmation before a bulk transfer.
 *
 * Releasing assigns each backorder to a warehouse that holds the stock and
 * ships it direct to the school, in one transaction. It moves real stock and
 * cannot be undone, so it gets a screen rather than a button: what is about
 * to go, from where, and how much.
 *
 * **All or nothing.** If one of them cannot be filled — because something
 * else took the stock between loading this page and pressing the button —
 * the whole release is refused and nothing moves. A clerk who pressed one
 * button gets one outcome, and the refusal says which line failed.
 */

import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Alert, Badge, Button, EmptyState, LoadingScreen } from '@/components'
import { toApiError } from '@/api/errors'
import { formatQuantity } from '@/domain/money'
import { AppShell } from '@/features/shell/components/AppShell'
import { useEligibleBackorders, useReleaseEligible } from '../hooks/useBackorders'

export function ReleaseBackordersScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const only = params.get('only')

  const eligible = useEligibleBackorders()
  const release = useReleaseEligible()

  if (eligible.isLoading) return <LoadingScreen message="Checking what can be released" />

  const all = eligible.data ?? []
  // `?only=` releases a single row from the list's Release button; the same
  // screen, same confirmation, one line instead of all of them.
  const rows = only ? all.filter((b) => String(b.id) === only) : all
  const units = rows.reduce((sum, b) => sum + b.quantity, 0)

  return (
    <AppShell title="Backorders">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/backorders">Backorders</Link>
        <ChevronRight size={14} aria-hidden />
        <span aria-current="page">Release {rows.length > 0 ? `(${rows.length})` : ''}</span>
      </nav>

      <header className="page-head">
        <h1 className="page-head__title">
          Release {rows.length === 1 ? 'Backorder' : `All Eligible Backorders (${rows.length})`}
        </h1>
        <p className="page-head__subtitle">
          Confirm stock allocation and trigger delivery releases for fulfillable stock exceptions.
        </p>
      </header>

      {/*
        The refusal, kept on screen rather than in a snackbar that vanishes.
        The server names the line and the numbers — "Serere holds 8 and the
        backorder needs 15" — and that is the whole of what to do next.
      */}
      {release.isError && (
        <Alert tone="error">
          <strong>Nothing was released.</strong> {toApiError(release.error).message}
        </Alert>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing can be released yet"
          body="A backorder becomes releasable when some warehouse holds the stock for it. Until then it needs a production order, not a transfer."
          icon={AlertTriangle}
          action={{ label: 'Back to backorders', onClick: () => navigate('/backorders') }}
        />
      ) : (
        <>
          <Alert tone="info">
            You are about to release {rows.length} backorder{rows.length === 1 ? '' : 's'}.
            Each is assigned to the warehouse holding the most of that SKU and shipped
            direct to the school — the goods do not route back through the warehouse that
            ran short.
          </Alert>

          <div className="table-card">
            <div className="table-scroll">
              <table className="ledger ledger--production">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>School</th>
                    <th>SKU Code</th>
                    <th>Description</th>
                    <th className="ledger__num">Ordered</th>
                    <th className="ledger__num">Available</th>
                    <th>Ships From</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((backorder) => (
                    <tr key={backorder.id}>
                      <td className="ledger__code">{backorder.order_number}</td>
                      <td className="ledger__strong">{backorder.school_name}</td>
                      <td className="ledger__code">{backorder.sku_number}</td>
                      <td className="ledger__wrap">{backorder.sku_description}</td>
                      <td className="ledger__num">{formatQuantity(backorder.quantity)}</td>
                      <td className="ledger__num">{formatQuantity(backorder.available)}</td>
                      <td>
                        {/* Which shelf it actually leaves from — the clerk's
                            next question after "can this go?". */}
                        <Badge tone="info">{backorder.fillable_at}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="compose__bar">
            <div className="compose__summary">
              <p className="compose__count">
                {rows.length} order{rows.length === 1 ? '' : 's'}
              </p>
              <p className="compose__total">
                <span>Total units</span>
                <strong className="t-numeric">{formatQuantity(units)}</strong>
              </p>
            </div>

            <div className="compose__actions">
              <Button
                variant="secondary"
                onClick={() => navigate('/backorders')}
                disabled={release.isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={release.isPending}
                onClick={() =>
                  release.mutate(
                    only ? rows.map((b) => b.id) : undefined,
                    { onSuccess: () => navigate('/shipments/history') },
                  )
                }
              >
                {release.isPending
                  ? 'Releasing…'
                  : `Confirm Release ${rows.length === 1 ? '' : `All (${rows.length})`}`}
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
