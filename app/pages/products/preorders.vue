<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Product } from '~/types/product'
import { formatPriceXOF } from '~/utils/helpers'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')

const router = useRouter()
const {
  products,
  pagination,
  isLoading,
  fetchPreorders,
  disablePreorder,
  setPage
} = usePreorders()

const currentPage = computed({
  get: () => pagination.value?.current_page || 1,
  set: (value: number) => setPage(value)
})

const preorderStats = computed(() => {
  const total = pagination.value?.total || products.value.length
  const automatic = products.value.filter(product => product.preorder_auto_enabled).length
  const manual = products.value.filter(product => !product.preorder_auto_enabled).length
  const reserved = products.value.reduce((sum, product) => sum + (product.preorder_count || 0), 0)

  return { total, automatic, manual, reserved }
})

const columns: TableColumn<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Produit',
    cell: ({ row }) => {
      const product = row.original
      const image = product.thumbnail_url || product.media?.[0]?.original_url

      return h('div', { class: 'flex items-center gap-3 min-w-[250px]' }, [
        image
          ? h(UAvatar, { src: image, alt: product.name, size: 'md', class: 'rounded-md' })
          : h(UAvatar, { icon: 'i-lucide-package', size: 'md', class: 'rounded-md bg-gray-100 dark:bg-gray-800' }),
        h('div', { class: 'overflow-hidden' }, [
          h('p', { class: 'font-medium truncate' }, product.name),
          h('p', { class: 'text-xs text-gray-500 font-mono truncate' }, product.sku)
        ])
      ])
    }
  },
  {
    accessorKey: 'preorder_available_date',
    header: 'Disponibilité',
    cell: ({ row }) => row.original.preorder_available_date
      ? new Date(row.original.preorder_available_date).toLocaleDateString('fr-FR')
      : 'Non définie'
  },
  {
    accessorKey: 'preorder_count',
    header: 'Précommandes',
    cell: ({ row }) => `${row.original.preorder_count || 0}${row.original.preorder_limit ? ` / ${row.original.preorder_limit}` : ''}`
  },
  {
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ row }) => formatPriceXOF(row.original.price)
  },
  {
    accessorKey: 'preorder_auto_enabled',
    header: 'Type',
    cell: ({ row }) => h(UBadge, {
      color: row.original.preorder_auto_enabled ? 'warning' : 'primary',
      variant: 'subtle'
    }, () => row.original.preorder_auto_enabled ? 'Automatique' : 'Manuelle')
  },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-eye',
        size: 'xs',
        variant: 'ghost',
        onClick: () => router.push(`/products/${row.original.id}`)
      }),
      h(UButton, {
        icon: 'i-lucide-x-circle',
        label: 'Désactiver',
        size: 'xs',
        color: 'error',
        variant: 'soft',
        onClick: () => disablePreorder(row.original.id)
      })
    ])
  }
]

onMounted(() => {
  fetchPreorders()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Précommandes">
        <template #right>
          <UButton label="Actualiser" icon="i-lucide-refresh-cw" variant="ghost" :loading="isLoading" @click="fetchPreorders" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UCard>
            <p class="text-sm text-gray-500">Produits en précommande</p>
            <p class="text-2xl font-bold mt-1">{{ preorderStats.total }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-gray-500">Précommandes client</p>
            <p class="text-2xl font-bold mt-1">{{ preorderStats.reserved }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-gray-500">Manuelles</p>
            <p class="text-2xl font-bold mt-1">{{ preorderStats.manual }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-gray-500">Automatiques</p>
            <p class="text-2xl font-bold mt-1">{{ preorderStats.automatic }}</p>
          </UCard>
        </div>

        <UCard>
          <UTable :data="products" :columns="columns" :loading="isLoading" />

          <div v-if="pagination && pagination.last_page > 1" class="flex justify-end mt-4">
            <UPagination
              v-model:page="currentPage"
              :total="pagination.total"
              :items-per-page="pagination.per_page"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
