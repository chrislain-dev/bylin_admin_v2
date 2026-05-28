<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon?: string
  description?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
}>()
</script>

<template>
  <UCard class="overflow-hidden">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ label }}
        </p>
        <p class="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">
          {{ value }}
        </p>
        <p v-if="description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
      <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
        <UIcon :name="icon || 'i-lucide-chart-no-axes-column'" class="size-5" />
      </div>
    </div>
  </UCard>
</template>
