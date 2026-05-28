<script setup lang="ts">
import type { Product, ProductStatus } from '~/types/product'
import { useProductFormStore } from '~/stores/productForm'
import { useProducts } from '~/composables/useProducts'

const props = defineProps<{
  product?: Product
  mode?: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()
const { updateStock, togglePreorder } = useProducts()
const toast = useToast()

const stockAdjustment = ref<{
  operation: 'set' | 'add' | 'sub'
  quantity: number
}>({
  operation: 'set',
  quantity: 0,
})

const isEditMode = computed(() => props.mode === 'edit' && !!props.product)

const baseStatusOptions = [
  {
    label: 'Brouillon',
    value: 'draft',
    color: 'neutral',
    description: 'Le produit est préparé mais pas encore publié.',
  },
  {
    label: 'Actif',
    value: 'active',
    color: 'success',
    description: 'Le produit est visible et disponible sur la boutique.',
  },
  {
    label: 'Inactif',
    value: 'inactive',
    color: 'error',
    description: 'Le produit est masqué de la boutique.',
  },
]

const editOnlyStatusOptions = [
  {
    label: 'Rupture',
    value: 'out_of_stock',
    color: 'warning',
    description: 'Le produit n’est plus disponible en stock.',
  },
  {
    label: 'Précommande',
    value: 'preorder',
    color: 'info',
    description: 'Le produit peut être commandé avant disponibilité.',
  },
  {
    label: 'Arrêté',
    value: 'discontinued',
    color: 'neutral',
    description: 'Le produit n’est plus commercialisé.',
  },
]

const statusOptions = computed(() => {
  return isEditMode.value
    ? [...baseStatusOptions, ...editOnlyStatusOptions]
    : baseStatusOptions
})

const selectedStatus = computed(() => {
  return statusOptions.value.find((status) => status.value === productFormStore.formData.status)
})

const mainImageUrl = computed(() => {
  return productFormStore.images[0]?.url || props.product?.thumbnail_url || ''
})

const stockQuantity = computed(() => {
  return Number(productFormStore.formData.stock_quantity || props.product?.stock_quantity || 0)
})

const stockStatus = computed(() => {
  if (!productFormStore.formData.track_inventory) {
    return {
      label: 'Non suivi',
      color: 'neutral' as const,
      icon: 'i-lucide-eye-off',
      description: 'Le stock ne limite pas les commandes.',
    }
  }

  if (stockQuantity.value <= 0) {
    return {
      label: 'Rupture',
      color: 'error' as const,
      icon: 'i-lucide-alert-triangle',
      description: 'Aucune unité disponible.',
    }
  }

  const threshold = Number(productFormStore.formData.low_stock_threshold || 0)

  if (threshold > 0 && stockQuantity.value <= threshold) {
    return {
      label: 'Stock faible',
      color: 'warning' as const,
      icon: 'i-lucide-alert-circle',
      description: 'Le stock approche du seuil d’alerte.',
    }
  }

  return {
    label: 'Disponible',
    color: 'success' as const,
    icon: 'i-lucide-check-circle',
    description: 'Le produit peut être vendu normalement.',
  }
})

const productCompleteness = computed(() => {
  const checks = [
    Boolean(productFormStore.formData.name?.trim()),
    Boolean(productFormStore.formData.brand_id),
    productFormStore.formData.categories.length > 0,
    Number(productFormStore.formData.price || 0) > 0,
    productFormStore.images.length > 0 || Boolean(props.product?.thumbnail_url),
  ]

  const completed = checks.filter(Boolean).length

  return Math.round((completed / checks.length) * 100)
})

const quickActions = computed(() => [
  {
    key: 'is_featured',
    label: 'Mettre en avant',
    description: 'Afficher ce produit dans les zones prioritaires.',
    icon: 'i-lucide-star',
    value: productFormStore.formData.is_featured,
  },
  {
    key: 'is_new',
    label: 'Nouveau produit',
    description: 'Signaler ce produit comme nouveauté.',
    icon: 'i-lucide-sparkles',
    value: productFormStore.formData.is_new,
  },
  {
    key: 'is_on_sale',
    label: 'En promotion',
    description: 'Indiquer que le produit bénéficie d’une offre.',
    icon: 'i-lucide-badge-percent',
    value: productFormStore.formData.is_on_sale,
  },
])

async function handleStockUpdate(): Promise<void> {
  if (!props.product?.id) {
    toast.add({
      title: 'Action non disponible',
      description: 'Sauvegardez d’abord le produit avant d’ajuster le stock.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    })

    return
  }

  if (!stockAdjustment.value.quantity || stockAdjustment.value.quantity <= 0) {
    toast.add({
      title: 'Quantité requise',
      description: 'Veuillez entrer une quantité supérieure à zéro.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    })

    return
  }

  const success = await updateStock(
    props.product.id,
    stockAdjustment.value.quantity,
    stockAdjustment.value.operation,
  )

  if (success) {
    stockAdjustment.value.quantity = 0

    toast.add({
      title: 'Stock mis à jour',
      description: 'L’ajustement du stock a été enregistré.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  }
}

async function handleTogglePreorder(value?: boolean): Promise<void> {
  const enable = typeof value === 'boolean'
    ? value
    : !productFormStore.formData.is_preorder_enabled

  if (!props.product?.id) {
    productFormStore.setFormData({ is_preorder_enabled: enable })
    return
  }

  if (enable && !productFormStore.formData.preorder_available_date) {
    toast.add({
      title: 'Date requise',
      description: 'Renseignez une date de disponibilité avant d’activer la précommande.',
      color: 'warning',
      icon: 'i-lucide-calendar-alert',
    })

    return
  }

  const success = await togglePreorder(
    props.product.id,
    enable,
    enable
      ? {
          available_date: productFormStore.formData.preorder_available_date || '',
          limit: productFormStore.formData.preorder_limit,
          message: productFormStore.formData.preorder_message || '',
        }
      : undefined,
  )

  if (success) {
    productFormStore.setFormData({ is_preorder_enabled: enable })

    toast.add({
      title: enable ? 'Précommande activée' : 'Précommande désactivée',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  }
}

function updateQuickAction(key: string, value: boolean): void {
  productFormStore.setFormData({
    [key]: value,
  })
}

function updateStatus(value: ProductStatus): void {
  productFormStore.setFormData({ status: value })

  if (value === 'preorder') {
    productFormStore.setFormData({ is_preorder_enabled: true })
  }
}
</script>

<template>
  <aside class="w-full space-y-6">
    <!-- Conseil création -->
    <UAlert
      v-if="!isEditMode"
      icon="i-lucide-lightbulb"
      color="primary"
      variant="soft"
      title="Conseil"
      description="Commencez par le nom, la marque, une catégorie, le prix et au moins une image. Vous pourrez enrichir le produit ensuite."
    />

    <!-- Aperçu produit -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-950 dark:text-white">
              Aperçu boutique
            </h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Résumé rapide de ce que le client verra.
            </p>
          </div>

          <UBadge
            :color="selectedStatus?.color as any || 'neutral'"
            variant="subtle"
          >
            {{ selectedStatus?.label || 'Brouillon' }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-5">
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
          <div class="aspect-square">
            <img
              v-if="mainImageUrl"
              :src="mainImageUrl"
              :alt="productFormStore.formData.name || 'Aperçu produit'"
              class="size-full object-cover"
            >

            <div
              v-else
              class="flex size-full flex-col items-center justify-center gap-2 text-gray-400"
            >
              <UIcon name="i-lucide-image" class="size-12" />
              <p class="text-xs">
                Aucune image
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="line-clamp-2 text-base font-semibold text-gray-950 dark:text-white">
            {{ productFormStore.formData.name || 'Nom du produit' }}
          </h4>

          <p class="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {{ productFormStore.formData.short_description || 'Ajoutez un résumé court pour mieux présenter le produit.' }}
          </p>

          <p class="text-lg font-semibold text-gray-950 dark:text-white">
            {{ Number(productFormStore.formData.price || 0).toLocaleString('fr-FR') }} F CFA
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UIcon
                :name="stockStatus.icon"
                class="size-4"
              />
              <span class="text-sm text-gray-600 dark:text-gray-300">
                Stock
              </span>
            </div>

            <UBadge
              :color="stockStatus.color"
              variant="subtle"
            >
              {{ stockStatus.label }}
            </UBadge>
          </div>

          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {{ stockStatus.description }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Publication -->
    <UCard>
      <template #header>
        <div>
          <h3 class="text-sm font-semibold text-gray-950 dark:text-white">
            Publication
          </h3>

          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Contrôlez la visibilité du produit.
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Statut du produit">
          <USelectMenu
            :model-value="productFormStore.formData.status"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            class="w-full"
            @update:model-value="updateStatus($event as ProductStatus)"
          />
        </UFormField>

        <UAlert
          v-if="selectedStatus"
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          :title="selectedStatus.label"
          :description="selectedStatus.description"
        />
      </div>
    </UCard>

    <!-- Progression -->
    <UCard>
      <template #header>
        <div>
          <h3 class="text-sm font-semibold text-gray-950 dark:text-white">
            Qualité de la fiche
          </h3>

          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Plus la fiche est complète, meilleure sera l’expérience client.
          </p>
        </div>
      </template>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Complétion
          </span>

          <span class="text-sm font-medium text-gray-950 dark:text-white">
            {{ productCompleteness }}%
          </span>
        </div>

        <UProgress
          :model-value="productCompleteness"
          :color="productCompleteness >= 80 ? 'success' : productCompleteness >= 50 ? 'warning' : 'error'"
        />

        <p class="text-xs text-gray-500 dark:text-gray-400">
          Vérifiez le nom, la marque, les catégories, le prix et les images avant publication.
        </p>
      </div>
    </UCard>

    <!-- Stock rapide -->
    <UCard v-if="productFormStore.formData.track_inventory">
      <template #header>
        <div>
          <h3 class="text-sm font-semibold text-gray-950 dark:text-white">
            Stock
          </h3>

          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ isEditMode ? 'Ajustez rapidement le stock du produit.' : 'Définissez le stock initial.' }}
          </p>
        </div>
      </template>

      <template v-if="isEditMode">
        <div class="space-y-4">
          <div class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/50">
            <span class="text-sm text-gray-600 dark:text-gray-300">
              Stock actuel
            </span>

            <UBadge
              :color="stockQuantity > 0 ? 'success' : 'error'"
              variant="subtle"
            >
              {{ stockQuantity }} unité{{ stockQuantity > 1 ? 's' : '' }}
            </UBadge>
          </div>

          <UFormField label="Type d’ajustement">
            <USelectMenu
              v-model="stockAdjustment.operation"
              :items="[
                { label: 'Définir le stock', value: 'set' },
                { label: 'Ajouter au stock', value: 'add' },
                { label: 'Retirer du stock', value: 'sub' },
              ]"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <div class="flex gap-2">
            <UInput
              v-model.number="stockAdjustment.quantity"
              type="number"
              min="0"
              placeholder="Quantité"
              class="flex-1"
            />

            <UButton
              icon="i-lucide-check"
              color="primary"
              aria-label="Ajuster le stock"
              @click="handleStockUpdate"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <UFormField label="Stock initial">
          <UInput
            :model-value="productFormStore.formData.stock_quantity"
            type="number"
            min="0"
            placeholder="0"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ stock_quantity: Number($event) })"
          >
            <template #trailing>
              <span class="text-xs text-gray-400">unités</span>
            </template>
          </UInput>
        </UFormField>
      </template>
    </UCard>

    <!-- Actions rapides -->
    <UCard>
      <template #header>
        <div>
          <h3 class="text-sm font-semibold text-gray-950 dark:text-white">
            Mise en avant
          </h3>

          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Sélectionnez les badges commerciaux du produit.
          </p>
        </div>
      </template>

      <div class="divide-y divide-gray-200 dark:divide-gray-800">
        <div
          v-for="action in quickActions"
          :key="action.key"
          class="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div class="flex gap-3">
            <UIcon
              :name="action.icon"
              class="mt-0.5 size-4 text-gray-500"
            />

            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">
                {{ action.label }}
              </p>

              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ action.description }}
              </p>
            </div>
          </div>

          <USwitch
            :model-value="Boolean(action.value)"
            @update:model-value="updateQuickAction(action.key, $event as boolean)"
          />
        </div>
      </div>
    </UCard>

    <!-- Précommande rapide -->
    <UCard v-if="productFormStore.formData.status === 'preorder' || productFormStore.formData.is_preorder_enabled">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-950 dark:text-white">
              Précommande
            </h3>

            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Vente avant disponibilité.
            </p>
          </div>

          <USwitch
            :model-value="productFormStore.formData.is_preorder_enabled"
            @update:model-value="handleTogglePreorder($event as boolean)"
          />
        </div>
      </template>

      <div v-if="productFormStore.formData.is_preorder_enabled" class="space-y-4">
        <UFormField label="Date de disponibilité">
          <UInput
            :model-value="productFormStore.formData.preorder_available_date"
            type="date"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ preorder_available_date: String($event || '') })"
          />
        </UFormField>

        <UFormField label="Limite de précommandes">
          <UInput
            :model-value="productFormStore.formData.preorder_limit"
            type="number"
            min="1"
            placeholder="Illimité"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ preorder_limit: $event ? Number($event) : undefined })"
          />
        </UFormField>

        <div
          v-if="isEditMode && product?.preorder_count && product.preorder_count > 0"
          class="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <UIcon name="i-lucide-shopping-cart" class="size-4 text-blue-600 dark:text-blue-400" />

          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
            {{ product.preorder_count }} précommande{{ product.preorder_count > 1 ? 's' : '' }} en cours
          </span>
        </div>
      </div>
    </UCard>
  </aside>
</template>
