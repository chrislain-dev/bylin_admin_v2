<script setup lang="ts">
import { useProductFormStore } from '~/stores/productForm'

const productFormStore = useProductFormStore()

const margin = computed(() => {
  const price = Number(productFormStore.formData.price || 0)
  const cost = Number(productFormStore.formData.cost_price || 0)

  if (price <= 0 || cost <= 0) {
    return null
  }

  return Math.round(((price - cost) / price) * 100)
})

const hasPromotion = computed(() => {
  const price = Number(productFormStore.formData.price || 0)
  const comparePrice = Number(productFormStore.formData.compare_price || 0)

  return comparePrice > price && price > 0
})

const discountPercent = computed(() => {
  const price = Number(productFormStore.formData.price || 0)
  const comparePrice = Number(productFormStore.formData.compare_price || 0)

  if (!hasPromotion.value) {
    return null
  }

  return Math.round(((comparePrice - price) / comparePrice) * 100)
})

const stockStatus = computed(() => {
  const quantity = Number(productFormStore.formData.stock_quantity || 0)
  const threshold = Number(productFormStore.formData.low_stock_threshold || 0)

  if (!productFormStore.formData.track_inventory) {
    return {
      label: 'Stock non suivi',
      color: 'neutral' as const,
      description: 'Les commandes ne seront pas limitées par la quantité disponible.',
    }
  }

  if (quantity <= 0) {
    return {
      label: 'Rupture',
      color: 'error' as const,
      description: 'Le produit ne devrait plus être vendu tant que le stock n’est pas réapprovisionné.',
    }
  }

  if (threshold > 0 && quantity <= threshold) {
    return {
      label: 'Stock faible',
      color: 'warning' as const,
      description: 'Le produit approche du seuil d’alerte.',
    }
  }

  return {
    label: 'Stock disponible',
    color: 'success' as const,
    description: 'Le produit peut être vendu normalement.',
  }
})

function setNumberField(
  key: 'price' | 'compare_price' | 'cost_price' | 'stock_quantity' | 'low_stock_threshold',
  value: string | number | null | undefined,
): void {
  const numericValue = value === '' || value === null || value === undefined
    ? undefined
    : Number(value)

  productFormStore.setFormData({
    [key]: numericValue,
  })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Résumé prix / stock -->
    <div class="grid gap-4 md:grid-cols-3">
      <UCard>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Prix de vente
            </p>

            <p class="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
              {{ Number(productFormStore.formData.price || 0).toLocaleString('fr-FR') }} F CFA
            </p>
          </div>

          <UIcon name="i-lucide-banknote" class="size-5 text-primary" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Promotion
            </p>

            <p class="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
              {{ discountPercent !== null ? `-${discountPercent}%` : 'Aucune' }}
            </p>
          </div>

          <UIcon name="i-lucide-badge-percent" class="size-5 text-warning" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Marge estimée
            </p>

            <p class="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
              {{ margin !== null ? `${margin}%` : '—' }}
            </p>
          </div>

          <UIcon name="i-lucide-trending-up" class="size-5 text-success" />
        </div>
      </UCard>
    </div>

    <!-- Prix -->
    <UCard>
      <template #header>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Prix du produit
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Définissez le prix affiché au client. Le prix barré permet de montrer une réduction.
            </p>
          </div>

          <UBadge v-if="hasPromotion" color="warning" variant="subtle">
            Promotion active
          </UBadge>
        </div>
      </template>

      <div class="grid gap-5 lg:grid-cols-3">
        <UFormField label="Prix de vente" description="Prix réellement payé par le client." required>
          <UInput :model-value="productFormStore.formData.price" type="number" step="500" min="0"
            placeholder="Ex. 25000" class="w-full" @update:model-value="setNumberField('price', $event)">
            <template #trailing>
              <span class="text-xs text-gray-400">F CFA</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Prix barré" description="Ancien prix affiché si le produit est en promotion.">
          <UInput :model-value="productFormStore.formData.compare_price" type="number" step="500" min="0"
            placeholder="Optionnel" class="w-full" @update:model-value="setNumberField('compare_price', $event)">
            <template #trailing>
              <span class="text-xs text-gray-400">F CFA</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Coût d’achat" description="Utilisé uniquement en interne pour suivre la marge.">
          <UInput :model-value="productFormStore.formData.cost_price" type="number" step="500" min="0"
            placeholder="Interne" class="w-full" @update:model-value="setNumberField('cost_price', $event)">
            <template #trailing>
              <span class="text-xs text-gray-400">F CFA</span>
            </template>
          </UInput>
        </UFormField>
      </div>

      <UAlert
        v-if="productFormStore.formData.compare_price && Number(productFormStore.formData.compare_price) <= Number(productFormStore.formData.price)"
        class="mt-5" color="warning" variant="soft" icon="i-lucide-alert-triangle" title="Prix barré incohérent"
        description="Le prix barré doit être supérieur au prix de vente pour afficher une réduction." />
    </UCard>

    <!-- Stock -->
    <UCard>
      <template #header>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Stock disponible
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Suivez les quantités pour éviter de vendre plus de produits que votre stock réel.
            </p>
          </div>

          <UBadge :color="stockStatus.color" variant="subtle">
            {{ stockStatus.label }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-5">
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-medium text-gray-950 dark:text-white">
                Suivi de stock
              </p>

              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ stockStatus.description }}
              </p>
            </div>

            <USwitch :model-value="productFormStore.formData.track_inventory" label="Activer le suivi"
              @update:model-value="productFormStore.setFormData({ track_inventory: $event as boolean })" />
          </div>
        </div>

        <div v-if="productFormStore.formData.track_inventory" class="grid gap-5 lg:grid-cols-2">
          <UFormField label="Quantité disponible" description="Nombre d’unités actuellement disponibles.">
            <UInput :model-value="productFormStore.formData.stock_quantity" type="number" min="0" placeholder="0"
              class="w-full" @update:model-value="setNumberField('stock_quantity', $event)">
              <template #trailing>
                <span class="text-xs text-gray-400">unités</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Seuil d’alerte" description="Une alerte sera affichée lorsque le stock atteint ce niveau.">
            <UInput :model-value="productFormStore.formData.low_stock_threshold" type="number" min="0"
              placeholder="Ex. 5" class="w-full" @update:model-value="setNumberField('low_stock_threshold', $event)">
              <template #trailing>
                <span class="text-xs text-gray-400">unités</span>
              </template>
            </UInput>
          </UFormField>
        </div>

        <UFormField label="Code-barres"
          description="Référence scannée en boutique ou utilisée pour l’identification physique.">
          <UInput :model-value="productFormStore.formData.barcode"
            placeholder="Généré automatiquement ou scanné plus tard" class="w-full lg:w-1/2"
            @update:model-value="productFormStore.setFormData({ barcode: String($event || '') })" />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
