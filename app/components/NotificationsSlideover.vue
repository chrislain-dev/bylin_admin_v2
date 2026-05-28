<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { ref } from 'vue'
import type { Notification } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const notifications = ref<Notification[]>([])
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #body>
      <div v-if="notifications.length === 0" class="py-8 text-center text-sm text-muted">
        Aucune notification pour le moment.
      </div>

      <NuxtLink
        v-for="notification in notifications"
        :key="notification.id"
        :to="`/inbox?id=${notification.id}`"
        class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
      >
        <UChip
          color="error"
          :show="!!notification.unread"
          inset
        >
          <UAvatar
            v-bind="notification.sender.avatar"
            :alt="notification.sender.name"
            size="md"
          />
        </UChip>

        <div class="text-sm flex-1">
          <p class="flex items-center justify-between">
            <span class="text-highlighted font-medium">{{ notification.sender.name }}</span>

            <time
              :datetime="notification.date"
              class="text-muted text-xs"
              v-text="formatTimeAgo(new Date(notification.date))"
            />
          </p>

          <p class="text-dimmed">
            {{ notification.body }}
          </p>
        </div>
      </NuxtLink>
    </template>
  </USlideover>
</template>
