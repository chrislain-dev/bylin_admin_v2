<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, parseISO } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
}>()

type DataRecord = {
  date: Date
  amount: number
}

type DashboardStatsResponse = {
  success: boolean
  data: {
    revenue?: number
    revenue_series?: Array<{ date: string, amount: number }>
  }
}

const client = useSanctumClient()
const { width } = useElementSize(cardRef)

const data = ref<DataRecord[]>([])
const loading = ref(false)
const loadFailed = ref(false)

function emptySeries(): DataRecord[] {
  const dates = ({
    daily: eachDayOfInterval,
    weekly: eachWeekOfInterval,
    monthly: eachMonthOfInterval
  } as Record<Period, typeof eachDayOfInterval>)[props.period](props.range)

  return dates.map(date => ({ date, amount: 0 }))
}

async function fetchRevenueSeries() {
  loading.value = true
  loadFailed.value = false

  try {
    const response = await client<DashboardStatsResponse>('/api/v1/admin/dashboard/stats', {
      method: 'GET',
      params: {
        period: props.period,
        date_from: format(props.range.start, 'yyyy-MM-dd'),
        date_to: format(props.range.end, 'yyyy-MM-dd')
      }
    })

    const series = response.data?.revenue_series ?? []

    data.value = series.length > 0
      ? series.map(item => ({ date: parseISO(item.date), amount: Number(item.amount || 0) }))
      : emptySeries()
  } catch {
    loadFailed.value = true
    data.value = emptySeries()
  } finally {
    loading.value = false
  }
}

watch([() => props.period, () => props.range], fetchRevenueSeries, { immediate: true })

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.amount

const total = computed(() => data.value.reduce((acc: number, { amount }) => acc + amount, 0))

const formatNumber = new Intl.NumberFormat('fr', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format

const formatDate = (date: Date): string => {
  return ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyy')
  })[props.period]
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return ''
  }

  return formatDate(data.value[i].date)
}

const template = (d: DataRecord) => `${formatDate(d.date)}: ${formatNumber(d.amount)}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          Revenue
        </p>
        <div class="flex items-center gap-3">
          <p class="text-3xl text-highlighted font-semibold">
            {{ formatNumber(total) }}
          </p>
          <UIcon v-if="loading" name="i-lucide-loader-circle" class="animate-spin text-muted" />
        </div>
        <p v-if="loadFailed" class="text-xs text-error mt-2">
          Impossible de charger la courbe de revenus. Les valeurs affichées sont à zéro.
        </p>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="y"
        color="var(--ui-primary)"
      />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-primary)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
