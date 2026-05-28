import type { Product, LaravelPaginator, ApiResponse } from '~/types/product'

interface PreorderState {
  products: Product[]
  pagination: LaravelPaginator<Product> | null
  loading: boolean
  page: number
  per_page: number
}

export const usePreorders = () => {
  const client = useSanctumClient()
  const toast = useToast()

  const state = useState<PreorderState>('preorders:state', () => ({
    products: [],
    pagination: null,
    loading: false,
    page: 1,
    per_page: 15
  }))

  const products = computed(() => state.value.products)
  const pagination = computed(() => state.value.pagination)
  const isLoading = computed(() => state.value.loading)

  function getErrorMessage(error: unknown, fallback: string): string {
    const e = error as { response?: { _data?: { message?: string } }, data?: { message?: string }, message?: string }
    return e?.response?._data?.message || e?.data?.message || e?.message || fallback
  }

  async function fetchPreorders(): Promise<void> {
    state.value.loading = true
    try {
      const response = await client<ApiResponse<LaravelPaginator<Product>>>('/api/v1/admin/preorders', {
        method: 'GET',
        params: {
          page: state.value.page,
          per_page: state.value.per_page
        }
      })

      if (!response.success) {
        throw new Error(response.message || 'Erreur de chargement')
      }

      state.value.products = response.data.data
      state.value.pagination = response.data
    } catch (error) {
      state.value.products = []
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de charger les précommandes'),
        color: 'error',
        icon: 'i-lucide-alert-triangle'
      })
    } finally {
      state.value.loading = false
    }
  }

  async function disablePreorder(productId: string): Promise<boolean> {
    try {
      const response = await client<ApiResponse<Product>>(`/api/v1/admin/products/${productId}/preorder/disable`, {
        method: 'POST'
      })

      if (response.success) {
        toast.add({
          title: 'Précommande désactivée',
          color: 'success',
          icon: 'i-lucide-check-circle'
        })
        await fetchPreorders()
        return true
      }
      return false
    } catch (error) {
      toast.add({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de désactiver la précommande'),
        color: 'error',
        icon: 'i-lucide-alert-triangle'
      })
      return false
    }
  }

  function setPage(page: number) {
    state.value.page = page
    return fetchPreorders()
  }

  return {
    state,
    products,
    pagination,
    isLoading,
    fetchPreorders,
    disablePreorder,
    setPage
  }
}
