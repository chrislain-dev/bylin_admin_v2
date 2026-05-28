<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AuthenticityProductRow } from '~/types/authenticity'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')

const {
  products,
  analytics,
  pagination,
  isLoading,
  isGenerating,
  refreshAll,
  generateCodes,
  setSearch,
  setPage
} = useAuthenticity()

const router = useRouter()
const toast = useToast()

const localSearch = ref('')
const generateModalOpen = ref(false)
const generatedCodes = ref<string[]>([])
const form = reactive({
  product_id: '',
  quantity: 1,
  serial_prefix: ''
})

const productOptions = computed(() => products.value.map(product => ({
  label: product.name,
  value: product.id
})))

const currentPage = computed({
  get: () => pagination.value?.current_page || 1,
  set: (value: number) => setPage(value)
})

const columns: TableColumn<AuthenticityProductRow>[] = [
  {
    accessorKey: 'name',
    header: 'Produit',
    cell: ({ row }) => {
      const product = row.original
      const image = product.thumbnail_url || product.media?.[0]?.original_url

      return h('div', { class: 'flex items-center gap-3 min-w-[240px]' }, [
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
    accessorKey: 'authenticity_stats.total_codes',
    header: 'Codes',
    cell: ({ row }) => row.original.authenticity_stats?.total_codes ?? row.original.authenticity_stats?.total ?? 0
  },
  {
    accessorKey: 'authenticity_stats.activated',
    header: 'Activés',
    cell: ({ row }) => row.original.authenticity_stats?.activated ?? 0
  },
  {
    accessorKey: 'authenticity_stats.unactivated',
    header: 'Non activés',
    cell: ({ row }) => row.original.authenticity_stats?.unactivated ?? 0
  },
  {
    accessorKey: 'authenticity_stats.total_scans',
    header: 'Scans',
    cell: ({ row }) => row.original.authenticity_stats?.total_scans ?? 0
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => h(UBadge, {
      color: row.original.status === 'active' ? 'success' : 'neutral',
      variant: 'subtle'
    }, () => row.original.status === 'active' ? 'Actif' : row.original.status)
  },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        icon: 'i-lucide-qr-code',
        label: 'Générer',
        size: 'xs',
        variant: 'soft',
        onClick: () => openGenerateModal(row.original.id)
      }),
      h(UButton, {
        icon: 'i-lucide-eye',
        size: 'xs',
        variant: 'ghost',
        onClick: () => router.push(`/products/${row.original.id}`)
      })
    ])
  }
]

function openGenerateModal(productId?: string) {
  form.product_id = productId || ''
  form.quantity = 1
  form.serial_prefix = ''
  generatedCodes.value = []
  generateModalOpen.value = true
}

async function handleGenerate() {
  if (!form.product_id) {
    toast.add({ title: 'Produit requis', description: 'Sélectionne un produit Bylin.', color: 'warning' })
    return
  }

  if (form.quantity < 1 || form.quantity > 1000) {
    toast.add({ title: 'Quantité invalide', description: 'La quantité doit être entre 1 et 1000.', color: 'warning' })
    return
  }

  const codes = await generateCodes({
    product_id: form.product_id,
    quantity: form.quantity,
    serial_prefix: form.serial_prefix || undefined
  })

  generatedCodes.value = codes.map(code => code.qr_code)
}

function handleSearch() {
  setSearch(localSearch.value.trim())
}

onMounted(() => {
  refreshAll()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Authenticité">
        <template #right>
          <UButton label="Générer QR" icon="i-lucide-qr-code" @click="openGenerateModal()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UCard>
            <p class="text-sm text-gray-500">Scans totaux</p>
            <p class="text-2xl font-bold mt-1">{{ analytics?.total_scans || 0 }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-gray-500">Authentiques</p>
            <p class="text-2xl font-bold mt-1 text-green-600">{{ analytics?.authentic_scans || 0 }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-gray-500">Suspects</p>
            <p class="text-2xl font-bold mt-1 text-red-600">{{ analytics?.fake_scans || 0 }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-gray-500">Taux suspect</p>
            <p class="text-2xl font-bold mt-1">{{ analytics?.fake_rate || 0 }}%</p>
          </UCard>
        </div>

        <UCard>
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <UInput
              v-model="localSearch"
              icon="i-lucide-search"
              placeholder="Rechercher un produit authentifié..."
              class="w-full md:max-w-sm"
              @keyup.enter="handleSearch"
            />
            <div class="flex items-center gap-2">
              <UButton label="Rechercher" variant="soft" @click="handleSearch" />
              <UButton label="Actualiser" icon="i-lucide-refresh-cw" variant="ghost" :loading="isLoading" @click="refreshAll" />
            </div>
          </div>

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

  <UModal v-model:open="generateModalOpen" title="Générer des codes QR">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Produit" required>
          <USelect v-model="form.product_id" :items="productOptions" placeholder="Sélectionner un produit" class="w-full" />
        </UFormField>

        <UFormField label="Quantité" required>
          <UInput v-model.number="form.quantity" type="number" min="1" max="1000" />
        </UFormField>

        <UFormField label="Préfixe de série">
          <UInput v-model="form.serial_prefix" placeholder="Ex: BYLIN-SAC" />
        </UFormField>

        <div v-if="generatedCodes.length" class="rounded-lg border border-gray-200 dark:border-gray-800 p-3 max-h-48 overflow-auto">
          <p class="text-sm font-medium mb-2">Codes générés</p>
          <code v-for="code in generatedCodes" :key="code" class="block text-xs py-1">{{ code }}</code>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton label="Fermer" color="neutral" variant="ghost" @click="generateModalOpen = false" />
        <UButton label="Générer" icon="i-lucide-qr-code" :loading="isGenerating" @click="handleGenerate" />
      </div>
    </template>
  </UModal>
</template>
