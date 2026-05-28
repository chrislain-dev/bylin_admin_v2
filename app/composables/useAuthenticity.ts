import type {
  ApiResponse,
  AuthenticityAnalytics,
  AuthenticityCode,
  AuthenticityProductRow,
  AuthenticityProductStats,
  ProductPaginator
} from '~/types/authenticity'

interface AuthenticityFilters {
  search: string
  page: number
  per_page: number
  from_date?: string
  to_date?: string
}

export const useAuthenticity = () => {
  const client = useSanctumClient()
  const toast = useToast()

  const state = useState<{
    products: AuthenticityProductRow[]
    analytics: AuthenticityAnalytics | null
    pagination: ProductPaginator | null
    filters: AuthenticityFilters
    loading: boolean
    generating: boolean
  }>('authenticity:state', () => ({
    products: [],
    analytics: null,
    pagination: null,
    filters: {
      search: '',
      page: 1,
      per_page: 15
    },
    loading: false,
    generating: false
  }))

  const products = computed(() => state.value.products)
  const analytics = computed(() => state.value.analytics)
  const pagination = computed(() => state.value.pagination)
  const isLoading = computed(() => state.value.loading)
  const isGenerating = computed(() => state.value.generating)

  function getErrorMessage(error: unknown, fallback: string): string {
    const e = error as { response?: { _data?: { message?: string } }, data?: { message?: string }, message?: string }
    return e?.response?._data?.message || e?.data?.message || e?.message || fallback
  }

  async function fetchAnalytics(): Promise<void> {
    try {
      const params: Record<string, string | undefined> = {
        from_date: state.value.filters.from_date || undefined,
        to_date: state.value.filters.to_date || undefined
      }

      const response = await client<ApiResponse<AuthenticityAnalytics>>('/api/v1/admin/authenticity/analytics', {
        method: 'GET',
        params
      })

      if (response.success) {
        state.value.analytics = response.data
      }
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de charger les statistiques d’authenticité'),
        color: 'error',
        icon: 'i-lucide-alert-triangle'
      })
    }
  }

  async function fetchProducts(): Promise<void> {
    state.value.loading = true

    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: state.value.filters.page,
        per_page: state.value.filters.per_page,
        search: state.value.filters.search || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      }

      const response = await client<ApiResponse<ProductPaginator>>('/api/v1/admin/products', {
        method: 'GET',
        params
      })

      if (!response.success) {
        throw new Error(response.message || 'Erreur de chargement')
      }

      const authenticityProducts = response.data.data.filter(product => product.requires_authenticity)
      state.value.pagination = response.data
      state.value.products = authenticityProducts.map(product => ({ ...product, authenticity_stats: null }))

      await Promise.allSettled(
        state.value.products.map(async (product) => {
          try {
            product.authenticity_stats = await fetchProductStats(product.id, false)
          } catch {
            product.authenticity_stats = null
          }
        })
      )
    } catch (error) {
      state.value.products = []
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de charger les produits authentifiés'),
        color: 'error',
        icon: 'i-lucide-alert-triangle'
      })
    } finally {
      state.value.loading = false
    }
  }

  async function fetchProductStats(productId: string, notify = true): Promise<AuthenticityProductStats | null> {
    try {
      const response = await client<ApiResponse<AuthenticityProductStats>>(`/api/v1/admin/authenticity/product/${productId}/stats`, {
        method: 'GET'
      })

      return response.success ? response.data : null
    } catch (error) {
      if (notify) {
        toast.add({
          title: 'Erreur',
          description: getErrorMessage(error, 'Impossible de charger les statistiques du produit'),
          color: 'error',
          icon: 'i-lucide-alert-triangle'
        })
      }
      return null
    }
  }

  async function generateCodes(payload: { product_id: string; quantity: number; serial_prefix?: string }): Promise<AuthenticityCode[]> {
    state.value.generating = true

    try {
      const response = await client<ApiResponse<AuthenticityCode[]>>('/api/v1/admin/authenticity/generate', {
        method: 'POST',
        body: {
          product_id: payload.product_id,
          quantity: payload.quantity,
          serial_prefix: payload.serial_prefix || undefined
        }
      })

      if (!response.success) {
        throw new Error(response.message || 'Erreur de génération')
      }

      toast.add({
        title: 'Codes générés',
        description: `${response.data.length} code(s) QR généré(s) avec succès.`,
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      await fetchProducts()
      await fetchAnalytics()

      return response.data
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de générer les codes'),
        color: 'error',
        icon: 'i-lucide-alert-triangle'
      })
      return []
    } finally {
      state.value.generating = false
    }
  }

  async function markAsFake(qrCode: string, reason: string): Promise<boolean> {
    try {
      const response = await client<ApiResponse<null>>(`/api/v1/admin/authenticity/${encodeURIComponent(qrCode)}/mark-fake`, {
        method: 'PUT',
        body: { reason }
      })

      if (response.success) {
        toast.add({
          title: 'Code marqué comme suspect',
          color: 'success',
          icon: 'i-lucide-check-circle'
        })
        await fetchAnalytics()
        return true
      }
      return false
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de marquer le code comme suspect'),
        color: 'error',
        icon: 'i-lucide-alert-triangle'
      })
      return false
    }
  }

  function setSearch(search: string) {
    state.value.filters.search = search
    state.value.filters.page = 1
    return fetchProducts()
  }

  function setPage(page: number) {
    state.value.filters.page = page
    return fetchProducts()
  }

  async function refreshAll() {
    await Promise.all([fetchAnalytics(), fetchProducts()])
  }

  return {
    state,
    products,
    analytics,
    pagination,
    isLoading,
    isGenerating,
    fetchAnalytics,
    fetchProducts,
    fetchProductStats,
    generateCodes,
    markAsFake,
    setSearch,
    setPage,
    refreshAll
  }
}
