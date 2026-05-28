<script setup lang="ts">
import type { Member, MemberRole, MemberStatus } from '~/types/setting'
import { adminRoleLabel, adminStatusLabel } from '~/utils/adminLabels'
import { formatDateTimeFR } from '~/utils/helpers'
import { getMemberInitials, getRoleColor, getStatusColor } from '~/utils/setting'

definePageMeta({ layout: 'default' })

const {
  members,
  statistics,
  loading,
  pagination,
  filters,
  fetchMembers,
  fetchStatistics,
  deleteMember,
  updateMemberRole,
  updateMemberStatus,
  setPage,
  setSearch,
  resetFilters,
} = useSettings()

const searchQuery = ref(filters.value.search || '')
const selectedRole = ref<MemberRole | 'all'>(filters.value.role || 'all')
const selectedStatus = ref<MemberStatus | 'all'>(filters.value.status || 'all')
const showInviteModal = ref(false)
const showDeleteModal = ref(false)
const showRoleModal = ref(false)
const memberToDelete = ref<Member | null>(null)
const memberToEdit = ref<Member | null>(null)

const roleOptions = [
  { label: 'Tous les rôles', value: 'all' },
  { label: 'Super administrateur', value: 'super_admin' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Gestionnaire', value: 'manager' },
]

const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Suspendu', value: 'suspended' },
  { label: 'Invité', value: 'invited' },
]

const hasActiveFilters = computed(() => {
  return Boolean(searchQuery.value || selectedRole.value !== 'all' || selectedStatus.value !== 'all')
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (page: number) => setPage(page - 1),
})

const statCards = computed(() => [
  {
    label: 'Membres',
    value: statistics.value?.total_members ?? members.value.length,
    icon: 'i-lucide-users-round',
    description: 'Comptes ayant accès au dashboard',
  },
  {
    label: 'Actifs',
    value: statistics.value?.active_members ?? 0,
    icon: 'i-lucide-user-check',
    description: 'Comptes utilisables',
  },
  {
    label: 'Invitations',
    value: statistics.value?.pending_invitations ?? 0,
    icon: 'i-lucide-mail-plus',
    description: 'Invitations en attente',
  },
  {
    label: 'Connexions aujourd’hui',
    value: statistics.value?.logged_in_today ?? 0,
    icon: 'i-lucide-activity',
    description: 'Activité récente',
  },
])

async function loadData() {
  await Promise.allSettled([
    fetchMembers(),
    fetchStatistics(),
  ])
}

function clearAllFilters() {
  searchQuery.value = ''
  selectedRole.value = 'all'
  selectedStatus.value = 'all'
  resetFilters()
}

function askDelete(member: Member) {
  memberToDelete.value = member
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!memberToDelete.value) return

  const deleted = await deleteMember(memberToDelete.value.id)
  if (deleted) {
    showDeleteModal.value = false
    memberToDelete.value = null
    await loadData()
  }
}

function askRoleChange(member: Member) {
  memberToEdit.value = member
  showRoleModal.value = true
}

async function handleRoleChange(role: MemberRole) {
  if (!memberToEdit.value) return

  const updated = await updateMemberRole(memberToEdit.value.id, { role })
  if (updated) {
    showRoleModal.value = false
    memberToEdit.value = null
    await loadData()
  }
}

async function toggleStatus(member: Member) {
  const nextStatus: MemberStatus = member.status === 'active' ? 'inactive' : 'active'
  const updated = await updateMemberStatus(member.id, {
    status: nextStatus,
    reason: 'Mise à jour depuis le tableau de bord',
  })

  if (updated) {
    await loadData()
  }
}

function memberMenu(member: Member) {
  return [
    [
      {
        label: 'Modifier le rôle',
        icon: 'i-lucide-shield',
        onSelect: () => askRoleChange(member),
      },
      {
        label: member.status === 'active' ? 'Désactiver le compte' : 'Activer le compte',
        icon: member.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check',
        onSelect: () => toggleStatus(member),
      },
    ],
    [
      {
        label: 'Supprimer l’accès',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => askDelete(member),
      },
    ],
  ]
}

watch(searchQuery, (value) => setSearch(value))
watch(selectedRole, (value) => {
  filters.value.role = value === 'all' ? undefined : value
  pagination.value.pageIndex = 0
  fetchMembers()
})
watch(selectedStatus, (value) => {
  filters.value.status = value === 'all' ? undefined : value
  pagination.value.pageIndex = 0
  fetchMembers()
})

