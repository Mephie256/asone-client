/**
 * Schools with orders picked and waiting — F42's despatch queue.
 *
 * AsOne's checklist asks for a *"consolidated weekly despatch"*: one van to a
 * school carrying every order of theirs that is ready. So the queue is
 * grouped by school rather than listed by order — the unit of work is the
 * van, and the button loads it.
 *
 * Hidden entirely when nothing is waiting. An empty panel above a full table
 * is furniture; the table below already says what has gone out.
 */

import { useState } from 'react'
import { Truck } from 'lucide-react'
import { ConfirmButton, SkeletonRows } from '@/components'
import { formatQuantity } from '@/domain/money'
import { canReceiveAndShip } from '@/domain/access'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useWarehouseFilter } from '@/features/shell/hooks/useWarehouseFilter'
import { useDespatch, useDespatchQueue } from '../hooks/useShipments'

export function DespatchQueue() {
  const { user } = useAuth()
  const { warehouseId } = useWarehouseFilter()
  const [loading, setLoading] = useState<number | null>(null)

  const mayDespatch = canReceiveAndShip(user)
  const queue = useDespatchQueue(warehouseId)
  const despatch = useDespatch()

  if (!mayDespatch) return null
  if (queue.isLoading) return <SkeletonRows rows={2} />

  const rows = queue.data ?? []
  if (rows.length === 0) return null

  return (
    <section className="despatch">
      <header className="despatch__head">
        <h2 className="despatch__title">Ready to Despatch</h2>
        <p className="despatch__note">
          One van per school, carrying every order of theirs that is picked.
        </p>
      </header>

      <ul className="despatch__list">
        {rows.map((row) => (
          <li className="despatch__row" key={row.school_id}>
            <div>
              <p className="despatch__school">{row.school__name}</p>
              <p className="despatch__meta">
                {row.orders} order{row.orders === 1 ? '' : 's'} ·{' '}
                {formatQuantity(row.units)} garments
              </p>
            </div>

            {/*
              Despatch moves stock out of the building and cannot be undone —
              there is no way back from a van that has gone. One question
              first, same as picking.
            */}
            <ConfirmButton
              size="sm"
              title={`Despatch to ${row.school__name}?`}
              confirmLabel="Send it"
              pendingLabel="Despatching…"
              pending={loading === row.school_id}
              disabled={despatch.isPending}
              note={`Sends ${row.orders} order${row.orders === 1 ? '' : 's'} to ${row.school__name}. Stock leaves the warehouse and this cannot be undone.`}
              onConfirm={() => {
                setLoading(row.school_id)
                despatch.mutate(
                  {
                    school: row.school_id,
                    ...(warehouseId ? { from_warehouse: warehouseId } : {}),
                  },
                  { onSettled: () => setLoading(null) },
                )
              }}
            >
              <Truck size={14} aria-hidden />
              Despatch
            </ConfirmButton>
          </li>
        ))}
      </ul>
    </section>
  )
}
