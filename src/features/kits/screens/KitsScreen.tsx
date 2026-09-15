/**
 * Uniform Kits — F07.
 *
 * A kit is a bundle a school orders as one line instead of five. It is a
 * convenience for ordering and nothing more: **no warehouse ever holds a
 * kit.** The moment one is ordered it becomes its component SKUs (F33), and
 * everything downstream — availability, picking, packing, the ledger — deals
 * in those.
 *
 * Cards rather than a table, as drawn, and for a reason that survives the
 * design: there are a handful of kits and the thing worth seeing about each
 * is its *contents*, which is a list. A table would either hide that behind a
 * click or grow a column that wraps to four lines.
 *
 * The price on each card is the sum of its components at today's prices,
 * computed by the server on every read. A kit has no price of its own and no
 * bundle discount — it is the sum or it is nothing.
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Shirt } from 'lucide-react'
import { Alert, Badge, Button, EmptyState, SkeletonRows, TabBar } from '@/components'
import { can } from '@/domain/access'
import { formatUGX } from '@/domain/money'
import { AppShell } from '@/features/shell/components/AppShell'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useKitComponents, useKits } from '../hooks/useKits'

type Filter = 'all' | 'PS' | 'HS'

export function KitsScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [level, setLevel] = useState<Filter>('all')

  const kits = useKits()
  const components = useKitComponents()
  const mayEdit = can(user, 'table_updates')

  const rows = useMemo(() => {
    const all = kits.data?.results ?? []
    return level === 'all' ? all : all.filter((kit) => kit.school_level === level)
  }, [kits.data, level])

  return (
    <AppShell title="Uniform Kits">
      <header className="page-head page-head--split">
        <div>
          <h1 className="page-head__title">Uniform Kits</h1>
          <p className="page-head__subtitle">
            Bundles a school orders as one line. Nothing holds a kit in stock —
            ordering one turns it into its component items.
          </p>
        </div>

        {mayEdit && (
          <Button onClick={() => navigate('/kits/new')}>
            <Plus size={16} aria-hidden />
            Create Kit
          </Button>
        )}
      </header>

      <TabBar
        tabs={[
          { key: 'all', label: 'All Kits' },
          { key: 'PS', label: 'Primary School' },
          { key: 'HS', label: 'High School' },
        ]}
        active={level}
        onSelect={(key) => setLevel(key as Filter)}
        label="School level"
      />

      {kits.isError && (
        <Alert tone="error">
          The kits could not be loaded, so this is not the list a school would
          see. Try again in a moment.
        </Alert>
      )}

      {/*
        Without the components the cards can show a name and a price but not
        what is in the bundle, which is the one thing the screen is for.
      */}
      {components.isError && !kits.isError && (
        <Alert tone="warning">
          The kit contents could not be loaded. The cards below are otherwise
          correct, but none of them can show what is in the bundle.
        </Alert>
      )}

      {kits.isLoading ? (
        <SkeletonRows rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={level === 'all' ? 'No kits yet' : 'No kits for this level'}
          body="A kit bundles several garments into one line a school can order — a starter kit, say. Central Office builds them."
          icon={Shirt}
        />
      ) : (
        <div className="kit-grid">
          {rows.map((kit) => {
            const lines = components.byKit.get(kit.id) ?? []

            return (
              <article key={kit.id} className="kit-card">
                <header className="kit-card__head">
                  <div>
                    <h2 className="kit-card__name">{kit.name}</h2>
                    <p className="kit-card__meta">
                      {kit.kit_number} · {kit.school_level_display} ·{' '}
                      {kit.item_count} {kit.item_count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <Badge tone={kit.is_active ? 'success' : 'neutral'}>
                    {kit.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </header>

                <div className="kit-card__components">
                  <h3 className="kit-card__label">Kit components</h3>
                  {lines.length === 0 ? (
                    /*
                      Not an empty box. A kit with no components cannot be
                      priced and cannot be ordered, which is worth saying
                      where somebody can act on it.
                    */
                    <p className="kit-card__empty">
                      Nothing in this kit yet, so it cannot be priced or ordered.
                    </p>
                  ) : (
                    <ul className="kit-chips">
                      {lines.map((line) => (
                        <li key={line.id} className="kit-chip">
                          {line.sku_description}
                          <span className="kit-chip__qty">×{line.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <footer className="kit-card__foot">
                  <div>
                    <h3 className="kit-card__label">Kit price</h3>
                    <p className="kit-card__price t-numeric">
                      {/*
                        Null is not zero. The server returns null when a
                        component has no price today or the kit is empty —
                        printing "UGX 0" would be a figure somebody could
                        quote to a parent.
                      */}
                      {kit.current_price ? (
                        formatUGX(kit.current_price)
                      ) : (
                        <span className="kit-card__unpriced">Cannot be priced</span>
                      )}
                    </p>
                  </div>

                  <Link className="btn btn--primary btn--sm" to={`/kits/${kit.id}`}>
                    View Detail
                  </Link>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