onMounted(loadData)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <AdminPageHeader
        title="Membres de l’équipe"
        description="Invitez les personnes qui travaillent sur la boutique, attribuez un rôle clair et contrôlez leurs accès."
        icon="i-lucide-users-round"
        back-to="/settings"
      >
        <template #actions>
          <UButton
            label="Inviter un membre"
            icon="i-lucide-user-plus"
            @click="showInviteModal = true"
          />
        </template>
      </AdminPageHeader>
    </template>

    <template #body>
      <div class="space-y-6 p-4 sm:p-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatTile
            v-for="card in statCards"
            :key="card.label"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :description="card.description"
          />
        </div>

        <UCard>
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-1 flex-col gap-3 sm:flex-row">
              <UInput
                v-model="searchQuery"
                icon="i-lucide-search"
                placeholder="Rechercher un membre par nom ou email..."
                class="w-full sm:max-w-sm"
              />

              <USelectMenu
                v-model="selectedRole"
                :items="roleOptions"
                value-key="value"
                class="w-full sm:w-56"
              />

              <USelectMenu
                v-model="selectedStatus"
                :items="statusOptions"
                value-key="value"
                class="w-full sm:w-56"
              />
            </div>

            <UButton
              v-if="hasActiveFilters"
              label="Réinitialiser"
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="ghost"
              @click="clearAllFilters"
            />
          </div>
        </UCard>

        <UCard>
          <div v-if="loading" class="space-y-3">
            <USkeleton v-for="index in 5" :key="index" class="h-16 w-full rounded-xl" />
          </div>

          <AdminEmptyState
            v-else-if="members.length === 0"
            title="Aucun membre trouvé"
            description="Invitez votre premier membre ou modifiez les filtres de recherche."
            icon="i-lucide-users-round"
            action-label="Inviter un membre"
            @action="showInviteModal = true"
          />

          <div v-else class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div class="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400 lg:grid">
              <div class="col-span-4">Membre</div>
              <div class="col-span-2">Rôle</div>
              <div class="col-span-2">Statut</div>
              <div class="col-span-3">Dernière connexion</div>
              <div class="col-span-1 text-right">Actions</div>
            </div>

            <div class="divide-y divide-gray-200 dark:divide-gray-800">
              <div
                v-for="member in members"
                :key="member.id"
                class="grid gap-4 px-4 py-4 lg:grid-cols-12 lg:items-center"
              >
                <div class="flex items-center gap-3 lg:col-span-4">
                  <UAvatar
                    :src="member.avatar_url || undefined"
                    :alt="member.name"
                    size="md"
                  >
                    {{ getMemberInitials(member) }}
                  </UAvatar>
                  <div class="min-w-0">
                    <p class="truncate font-medium text-gray-950 dark:text-white">
                      {{ member.name }}
                    </p>
                    <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                      {{ member.email }}
                    </p>
                  </div>
                </div>

                <div class="lg:col-span-2">
                  <UBadge :color="getRoleColor(member.role)" variant="subtle">
                    {{ adminRoleLabel(member.role) }}
                  </UBadge>
                </div>

                <div class="lg:col-span-2">
                  <UBadge :color="getStatusColor(member.status)" variant="subtle">
                    {{ adminStatusLabel(member.status) }}
                  </UBadge>
                </div>

                <div class="text-sm text-gray-500 dark:text-gray-400 lg:col-span-3">
                  {{ member.last_login_at ? formatDateTimeFR(member.last_login_at) : 'Jamais connecté' }}
                </div>

                <div class="flex justify-end lg:col-span-1">
                  <UDropdownMenu :items="memberMenu(member)" :content="{ align: 'end' }">
                    <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" />
                  </UDropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div v-if="pagination.totalPages > 1" class="mt-5 flex justify-end">
            <UPagination
              v-model:page="currentPage"
              :items-per-page="pagination.pageSize"
              :total="pagination.total"
            />
          </div>
        </UCard>
      </div>

      <SettingsMembersInviteModal
        v-model:open="showInviteModal"
        @success="loadData"
      />

      <SettingsMembersRoleModal
        v-model:open="showRoleModal"
        :member="memberToEdit"
        @update:role="handleRoleChange"
      />

      <UModal
        v-model:open="showDeleteModal"
        title="Supprimer l’accès au dashboard"
        description="Le membre ne pourra plus accéder à l’administration."
      >
        <template #body>
          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Confirmez-vous la suppression de l’accès pour
              <strong>{{ memberToDelete?.name }}</strong> ?
            </p>
            <div class="flex justify-end gap-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showDeleteModal = false" />
              <UButton label="Supprimer" color="error" icon="i-lucide-trash-2" :loading="loading" @click="confirmDelete" />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
