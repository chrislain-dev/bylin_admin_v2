export type ShippingMethodStatus = 'active' | 'inactive'

export interface ShippingMethod {
  id: string
  name: string
  code?: string | null
  description?: string | null
  carrier?: string | null
  zone?: string | null
  base_cost?: number | string | null
  cost?: number | string | null
  price?: number | string | null
  free_shipping_threshold?: number | string | null
  estimated_delivery_min_days?: number | null
  estimated_delivery_max_days?: number | null
  is_active?: boolean
  status?: ShippingMethodStatus | string
  sort_order?: number | null
  metadata?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface ShippingMethodForm {
  name: string
  code: string
  description?: string | null
  carrier?: string | null
  zone?: string | null
  base_cost: number
  free_shipping_threshold?: number | null
  estimated_delivery_min_days?: number | null
  estimated_delivery_max_days?: number | null
  is_active: boolean
  sort_order?: number | null
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface LaravelPaginator<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface ShippingFilters {
  search?: string
  status?: string
  page?: number
  per_page?: number
}

function normalizeMethod(method: ShippingMethod): ShippingMethod {
  return {
    ...method,
    base_cost: method.base_cost ?? method.cost ?? method.price ?? 0,
    is_active: method.is_active ?? method.status === 'active'
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { _data?: { message?: string } } }).response
    if (response?._data?.message) return response._data.message
  }

  return error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
}

export const useShipping = () => {
  const client = useSanctumClient()
  const toast = useToast()

  const methods = useState<ShippingMethod[]>('shipping:methods', () => [])
  const currentMethod = useState<ShippingMethod | null>('shipping:current', () => null)
  const loading = useState<boolean>('shipping:loading', () => false)
  const error = useState<string | null>('shipping:error', () => null)
  const pagination = useState('shipping:pagination', () => ({
    page: 1,
    perPage: 15,
    total: 0,
    totalPages: 1
  }))
  const filters = useState<ShippingFilters>('shipping:filters', () => ({
    search: '',
    status: 'all',
    page: 1,
    per_page: 15
  }))

  async function fetchMethods(overrides: Partial<ShippingFilters> = {}) {
    loading.value = true
    error.value = null

    try {
      filters.value = { ...filters.value, ...overrides }

      const params = {
        page: filters.value.page,
        per_page: filters.value.per_page,
        search: filters.value.search || undefined,
        status: filters.value.status && filters.value.status !== 'all' ? filters.value.status : undefined
      }

      const response = await client<ApiResponse<LaravelPaginator<ShippingMethod> | ShippingMethod[]>>('/api/v1/admin/shipping-methods', {
        method: 'GET',
        params
      })

      if (response.success) {
        if (Array.isArray(response.data)) {
          methods.value = response.data.map(normalizeMethod)
          pagination.value.total = response.data.length
          pagination.value.totalPages = 1
        } else {
          methods.value = response.data.data.map(normalizeMethod)
          pagination.value.page = response.data.current_page
          pagination.value.perPage = response.data.per_page
          pagination.value.total = response.data.total
          pagination.value.totalPages = response.data.last_page
        }
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      methods.value = []
      toast.add({ title: 'Erreur', description: error.value || 'Impossible de charger les méthodes de livraison', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  async function fetchMethod(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await client<ApiResponse<ShippingMethod>>(`/api/v1/admin/shipping-methods/${id}`, { method: 'GET' })
      if (response.success) {
        currentMethod.value = normalizeMethod(response.data)
        return currentMethod.value
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      toast.add({ title: 'Erreur', description: error.value || 'Impossible de charger la méthode', color: 'error' })
    } finally {
      loading.value = false
    }

    return null
  }

  async function createMethod(payload: ShippingMethodForm) {
    loading.value = true
    error.value = null

    try {
      const response = await client<ApiResponse<ShippingMethod>>('/api/v1/admin/shipping-methods', {
        method: 'POST',
        body: payload
      })

      if (response.success) {
        toast.add({ title: 'Méthode créée', color: 'success' })
        await fetchMethods()
        return normalizeMethod(response.data)
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      toast.add({ title: 'Erreur', description: error.value || 'Création impossible', color: 'error' })
    } finally {
      loading.value = false
    }

    return null
  }

  async function updateMethod(id: string, payload: Partial<ShippingMethodForm>) {
    loading.value = true
    error.value = null

    try {
      const response = await client<ApiResponse<ShippingMethod>>(`/api/v1/admin/shipping-methods/${id}`, {
        method: 'PUT',
        body: payload
      })

      if (response.success) {
        toast.add({ title: 'Méthode mise à jour', color: 'success' })
        await fetchMethods()
        return normalizeMethod(response.data)
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      toast.add({ title: 'Erreur', description: error.value || 'Mise à jour impossible', color: 'error' })
    } finally {
      loading.value = false
    }

    return null
  }

  async function deleteMethod(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await client<ApiResponse<null>>(`/api/v1/admin/shipping-methods/${id}`, { method: 'DELETE' })

      if (response.success) {
        toast.add({ title: 'Méthode supprimée', color: 'success' })
        await fetchMethods()
        return true
      }
    } catch (err) {
      error.value = getErrorMessage(err)
      toast.add({ title: 'Erreur', description: error.value || 'Suppression impossible', color: 'error' })
    } finally {
      loading.value = false
    }

    return false
  }

  function setSearch(search: string) {
    filters.value.search = search
    filters.value.page = 1
    return fetchMethods()
  }

  function setStatus(status: string) {
    filters.value.status = status
    filters.value.page = 1
    return fetchMethods()
  }

  function setPage(page: number) {
    filters.value.page = page
    return fetchMethods()
  }

  return {
    methods,
    currentMethod,
    loading,
    error,
    filters,
    pagination,
    fetchMethods,
    fetchMethod,
    createMethod,
    updateMethod,
    deleteMethod,
    setSearch,
    setStatus,
    setPage
  }
}
