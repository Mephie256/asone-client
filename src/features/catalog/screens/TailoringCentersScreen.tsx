/**
 * Tailoring Centers — master data (F10), Locations & Administration.
 *
 * A card per centre, each with its own production queue. View-only — adding
 * or editing a tailoring center is not part of this screen.
 */

import { useState } from 'react'
import { AppShell } from '@/features/shell/components/AppShell'
import { Pagination } from '@/components'
import { TailoringCenterCard } from '../components/TailoringCenterCard'
import { useTailoringCenters, type TailoringCenterFilters } from '../hooks/useTailoringCenters'

const EMPTY_FILTERS: TailoringCenterFilters = { page: 1 }
const PAGE_SIZE = 50

export function TailoringCentersScreen() {
  const [filters, setFilters] = useState<TailoringCenterFilters>(EMPTY_FILTERS)

  const { tailoringCenters, totalCount, isLoading } = useTailoringCenters(filters)
  const pageCount = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  return (
    <AppShell title="Tailoring Centers">
      <header className="page-head">
        <h1 className="page-head__title">Tailoring Centers</h1>
        <p className="page-head__subtitle">
          Oversee outsourced local tailoring centers, active PO allocations, and batch cutting progress.
        </p>
      </header>

      {isLoading ? (
        <div className="skeleton-stack" aria-hidden>
          <span className="skeleton" style={{ height: 220 }} />
          <span className="skeleton" style={{ height: 220 }} />
        </div>
      ) : tailoringCenters.length === 0 ? (
        <p className="page-head__subtitle">No tailoring centers yet.</p>
      ) : (
        <>
          <div style={{ marginTop: 20 }}>
            {tailoringCenters.map((center) => (
              <TailoringCenterCard key={center.id} center={center} />
            ))}
          </div>

          <Pagination
            page={filters.page}
            pageCount={pageCount}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onChange={(page) => setFilters({ page })}
            noun="tailoring centers"
          />
        </>
      )}
    </AppShell>
  )
}
