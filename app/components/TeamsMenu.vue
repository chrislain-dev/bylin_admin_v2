<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="flex h-[--header-height] w-full items-center" :class="collapsed ? 'justify-center' : 'px-3'">
    <NuxtLink to="/" class="flex min-w-0 items-center gap-3 rounded-xl px-1 py-2 transition hover:opacity-80">
      <img src="~/assets/logo-blue.png" alt="Bylin" class="h-8 w-auto shrink-0 object-contain">
      <div v-if="!collapsed" class="min-w-0">
        <p class="truncate text-sm font-semibold leading-5 text-gray-950 dark:text-white">
          Bylin
        </p>
        <p class="truncate text-xs text-gray-500 dark:text-gray-400">
          Administration
        </p>
      </div>
    </NuxtLink>
  </div>
</template>
