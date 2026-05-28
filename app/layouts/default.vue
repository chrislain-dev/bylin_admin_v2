<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { stats, fetchStats } = useDashboard()
const open = ref(false)

function closeMenu() {
  open.value = false
}

interface NavigationItem extends NavigationMenuItem {
  children?: NavigationItem[]
  badge?: string
  onSelect?: () => void
}

function item<T extends NavigationItem>(payload: T): T {
  return payload
}

function positiveBadge(value?: number | null): string | undefined {
  return value && value > 0 ? String(value) : undefined
}

const links = computed<NavigationItem[][]>(() => [
  [
    item({
      label: 'Tableau de bord',
      icon: 'i-lucide-layout-dashboard',
      to: '/',
      exact: true,
      onSelect: closeMenu,
    }),
    item({
      label: 'Commandes',
      icon: 'i-lucide-shopping-bag',
      to: '/orders',
      badge: positiveBadge(stats.value.orders),
      onSelect: closeMenu,
    }),
    item({
      label: 'Précommandes',
      icon: 'i-lucide-calendar-clock',
      to: '/products/preorders',
      onSelect: closeMenu,
    }),
    item({
      label: 'Clients',
      icon: 'i-lucide-users',
      to: '/customers',
      badge: positiveBadge(stats.value.customers),
      onSelect: closeMenu,
    }),
  ],
  [
    item({
      label: 'Catalogue',
      icon: 'i-lucide-package-search',
      defaultOpen: true,
      type: 'trigger',
      children: [
        item({
          label: 'Produits',
          description: 'Créer, modifier, publier',
          to: '/products',
          exact: true,
          badge: positiveBadge(stats.value.products),
          onSelect: closeMenu,
        }),
        item({
          label: 'Collections',
          description: 'Regrouper les produits',
          to: '/products/collections',
          exact: true,
          badge: positiveBadge(stats.value.collections),
          onSelect: closeMenu,
        }),
        item({
          label: 'Catégories',
          description: 'Organiser le catalogue',
          to: '/products/categories',
          badge: positiveBadge(stats.value.categories),
          onSelect: closeMenu,
        }),
        item({
          label: 'Marques',
          description: 'Gérer les marques',
          to: '/products/brands',
          badge: positiveBadge(stats.value.brands),
          onSelect: closeMenu,
        }),
        item({
          label: 'Attributs et variantes',
          description: 'Tailles, couleurs, options',
          to: '/products/attributes',
          badge: positiveBadge(stats.value.attributes),
          onSelect: closeMenu,
        }),
        item({
          label: 'Authenticité',
          description: 'QR codes et vérifications',
          to: '/products/authenticity',
          onSelect: closeMenu,
        }),
      ],
    }),
    item({
      label: 'Inventaire',
      icon: 'i-lucide-boxes',
      defaultOpen: false,
      type: 'trigger',
      children: [
        item({
          label: 'État du stock',
          to: '/inventory',
          onSelect: closeMenu,
        }),
        item({
          label: 'Mouvements de stock',
          to: '/inventory/movements',
          onSelect: closeMenu,
        }),
      ],
    }),
  ],
  [
    item({
      label: 'Promotions',
      icon: 'i-lucide-percent',
      to: '/promotions',
      badge: positiveBadge(stats.value.promotions),
      onSelect: closeMenu,
    }),
    item({
      label: 'Avis clients',
      icon: 'i-lucide-star',
      to: '/reviews',
      badge: positiveBadge(stats.value.reviews),
      onSelect: closeMenu,
    }),
    item({
      label: 'Livraison',
      icon: 'i-lucide-truck',
      to: '/shipping',
      onSelect: closeMenu,
    }),
  ],
  [
    item({
      label: 'Paramètres',
      icon: 'i-lucide-settings',
      type: 'trigger',
      defaultOpen: false,
      children: [
        item({
          label: 'Vue d’ensemble',
          to: '/settings',
          onSelect: closeMenu,
        }),
        item({
          label: 'Membres de l’équipe',
          description: 'Rôles et accès admin',
          to: '/settings/members',
          onSelect: closeMenu,
        }),
        item({
          label: 'Sécurité',
          description: 'Mot de passe et sessions',
          to: '/settings/security',
          onSelect: closeMenu,
        }),
      ],
    }),
  ],
])

function hasChildren(item: NavigationItem): item is NavigationItem & Required<Pick<NavigationItem, 'children'>> {
  return Boolean(item.children?.length)
}

const groups = computed(() => [{
  id: 'links',
  label: 'Navigation',
  items: links.value.flat().flatMap((navItem) => hasChildren(navItem) ? navItem.children : [navItem]),
}])

onMounted(async () => {
  await fetchStats()
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="border-r border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <div class="px-2 pb-3">
          <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
        </div>

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4 custom-scrollbar">
          <UNavigationMenu
            v-for="(group, index) in links"
            :key="index"
            :collapsed="collapsed"
            :items="group"
            orientation="vertical"
            tooltip
            popover
          />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />
    <slot />
    <NotificationsSlideover />
  </UDashboardGroup>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
}
</style>
