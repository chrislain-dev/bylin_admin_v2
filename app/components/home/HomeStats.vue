<script setup lang="ts">
import type { Period, Range, Stat } from '~/types'
import { formatPriceXOF } from '~/utils/helpers'

const props = defineProps<{
  period: Period
  range: Range
}>()

const { stats, statsLoading, fetchStats } = useDashboard()

const dashboardStats = computed<Stat[]>(() => [
  {
    title: 'Clients',
    icon: 'i-lucide-users',
    value: stats.value.customers,
    variation: 0
  },
  {
    title: 'Commandes',
    icon: 'i-lucide-shopping-cart',
    value: stats.value.orders,
    variation: 0
  },
  {
    title: 'Produits',
    icon: 'i-lucide-package',
    value: stats.value.products,
    variation: 0
  },
  {
    title: 'Promotions',
    icon: 'i-lucide-ticket-percent',
    value: stats.value.promotions,
    variation: 0
  }
])

watch([() => props.period, () => props.range], () => {
  fetchStats()
}, { immediate: true })
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in dashboardStats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.title === 'Clients' ? '/customers' : stat.title === 'Commandes' ? '/orders' : stat.title === 'Produits' ? '/products' : '/promotions'"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <USkeleton v-if="statsLoading" class="h-8 w-20" />
        <span v-else class="text-2xl font-semibold text-highlighted">
          {{ typeof stat.value === 'number' ? stat.value.toLocaleString('fr-FR') : stat.value }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
