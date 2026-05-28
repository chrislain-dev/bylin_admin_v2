<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'Nouveau Produit',
  icon: 'i-lucide-package-plus',
  to: '/products/create'
}, {
  label: 'Nouvelle Promotion',
  icon: 'i-lucide-ticket',
  to: '/promotions'
}, {
  label: 'Ajouter un Membre',
  icon: 'i-lucide-user-plus',
  to: '/settings/members'
}]] satisfies DropdownMenuItem[][]


const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Tableau de bord" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <!-- Bouton de Notifications -->
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <!-- Menu d'Actions Rapides -->
          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- Sélecteur de date -->
          <HomeDateRangePicker v-model="range" class="-ms-1" />

          <!-- Sélecteur de période (Journalier, Hebdo, Mensuel) -->
          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
      <!-- 1. STATS GLOBALES -->
      <HomeStats :period="period" :range="range" />

      <!--
        2. GRAPHIQUE PRINCIPAL
        Devra afficher l'évolution des ventes ou des scans d'authenticité
      -->
      <HomeChart :period="period" :range="range" />

      <div class="grid lg:grid-cols-2 gap-8">
        <!--
          3. DERNIÈRES COMMANDES (HomeSales)
          Devra appeler : Route::get('/orders') avec un limit(5)
        -->
        <HomeSales :period="period" :range="range" />

        <!--
          Tu pourras ajouter ici un composant <HomeLowStock />
          qui appelle Route::get('/inventory/low-stock')
        -->
      </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
