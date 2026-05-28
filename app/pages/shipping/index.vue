<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { ShippingMethod, ShippingMethodForm } from '~/composables/useShipping'
import { formatPriceXOF } from '~/utils/helpers'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const {
  methods,
  loading,
  filters,
  pagination,
  fetchMethods,
  createMethod,
  updateMethod,
  deleteMethod,
  setSearch,
  setStatus,
  setPage
} = useShipping()

const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const selectedMethod = ref<ShippingMethod | null>(null)
const localSearch = ref(filters.value.search || '')
const localStatus = ref(filters.value.status || 'all')

const emptyForm: ShippingMethodForm = {
  name: '',
  code: '',
  description: '',
  carrier: '',
  zone: '',
  base_cost: 0,
  free_shipping_threshold: null,
  estimated_delivery_min_days: null,
  estimated_delivery_max_days: null,
  is_active: true,
  sort_order: 0
}

const form = reactive<ShippingMethodForm>({ ...emptyForm })

const statusOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Actives', value: 'active' },
  { label: 'Inactives', value: 'inactive' }
]

const debouncedSearch = useDebounceFn((value: string) => {
  setSearch(value)
}, 400)

watch(localSearch, value => debouncedSearch(value))
watch(localStatus, value => setStatus(value))

const currentPage = computed({
  get: () => pagination.value.page,
  set: value => setPage(value)
})

function resetForm() {
  Object.assign(form, { ...emptyForm })
}

function openCreate() {
  selectedMethod.value = null
  resetForm()
  isFormOpen.value = true
}

function openEdit(method: ShippingMethod) {
  selectedMethod.value = method
  Object.assign(form, {
    name: method.name || '',
    code: method.code || '',
    description: method.description || '',
    carrier: method.carrier || '',
    zone: method.zone || '',
    base_cost: Number(method.base_cost ?? method.cost ?? method.price ?? 0),
    free_shipping_threshold: method.free_shipping_threshold === null || method.free_shipping_threshold === undefined ? null : Number(method.free_shipping_threshold),
    estimated_delivery_min_days: method.estimated_delivery_min_days ?? null,
    estimated_delivery_max_days: method.estimated_delivery_max_days ?? null,
    is_active: method.is_active ?? method.status === 'active',
    sort_order: method.sort_order ?? 0
  })
  isFormOpen.value = true
}

function openDelete(method: ShippingMethod) {
  selectedMethod.value = method
  isDeleteOpen.value = true
}

async function submitForm() {
  if (!form.name.trim()) {
    toast.add({ title: 'Nom requis', color: 'warning' })
    return
  }

  const payload: ShippingMethodForm = {
    ...form,
    name: form.name.trim(),
    code: form.code.trim(),
    carrier: form.carrier?.trim() || null,
    zone: form.zone?.trim() || null,
    description: form.description?.trim() || null,
    base_cost: Number(form.base_cost || 0),
    free_shipping_threshold: form.free_shipping_threshold === null ? null : Number(form.free_shipping_threshold),
    estimated_delivery_min_days: form.estimated_delivery_min_days === null ? null : Number(form.estimated_delivery_min_days),
    estimated_delivery_max_days: form.estimated_delivery_max_days === null ? null : Number(form.estimated_delivery_max_days),
    sort_order: form.sort_order === null ? null : Number(form.sort_order || 0)
  }

  const result = selectedMethod.value
    ? await updateMethod(selectedMethod.value.id, payload)
    : await createMethod(payload)

  if (result) {
    isFormOpen.value = false
    resetForm()
  }
}

async function confirmDelete() {
  if (!selectedMethod.value) return
  const deleted = await deleteMethod(selectedMethod.value.id)
  if (deleted) {
    isDeleteOpen.value = false
    selectedMethod.value = null
  }
}

function getDeliveryDelay(method: ShippingMethod): string {
  const min = method.estimated_delivery_min_days
  const max = method.estimated_delivery_max_days

  if (min && max) return min === max ? `${min} jour(s)` : `${min}-${max} jours`
  if (min) return `À partir de ${min} jour(s)`
  if (max) return `Jusqu'à ${max} jour(s)`
  return '—'
}

