/**
 * Backorders — F44, F45, F46.
 *
 * The exceptions queue: what a school is still owed after a short pick, and
 * which of it somebody could send today.
 *
 * A row is **eligible** when some warehouse actually holds the stock — any
 * warehouse, because decision D2 lets another site ship direct to the
 * school. One that nobody stocks is not a job, it is a wait, and it needs
 * the Tailoring Center rather than a transfer. The two read differently on
 * purpose.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Factory } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Pagination,
  SkeletonRows,
  type Tone,
} from '@/components'
import { canReceiveAndShip } from '@/domain/access'
import { formatQuantity } from '@/domain/money'
import { AppShell } from '@/features/shell/components/AppShell'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  BACKORDERS_PAGE_SIZE,
  useBackorders,
  useEligibleBackorders,
} from '../hooks/useBackorders'

function priorityTone(priority: string | undefined): Tone {
  switch (priority) {
    case 'URGENT':
      return 'error'
    case 'HIGH':
      return 'warning'
    default:
      return 'neutral'
  }
}

function statusTone(status: string | undefined): Tone {
  switch (status) {
    case 'OPEN':
      return 'warning'
    case 'ASSIGNED':
      return 'info'
    case 'FILLED':
      return 'success'
    case 'CANCELLED':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function BackordersScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const backorders = useBackorders(page, null)
  const eligible = useEligibleBackorders()
  const mayRelease = canReceiveAndShip(user)

  const rows = backorders.data?.results ?? []
  const total = backorders.data?.count ?? 0
  const readyCount = eligible.data?.length ?? 0
  const eligibleIds = new Set((eligible.data ?? []).map((b) => b.id))

  return (
    <AppShell title="Backorders">
      <header className="page-head page-head--split">
        <div>
          <h1 className="page-head__title">Backorders</h1>
          <p className="page-head__subtitle">
            Exceptions queue for stock deficits requiring Tailoring Center production triggers.
          </p>
        </div>

        {mayRelease && readyCount > 0 && (
          <Button onClick={() => navigate('/backorders/release')}>
            Release All Eligible ({readyCount})
          </Button>
        )}
      </header>

      {/*
        Query failures are silent by design, so a 500 would otherwise read as
        "no backorders" — which is the most reassuring possible lie for a
        screen whose whole job is to show what is outstanding.
      */}
      {backorders.isError && (
        <Alert tone="error">
          The backorder queue could not be loaded, so this list is not what a
          school is owed. Try again in a moment.
        </Alert>
      )}

      {!backorders.isError && total > 0 && (
        <Alert tone={readyCount > 0 ? 'warning' : 'info'}>
          {readyCount > 0
            ? `${total} backorders pending — ${readyCount} can be released now, because stock for them has arrived at a warehouse.`
            : `${total} backorders pending. None can be filled yet — no warehouse holds the stock.`}
        </Alert>
      )}

      <div className="table-card">
        {backorders.isLoading ? (
          <SkeletonRows rows={8} />
        ) : rows.length === 0 && !backorders.isError ? (
          <EmptyState
            title="Nothing is outstanding"
            body="A backorder appears here when a warehouse picks an order short — one row per SKU it could not fill."
            icon={Clock}
          />
        ) : (
          <>
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
                    <th>Priority</th>
                    <th>Status</th>
                    <th aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((backorder) => {
                    const ready = eligibleIds.has(backorder.id)
                    const open = backorder.status === 'OPEN'

                    return (
                      <tr key={backorder.id}>
                        <td className="ledger__code">
                          <Link className="ledger__link" to={`/orders/${backorder.order}`}>
                            {backorder.order_number}
                          </Link>
                        </td>
                        <td className="ledger__strong">{backorder.school_name}</td>
                        <td className="ledger__code">{backorder.sku_number}</td>
                        <td className="ledger__wrap">{backorder.sku_description}</td>
                        <td className="ledger__num">{formatQuantity(backorder.quantity)}</td>
                        <td
                          className={`ledger__num${
                            backorder.available > 0 ? '' : ' ledger__num--owed'
                          }`}
                        >
                          {/* Zero is the whole story on this screen: nothing
                              anywhere, so no transfer can help. */}
                          {formatQuantity(backorder.available)}
                        </td>
                        <td>
                          <Badge tone={priorityTone(backorder.priority)}>
                            {backorder.priority_display}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={statusTone(backorder.status)}>
                            {backorder.status_display}
                          </Badge>
                        </td>
                        <td className="ledger__num">
                          {!open ? null : ready && mayRelease ? (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/backorders/release?only=${backorder.id}`)}
                            >
                              Release
                            </Button>
                          ) : (
                            /*
                              Nothing to transfer, so the next step is
                              production rather than a warehouse. Named
                              rather than a disabled Release, which would
                              suggest the button is the answer.
                            */
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate('/production-orders')}
                              title="No warehouse holds this stock — it has to be made"
                            >
                              <Factory size={14} aria-hidden />
                              View TC
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-card__footer">
              <Pagination
                page={page}
                pageCount={Math.max(1, Math.ceil(total / BACKORDERS_PAGE_SIZE))}
                totalItems={total}
                pageSize={BACKORDERS_PAGE_SIZE}
                onChange={setPage}
                noun="backorders"
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
