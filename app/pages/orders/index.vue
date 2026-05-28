<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import {
  getOrderCustomerEmail,
  getOrderCustomerName,
  getOrderNumber,
  getOrderStatusColor,
  getOrderStatusLabel,
  getOrderTotal,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  type Order
} from '~/types/order'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const {
  state,
  orders,
  isLoading,
  fetchOrders,
  setPage,
  setSearch,
  setStatus,
  setPaymentStatus
} = useOrders()

const table = useTemplateRef('table')
const pagination = ref({ pageIndex: 0, pageSize: 15 })
const search = ref(state.value.filters.search || '')
const status = ref<string>('all')
const paymentStatus = ref<string>('all')

const statusItems = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'En traitement', value: 'processing' },
  { label: 'Expédiée', value: 'shipped' },
  { label: 'Livrée', value: 'delivered' },
  { label: 'Annulée', value: 'cancelled' }
]

const paymentItems = [
  { label: 'Tous les paiements', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'Payé', value: 'paid' },
  { label: 'Échoué', value: 'failed' },
  { label: 'Remboursé', value: 'refunded' }
]

const columns: TableColumn<Order>[] = [
  {
    accessorKey: 'order_number',
    header: 'Référence',
    cell: ({ row }) => h('button', {
      class: 'font-mono font-semibold text-primary hover:underline',
      onClick: () => navigateTo(`/orders/${row.original.id}`)
    }, getOrderNumber(row.original))
  },
  {
    id: 'customer',
    header: 'Client',
    cell: ({ row }) => h('div', {}, [
      h('p', { class: 'font-medium' }, getOrderCustomerName(row.original)),
      h('p', { class: 'text-xs text-muted' }, getOrderCustomerEmail(row.original))
    ])
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },
  {
    id: 'total',
    header: () => h('div', { class: 'text-right' }, 'Total'),
    cell: ({ row }) => h('div', { class: 'text-right font-semibold' }, formatPriceXOF(getOrderTotal(row.original)))
  },
  {
    accessorKey: 'payment_status',
    header: 'Paiement',
    cell: ({ row }) => h(UBadge, {
      color: getPaymentStatusColor(row.original.payment_status),
      variant: 'subtle'
    }, () => getPaymentStatusLabel(row.original.payment_status))
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => h(UBadge, {
      color: getOrderStatusColor(row.original.status),
      variant: 'outline'
    }, () => getOrderStatusLabel(row.original.status))
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(UDropdownMenu, {
      content: { align: 'end' },
      items: [[
        { label: 'Voir commande', icon: 'i-lucide-eye', to: `/orders/${row.original.id}` }
      ]]
    }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', variant: 'ghost', color: 'neutral' }))
  }
]

watch(search, (value) => {
  setSearch(value)
})

watch(status, (value) => {
  setStatus(value === 'all' ? undefined : value)
})

watch(paymentStatus, (value) => {
  setPaymentStatus(value === 'all' ? undefined : value)
})

watch(() => state.value.pagination?.current_page, (page) => {
  if (page) pagination.value.pageIndex = page - 1
})

onMounted(() => fetchOrders())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Commandes">
        <template #right>
          <UButton
            label="Rafraîchir"
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="isLoading"
            @click="fetchOrders()" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Rechercher une commande..."
            class="w-72" />
          <USelect v-model="status" :items="statusItems" value-key="value" label-key="label" class="w-48" />
          <USelect v-model="paymentStatus" :items="paymentItems" value-key="value" label-key="label" class="w-52" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-6 min-h-full">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="orders"
        :columns="columns"
        :loading="isLoading"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" />

      <div v-if="state.pagination" class="flex items-center justify-between mt-4 text-sm text-muted">
        <span>
          {{ state.pagination.total }} commande(s)
        </span>
        <UPagination
          :page="state.pagination.current_page"
          :items-per-page="state.pagination.per_page"
          :total="state.pagination.total"
          @update:page="setPage" />
      </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
