<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const settingCards = [
  {
    title: 'Membres de l’équipe',
    description: 'Invitez des administrateurs, changez les rôles et contrôlez les accès au dashboard.',
    icon: 'i-lucide-users-round',
    to: '/settings/members',
    action: 'Gérer l’équipe',
  },
  {
    title: 'Sécurité du compte',
    description: 'Modifiez votre mot de passe et vérifiez les paramètres liés à votre session.',
    icon: 'i-lucide-shield-check',
    to: '/settings/security',
    action: 'Ouvrir la sécurité',
  },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <AdminPageHeader
        title="Paramètres"
        description="Centralisez ici les réglages utiles à l’administration de votre boutique."
        icon="i-lucide-settings"
      />
    </template>

    <template #body>
      <div class="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div class="grid gap-4 md:grid-cols-2">
          <UCard
            v-for="card in settingCards"
            :key="card.to"
            class="transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start gap-4">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                <UIcon :name="card.icon" class="size-6" />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-base font-semibold text-gray-950 dark:text-white">
                  {{ card.title }}
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ card.description }}
                </p>
                <UButton
                  :to="card.to"
                  :label="card.action"
                  icon="i-lucide-arrow-right"
                  trailing
                  variant="soft"
                  class="mt-4"
                />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