const columns: TableColumn<ShippingMethod>[] = [
  {
    accessorKey: 'name',
    header: 'Méthode',
    cell: ({ row }) => h('div', {}, [
      h('p', { class: 'font-medium text-gray-900 dark:text-white' }, row.original.name),
      h('p', { class: 'text-xs text-gray-500' }, row.original.code || '—')
    ])
  },
  {
    accessorKey: 'carrier',
    header: 'Transporteur',
    cell: ({ row }) => row.original.carrier || '—'
  },
  {
    accessorKey: 'zone',
    header: 'Zone',
    cell: ({ row }) => row.original.zone || '—'
  },
  {
    accessorKey: 'base_cost',
    header: 'Coût',
    cell: ({ row }) => formatPriceXOF(Number(row.original.base_cost ?? row.original.cost ?? row.original.price ?? 0))
  },
  {
    accessorKey: 'estimated_delivery_min_days',
    header: 'Délai',
    cell: ({ row }) => getDeliveryDelay(row.original)
  },
  {
    accessorKey: 'is_active',
    header: 'Statut',
    cell: ({ row }) => h(UBadge, {
      color: row.original.is_active ? 'success' : 'neutral',
      variant: 'subtle'
    }, () => row.original.is_active ? 'Active' : 'Inactive')
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'text-right' }, h(UDropdownMenu, {
      content: { align: 'end' },
      items: [[
        { label: 'Modifier', icon: 'i-lucide-pencil', onSelect: () => openEdit(row.original) },
        { label: 'Supprimer', icon: 'i-lucide-trash', color: 'error' as const, onSelect: () => openDelete(row.original) }
      ]]
    }, () => h(UButton, {
      icon: 'i-lucide-ellipsis',
      color: 'neutral',
      variant: 'ghost',
      size: 'sm'
    })))
  }
]

onMounted(() => fetchMethods())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Méthodes de livraison" :badge="pagination.total">
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="loading"
            @click="fetchMethods()"
          >
            Actualiser
          </UButton>
          <UButton icon="i-lucide-plus" label="Ajouter" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 min-h-full">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <UInput
          v-model="localSearch"
          icon="i-lucide-search"
          placeholder="Rechercher une méthode..."
          class="w-full sm:w-80"
        />

        <USelectMenu
          v-model="localStatus"
          :items="statusOptions"
          value-key="value"
          label-key="label"
          class="w-full sm:w-44"
        />
      </div>

      <UCard>
        <UTable :data="methods" :columns="columns" :loading="loading" />

        <div v-if="!loading && methods.length === 0" class="py-10 text-center text-sm text-gray-500">
          Aucune méthode de livraison trouvée.
        </div>
      </UCard>

      <div v-if="pagination.totalPages > 1" class="flex justify-end pt-4">
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pagination.perPage"
          :total="pagination.total"
        />
      </div>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="isFormOpen" :title="selectedMethod ? 'Modifier la méthode' : 'Ajouter une méthode'">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Nom" required>
          <UInput v-model="form.name" placeholder="Standard, Express..." />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Code">
            <UInput v-model="form.code" placeholder="standard" />
          </UFormField>
          <UFormField label="Transporteur">
            <UInput v-model="form.carrier" placeholder="DHL, Colissimo..." />
          </UFormField>
        </div>

        <UFormField label="Description">
          <UTextarea v-model="form.description" :rows="3" placeholder="Description visible en interne" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Zone">
            <UInput v-model="form.zone" placeholder="Bénin, Afrique de l'Ouest..." />
          </UFormField>
          <UFormField label="Coût de base">
            <UInput v-model.number="form.base_cost" type="number" min="0" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <UFormField label="Livraison gratuite dès">
            <UInput v-model.number="form.free_shipping_threshold" type="number" min="0" />
          </UFormField>
          <UFormField label="Délai min. jours">
            <UInput v-model.number="form.estimated_delivery_min_days" type="number" min="0" />
          </UFormField>
          <UFormField label="Délai max. jours">
            <UInput v-model.number="form.estimated_delivery_max_days" type="number" min="0" />
          </UFormField>
        </div>

        <div class="flex items-center justify-between rounded-lg border border-default p-3">
          <div>
            <p class="font-medium">Méthode active</p>
            <p class="text-xs text-gray-500">Disponible côté checkout quand elle est active.</p>
          </div>
          <USwitch v-model="form.is_active" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="isFormOpen = false">Annuler</UButton>
        <UButton :loading="loading" @click="submitForm">Enregistrer</UButton>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="isDeleteOpen" title="Supprimer la méthode">
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Confirmer la suppression de
        <strong>{{ selectedMethod?.name }}</strong> ?
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="isDeleteOpen = false">Annuler</UButton>
        <UButton color="error" :loading="loading" @click="confirmDelete">Supprimer</UButton>
      </div>
    </template>
  </UModal>
</template>
