/**
 * Everything the warehouse hub console shows, for one site.
 *
 * Six requests, each its own query so a slow or forbidden one cannot blank
 * the rest of the screen — same reasoning as `useDashboardData`. Every one
 * of them already exists for another screen; this is the one place they are
 * all scoped to the same warehouse and read together.
 */

import { useQuery } from '@tanstack/react-query'
import * as catalogApi from '@/api/catalog'
import * as dashboardApi from '@/api/dashboard'
import * as inventoryApi from '@/api/inventory'
import * as ordersApi from '@/api/orders'
import * as procurementApi from '@/api/procurement'
import { keys } from '@/api/keys'

const ROWS_SHOWN = 6

export function useWarehouseHub(warehouseId: number) {
  const warehouse = useQuery({
    queryKey: keys.warehouse(warehouseId),
    queryFn: () => catalogApi.warehouse(warehouseId),
  })

  const summary = useQuery({
    queryKey: keys.summary(warehouseId),
    queryFn: () => dashboardApi.summary({ warehouse: warehouseId }),
  })

  const incomingProduction = useQuery({
    queryKey: ['production-orders', 'incoming', warehouseId],
    queryFn: () =>
      procurementApi.productionOrders({
        warehouse: warehouseId,
        // Still open, i.e. still something this warehouse is expecting to
        // arrive — a closed or cancelled order is not "incoming" any more.
        status: 'OPEN',
        page_size: ROWS_SHOWN,
      }),
  })

  const lowStockAlerts = useQuery({
    queryKey: keys.reorderAlerts(warehouseId),
    queryFn: () => inventoryApi.reorderAlerts({ warehouse: warehouseId }),
  })

  const pickingQueue = useQuery({
    queryKey: keys.ordersPartProcessed(warehouseId),
    queryFn: () => ordersApi.ordersPartProcessed({ warehouse: warehouseId, page_size: ROWS_SHOWN }),
  })

  const dispatchLog = useQuery({
    queryKey: keys.shipments(warehouseId),
    queryFn: () => ordersApi.shipments({ from_warehouse: warehouseId, page_size: ROWS_SHOWN }),
  })

  return {
    warehouse: warehouse.data ?? null,
    warehouseLoading: warehouse.isLoading,
    summary: summary.data ?? null,
    summaryLoading: summary.isLoading,
    incomingProduction: incomingProduction.data?.results ?? [],
    incomingProductionTotal: incomingProduction.data?.count ?? 0,
    incomingProductionLoading: incomingProduction.isLoading,
    lowStockAlerts: lowStockAlerts.data ?? [],
    lowStockAlertsLoading: lowStockAlerts.isLoading,
    pickingQueue: pickingQueue.data?.results ?? [],
    pickingQueueTotal: pickingQueue.data?.count ?? 0,
    pickingQueueLoading: pickingQueue.isLoading,
    dispatchLog: dispatchLog.data?.results ?? [],
    dispatchLogTotal: dispatchLog.data?.count ?? 0,
    dispatchLogLoading: dispatchLog.isLoading,
  }
}
