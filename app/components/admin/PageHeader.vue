<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  backTo?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-4 border-b border-gray-200/80 bg-white/70 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/60 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
    <div class="flex items-start gap-3">
      <UButton
        v-if="backTo"
        :to="backTo"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        class="mt-0.5"
      />

      <div v-if="icon" class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-900">
        <UIcon :name="icon" class="size-5" />
      </div>

      <div class="min-w-0">
        <h1 class="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">
          {{ title }}
        </h1>
        <p v-if="description" class="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
