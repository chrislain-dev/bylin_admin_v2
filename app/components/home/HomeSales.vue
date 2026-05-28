<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Period, Range } from '~/types'
import type { Order } from '~/types/order'
import {
  getOrderNumber,
  getOrderCustomerEmail,
  getOrderTotal,
  getPaymentStatusColor,
  getPaymentStatusLabel
} from '~/types/order'
import { formatPriceXOF, formatDateTimeFR } from '~/utils/helpers'

const props = defineProps<{
  period: Period
  range: Range
}>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const { orders, isLoading, fetchOrders } = useOrders()

watch([() => props.period, () => props.range], () => {
  fetchOrders({ per_page: 5, page: 1, sort_by: 'created_at', sort_order: 'desc' })
}, { immediate: true })

const columns: TableColumn<Order>[] = [
  {
    accessorKey: 'order_number',
    header: 'Commande',
    cell: ({ row }) => h(UButton, {
      to: `/orders/${row.original.id}`,
      variant: 'link',
      color: 'primary',
      class: 'px-0 font-medium'
    }, () => getOrderNumber(row.original))
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => formatDateTimeFR(row.original.created_at)
  },
  {
    accessorKey: 'payment_status',
    header: 'Paiement',
    cell: ({ row }) => h(UBadge, {
      variant: 'subtle',
      color: getPaymentStatusColor(row.original.payment_status)
    }, () => getPaymentStatusLabel(row.original.payment_status))
  },
  {
    accessorKey: 'customer_email',
    header: 'Client',
    cell: ({ row }) => getOrderCustomerEmail(row.original)
  },
  {
    accessorKey: 'total_amount',
    header: () => h('div', { class: 'text-right' }, 'Montant'),
    cell: ({ row }) => h('div', { class: 'text-right font-medium' }, formatPriceXOF(getOrderTotal(row.original)))
  }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">Dernières commandes</p>
          <p class="text-sm text-gray-500">Les commandes les plus récentes du back-office.</p>
        </div>
        <UButton to="/orders" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right">
          Voir tout
        </UButton>
      </div>
    </template>

    <UTable
      :data="orders.slice(0, 5)"
      :columns="columns"
      :loading="isLoading"
      class="shrink-0"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
    />

    <div v-if="!isLoading && orders.length === 0" class="py-8 text-center text-sm text-gray-500">
      Aucune commande récente.
    </div>
  </UCard>
</template>
