<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Member, MemberRole } from '~/types/setting'

const props = defineProps<{
  members: Member[]
}>()

const emit = defineEmits<{
  edit: [member: Member]
  remove: [member: Member]
  updateRole: [member: Member, role: MemberRole]
}>()

function menuItems(member: Member): DropdownMenuItem[] {
  return [
    {
      label: 'Modifier le membre',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', member)
    },
    {
      label: 'Supprimer le membre',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => emit('remove', member)
    }
  ]
}

const roleItems: MemberRole[] = ['manager', 'admin', 'super_admin']
</script>

<template>
  <ul role="list" class="divide-y divide-default">
    <li
      v-for="member in props.members"
      :key="member.id"
      class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6"
    >
      <div class="flex items-center gap-3 min-w-0">
        <UAvatar
          :src="member.avatar_url || undefined"
          :alt="member.name"
          size="md"
        />

        <div class="text-sm min-w-0">
          <p class="text-highlighted font-medium truncate">
            {{ member.name }}
          </p>
          <p class="text-muted truncate">
            {{ member.email }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <USelect
          :model-value="member.role"
          :items="roleItems"
          color="neutral"
          :ui="{ value: 'capitalize', item: 'capitalize' }"
          @update:model-value="(role) => emit('updateRole', member, role as MemberRole)"
        />

        <UDropdownMenu :items="menuItems(member)" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            :aria-label="`Actions pour ${member.name}`"
          />
        </UDropdownMenu>
      </div>
    </li>
  </ul>
</template>
