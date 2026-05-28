<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-950">
    <div class="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
      <UIcon :name="icon || 'i-lucide-inbox'" class="size-6" />
    </div>
    <h3 class="text-base font-semibold text-gray-950 dark:text-white">
      {{ title }}
    </h3>
    <p v-if="description" class="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
    <UButton
      v-if="actionLabel"
      class="mt-5"
      :label="actionLabel"
      :icon="actionIcon || 'i-lucide-plus'"
      @click="emit('action')"
    />
  </div>
</template>
