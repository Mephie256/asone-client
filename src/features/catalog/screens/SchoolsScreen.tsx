/**
 * Schools — master data (F12), Locations & Administration.
 *
 * Table Updates only, matching `navigation.ts`'s `requires: 'table_updates'`
 * for this destination — a Program Lead or Operations Manager screen.
 */

import { useState } from 'react'
import { AppShell } from '@/features/shell/components/AppShell'
import { AddSchoolModal } from '../components/AddSchoolModal'
import { SchoolsFilterBar } from '../components/SchoolsFilterBar'
import { SchoolsTable } from '../components/SchoolsTable'
import { useSchools, type SchoolFilters } from '../hooks/useSchools'
import { useWarehouseOptions } from '../hooks/useWarehouseOptions'

const EMPTY_FILTERS: SchoolFilters = {
  level: null,
  warehouseId: null,
  isActive: null,
  query: '',
  page: 1,
}

export function SchoolsScreen() {
  const [filters, setFilters] = useState<SchoolFilters>(EMPTY_FILTERS)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { schools, totalCount, isLoading } = useSchools(filters)
  const { warehouses } = useWarehouseOptions()

  /** Any filter change invalidates the current page position. */
  function applyFilter(next: Partial<Omit<SchoolFilters, 'page'>>) {
    setFilters((current) => ({ ...current, ...next, page: 1 }))
  }

  function changePage(page: number) {
    setFilters((current) => ({ ...current, page }))
  }

  return (
    <AppShell title="Schools">
      <header className="schools-page-head">
        <h1 className="schools-page-head__title">Schools</h1>
        <p className="schools-page-head__subtitle">
          Manage uniform programs, student enrollment ratios, and school dispatch hubs.
        </p>
      </header>

      <SchoolsFilterBar
        query={filters.query}
        onQueryChange={(query) => applyFilter({ query })}
        level={filters.level}
        onLevelChange={(level) => applyFilter({ level })}
        warehouseId={filters.warehouseId}
        onWarehouseChange={(warehouseId) => applyFilter({ warehouseId })}
        isActive={filters.isActive}
        onIsActiveChange={(isActive) => applyFilter({ isActive })}
        warehouses={warehouses}
        onAdd={() => setIsAddModalOpen(true)}
      />

      <SchoolsTable
        schools={schools}
        totalCount={totalCount}
        loading={isLoading}
        page={filters.page}
        onPageChange={changePage}
        onAdd={() => setIsAddModalOpen(true)}
      />

      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        warehouses={warehouses}
      />
    </AppShell>
  )
}
