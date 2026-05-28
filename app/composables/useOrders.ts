import type { ApiResponse, LaravelPaginator, Order, OrderFilters } from '~/types/order'

export const useOrders = () => {
  const client = useSanctumClient()
  const toast = useToast()

  const state = useState<{
    orders: Order[]
    currentOrder: Order | null
    pagination: LaravelPaginator<Order> | null
    loading: boolean
    error: string | null
    filters: OrderFilters
  }>('orders:state', () => ({
    orders: [],
    currentOrder: null,
    pagination: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      status: undefined,
      payment_status: undefined,
      per_page: 15,
      page: 1,
      sort_by: 'created_at',
      sort_order: 'desc'
    }
  }))

  const orders = computed(() => state.value.orders)
  const currentOrder = computed(() => state.value.currentOrder)
  const isLoading = computed(() => state.value.loading)
  const totalPages = computed(() => state.value.pagination?.last_page || 1)

  function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { _data?: { message?: string } } }).response
      if (response?._data?.message) return response._data.message
    }

    return error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
  }

  async function fetchOrders(overrides: Partial<OrderFilters> = {}): Promise<void> {
    state.value.loading = true
    state.value.error = null

    try {
      state.value.filters = { ...state.value.filters, ...overrides }
      const filters = state.value.filters

      const params: Record<string, string | number | undefined> = {
        page: filters.page,
        per_page: filters.per_page,
        search: filters.search || undefined,
        status: filters.status || undefined,
        payment_status: filters.payment_status || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      }

      const response = await client<ApiResponse<LaravelPaginator<Order>>>('/api/v1/admin/orders', {
        method: 'GET',
        params
      })

      if (response.success) {
        state.value.orders = response.data.data
        state.value.pagination = response.data
      }
    } catch (error: unknown) {
      state.value.error = getErrorMessage(error)
      state.value.orders = []
      toast.add({
        title: 'Erreur',
        description: state.value.error || 'Impossible de charger les commandes',
        color: 'error'
      })
    } finally {
      state.value.loading = false
    }
  }

  async function fetchOrder(id: string): Promise<Order | null> {
    state.value.loading = true
    state.value.error = null

    try {
      const response = await client<ApiResponse<Order>>(`/api/v1/admin/orders/${id}`, { method: 'GET' })

      if (response.success) {
        state.value.currentOrder = response.data
        return response.data
      }

      return null
    } catch (error: unknown) {
      state.value.error = getErrorMessage(error)
      toast.add({
        title: 'Erreur',
        description: state.value.error || 'Impossible de charger la commande',
        color: 'error'
      })
      return null
    } finally {
      state.value.loading = false
    }
  }

  async function updateOrderStatus(id: string, status: string): Promise<boolean> {
    try {
      const response = await client<ApiResponse<Order>>(`/api/v1/admin/orders/${id}/status`, {
        method: 'PUT',
        body: { status }
      })

      if (response.success) {
        state.value.currentOrder = response.data
        await fetchOrders()
        return true
      }

      return false
    } catch (error: unknown) {
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error) || 'Impossible de changer le statut',
        color: 'error'
      })
      return false
    }
  }

  async function cancelOrder(id: string, reason?: string): Promise<boolean> {
    try {
      const response = await client<ApiResponse<Order>>(`/api/v1/admin/orders/${id}/cancel`, {
        method: 'POST',
        body: { reason }
      })

      if (response.success) {
        state.value.currentOrder = response.data
        await fetchOrders()
        return true
      }

      return false
    } catch (error: unknown) {
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error) || 'Impossible d’annuler la commande',
        color: 'error'
      })
      return false
    }
  }

  function setPage(page: number) {
    state.value.filters.page = page
    return fetchOrders()
  }

  function setSearch(search: string) {
    state.value.filters.search = search
    state.value.filters.page = 1
    return fetchOrders()
  }

  function setStatus(status?: string) {
    state.value.filters.status = status
    state.value.filters.page = 1
    return fetchOrders()
  }

  function setPaymentStatus(status?: string) {
    state.value.filters.payment_status = status
    state.value.filters.page = 1
    return fetchOrders()
  }

  return {
    state,
    orders,
    currentOrder,
    isLoading,
    totalPages,
    fetchOrders,
    fetchOrder,
    updateOrderStatus,
    cancelOrder,
    setPage,
    setSearch,
    setStatus,
    setPaymentStatus
  }
}
