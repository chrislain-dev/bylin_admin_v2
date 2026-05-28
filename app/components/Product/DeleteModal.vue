<script setup lang="ts">
import type { Product } from '~/types/product'
import { useProducts } from '~/composables/useProducts'
/**
 * Composant de suppression/restauration de produit(s)
 *
 * Gère :
 * - suppression simple soft delete
 * - restauration
 * - suppression définitive
 * - suppression/restauration bulk
 */

const props = defineProps<{
  open: boolean
  ids: string[]
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const {
  deleteProducts,
  restoreProducts,
  forceDeleteProducts,
  isLoading,
  state,
} = useProducts()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const selectedProducts = computed(() => {
  return state.value.products.filter((product: Product) => props.ids.includes(product.id))
})

const hasVariations = computed(() => {
  return selectedProducts.value.some((product: Product) => {
    return product.is_variable && (product.variations?.length ?? 0) > 0
  })
})

const hasPreorders = computed(() => {
  return selectedProducts.value.some((product: Product) => product.is_preorder_enabled)
})

const hasTrashed = computed(() => {
  return selectedProducts.value.some((product: Product) => Boolean(product.deleted_at))
})

const warningMessage = computed(() => {
  const warnings: string[] = []

  if (hasVariations.value) {
    warnings.push('certains produits contiennent des variations')
  }

  if (hasPreorders.value) {
    warnings.push('certains produits ont des précommandes actives')
  }

  if (warnings.length === 0) {
    return null
  }

  return `Attention : ${warnings.join(' et ')}. Ces éléments seront également supprimés.`
})

const actionType = ref<'delete' | 'restore' | 'force'>('delete')

const isForceDelete = computed({
  get: () => actionType.value === 'force',
  set: (value: boolean) => {
    actionType.value = value ? 'force' : 'restore'
  },
})

const buttonLabel = computed(() => {
  const count = props.ids.length

  switch (actionType.value) {
    case 'restore':
      return count > 1 ? `Restaurer ${count} produits` : 'Restaurer'

    case 'force':
      return count > 1
        ? `Supprimer définitivement ${count} produits`
        : 'Supprimer définitivement'

    default:
      return count > 1 ? `Supprimer ${count} produits` : 'Supprimer'
  }
})

const buttonColor = computed(() => {
  return actionType.value === 'force' ? 'error' : 'warning'
})

const modalTitle = computed(() => {
  if (hasTrashed.value) {
    return props.ids.length > 1 ? 'Restaurer les produits' : 'Restaurer le produit'
  }

  return props.ids.length > 1 ? 'Supprimer les produits' : 'Supprimer le produit'
})

const modalDescription = computed(() => {
  if (hasTrashed.value) {
    return props.ids.length > 1
      ? `Restaurer ${props.ids.length} produits depuis la corbeille`
      : 'Restaurer ce produit depuis la corbeille'
  }

  return props.ids.length > 1
    ? `Supprimer ${props.ids.length} produits du catalogue`
    : 'Supprimer ce produit du catalogue'
})

async function handleDelete(): Promise<void> {
  if (props.ids.length === 0 || isLoading.value) {
    return
  }

  let success = false

  switch (actionType.value) {
    case 'restore':
      success = await restoreProducts(props.ids)
      break

    case 'force':
      success = await forceDeleteProducts(props.ids)
      break

    default:
      success = await deleteProducts(props.ids)
      break
  }

  if (success) {
    isOpen.value = false
    emit('success')
  }
}

watch(isOpen, (value) => {
  if (!value) {
    return
  }

  actionType.value = hasTrashed.value ? 'restore' : 'delete'
})
</script>

<template>
  <UModal v-model:open="isOpen" :title="modalTitle" :description="modalDescription">
    <template #content>
      <div class="p-6 space-y-4">
        <div v-if="hasTrashed" class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{
              ids.length > 1
                ? `Voulez-vous restaurer ces ${ids.length} produits ?`
                : 'Voulez-vous restaurer ce produit ?'
            }}
          </p>

          <p class="text-sm text-gray-500">
            Les produits seront à nouveau visibles et accessibles.
          </p>
        </div>

        <div v-else class="space-y-2">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{
              ids.length > 1
                ? `Êtes-vous sûr de vouloir supprimer ces ${ids.length} produits ?`
                : 'Êtes-vous sûr de vouloir supprimer ce produit ?'
            }}
          </p>

          <p class="text-sm text-gray-500">
            {{
              ids.length > 1
                ? 'Les produits seront placés dans la corbeille et pourront être restaurés ultérieurement.'
                : 'Le produit sera placé dans la corbeille et pourra être restauré ultérieurement.'
            }}
          </p>
        </div>

        <div v-if="selectedProducts.length > 0 && selectedProducts.length <= 5"
          class="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
          <div v-for="product in selectedProducts" :key="product.id" class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <UAvatar v-if="product.thumbnail_url || product.media?.[0]?.original_url"
                :src="product.thumbnail_url || product.media?.[0]?.original_url" :alt="product.name" size="sm"
                class="shrink-0" />

              <UAvatar v-else icon="i-lucide-package" size="sm" class="shrink-0 bg-gray-100 dark:bg-gray-800" />

              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ product.name }}
                </p>

                <p class="text-xs text-gray-500 font-mono">
                  {{ product.sku }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <UBadge v-if="product.is_variable && product.variations && product.variations.length > 0" variant="subtle"
                color="secondary" size="xs">
                {{ product.variations.length }} variation{{ product.variations.length > 1 ? 's' : '' }}
              </UBadge>

              <UBadge v-if="product.is_preorder_enabled" variant="subtle" color="secondary" size="xs">
                Précommande
              </UBadge>

              <UBadge v-if="product.stock_quantity <= 0" variant="subtle" color="error" size="xs">
                Épuisé
              </UBadge>
            </div>
          </div>
        </div>

        <div v-else-if="selectedProducts.length > 5" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedProducts.length }} produits sélectionnés
          </p>
        </div>

        <UAlert v-if="warningMessage && !hasTrashed" color="warning" variant="subtle" icon="i-lucide-alert-triangle"
          :title="warningMessage" />

        <div v-if="hasTrashed" class="border-t pt-4">
          <div class="flex items-start gap-3">
            <UCheckbox v-model="isForceDelete" />

            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Supprimer définitivement
              </p>

              <p class="text-xs text-gray-500 mt-0.5">
                Cette action est irréversible. Les produits seront supprimés de la base de données.
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton label="Annuler" color="neutral" variant="ghost" :disabled="isLoading" @click="isOpen = false" />

          <UButton :label="buttonLabel" :color="buttonColor" :loading="isLoading"
            :icon="actionType === 'force' ? 'i-lucide-trash-2' : actionType === 'restore' ? 'i-lucide-refresh-cw' : 'i-lucide-trash'"
            @click="handleDelete" />
        </div>
      </div>
    </template>
  </UModal>
</template>
