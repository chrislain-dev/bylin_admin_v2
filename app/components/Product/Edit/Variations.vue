<script setup lang="ts">
import type { VariationFormData } from '~/types/product'
import type { Category } from '~/types/category'
import type { Attribute } from '~/types/attribute'
import type { SelectMenuItem } from '@nuxt/ui'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  attributes: Attribute[]
  categories: readonly Category[]
  mode: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()

const DETECTION_RULES = [
  {
    keywords: /chaussure|sandale|basket|botte|sneaker|escarpin/i,
    requiredAttributes: ['pointure', 'color'],
    excludedAttributes: ['taille'],
  },
  {
    keywords: /vetement|veste|jean|t-shirt|chemise|pantalon|robe|jupe|pull/i,
    requiredAttributes: ['taille', 'color'],
    excludedAttributes: ['pointure'],
  },
]

const form = computed(() => productFormStore.formData)

const activeAttributeIds = computed({
  get: () => productFormStore.activeAttributeIds,
  set: (value: string[]) => productFormStore.setActiveAttributeIds(value),
})

const attributeItems = computed<SelectMenuItem[]>(() => {
  return props.attributes.map((attribute) => ({
    label: attribute.name,
    value: attribute.id,
    type: 'item' as const,
    icon: attribute.type === 'color' ? 'i-lucide-palette' : 'i-lucide-tag',
    disabled: false,
  }))
})

const filteredAttributes = computed(() => {
  return props.attributes.filter((attribute) => activeAttributeIds.value.includes(attribute.id))
})

const attributeNameToId = computed(() => {
  const map: Record<string, string> = {}

  props.attributes.forEach((attribute) => {
    map[attribute.name.toLowerCase()] = attribute.id
  })

  return map
})

const totalStock = computed(() => {
  return form.value.variations.reduce((sum, variation) => {
    return sum + Number(variation.stock_quantity || 0)
  }, 0)
})

const activeVariationsCount = computed(() => {
  return form.value.variations.filter((variation) => variation.is_active).length
})

const invalidVariationsCount = computed(() => {
  return form.value.variations.filter((variation) => {
    return !variation.variation_name?.trim()
      || Number(variation.price || 0) <= 0
      || Number(variation.stock_quantity || 0) < 0
  }).length
})

const variationSummaryColor = computed(() => {
  if (form.value.variations.length === 0) {
    return 'warning' as const
  }

  if (invalidVariationsCount.value > 0) {
    return 'error' as const
  }

  return 'success' as const
})

function normalizeVariationAttributes(attributes: Record<string, string | null>): Record<string, string> {
  if (!attributes) {
    return {}
  }

  const normalized: Record<string, string> = {}

  Object.entries(attributes).forEach(([key, value]) => {
    const normalizedValue = value || ''

    if (props.attributes.some((attribute) => attribute.id === key)) {
      normalized[key] = normalizedValue
      return
    }

    const attributeId = attributeNameToId.value[key.toLowerCase()]

    if (attributeId) {
      normalized[attributeId] = normalizedValue
    }
  })

  return normalized
}

function getCategoryNames(categories: readonly Category[], selectedIds: string[]): string[] {
  let names: string[] = []

  categories.forEach((category) => {
    if (selectedIds.includes(category.id)) {
      names.push(category.name)
    }

    if (category.children?.length) {
      names = [...names, ...getCategoryNames(category.children, selectedIds)]
    }
  })

  return names
}

watch(
  () => form.value.categories,
  (newCategoryIds) => {
    if (productFormStore.isVariationsInitialized) {
      return
    }

    if (props.mode === 'edit' && form.value.variations.length > 0) {
      const usedIds = new Set<string>()

      const normalizedVariations = form.value.variations.map((variation) => {
        const normalizedAttributes = normalizeVariationAttributes(variation.attributes || {})

        Object.keys(normalizedAttributes).forEach((attributeId) => usedIds.add(attributeId))

        return {
          ...variation,
          attributes: normalizedAttributes,
        }
      })

      if (usedIds.size > 0) {
        productFormStore.setFormData({ variations: normalizedVariations })
        activeAttributeIds.value = Array.from(usedIds)
        return
      }
    }

    const categoryNames = getCategoryNames(props.categories, newCategoryIds || [])
    const suggestedIds = new Set<string>()

    props.attributes.forEach((attribute) => suggestedIds.add(attribute.id))

    let ruleApplied = false

    DETECTION_RULES.forEach((rule) => {
      const match = categoryNames.some((name) => rule.keywords.test(name))

      if (!match) {
        return
      }

      ruleApplied = true

      const idsToExclude = props.attributes
        .filter((attribute) => rule.excludedAttributes.includes(attribute.name.toLowerCase()))
        .map((attribute) => attribute.id)

      idsToExclude.forEach((id) => suggestedIds.delete(id))
    })

    if (ruleApplied || activeAttributeIds.value.length === 0) {
      activeAttributeIds.value = Array.from(suggestedIds)
    }
  },
  { immediate: true },
)

function createInitialAttributes(): Record<string, string> {
  return activeAttributeIds.value.reduce((acc, id) => {
    acc[id] = ''
    return acc
  }, {} as Record<string, string>)
}

function addVariation(): void {
  const newVariation: VariationFormData = {
    variation_name: '',
    price: productFormStore.formData.price || 0,
    compare_price: productFormStore.formData.compare_price,
    cost_price: productFormStore.formData.cost_price,
    stock_quantity: 0,
    stock_status: 'out_of_stock',
    is_active: true,
    attributes: createInitialAttributes(),
    sku: '',
    barcode: '',
  }

  productFormStore.setFormData({
    variations: [...productFormStore.formData.variations, newVariation],
  })
}

function removeVariation(index: number): void {
  const variation = productFormStore.formData.variations[index]

  if (variation?.id && !confirm('Supprimer cette variation ?')) {
    return
  }

  const newVariations = [...productFormStore.formData.variations]
  newVariations.splice(index, 1)

  productFormStore.setFormData({ variations: newVariations })
}

function duplicateVariation(index: number): void {
  const original = productFormStore.formData.variations[index]

  if (!original) {
    return
  }

  const duplicated: VariationFormData = {
    ...original,
    id: undefined,
    variation_name: `${original.variation_name || 'Variation'} (copie)`,
    sku: '',
    attributes: { ...original.attributes },
  }

  productFormStore.setFormData({
    variations: [...productFormStore.formData.variations, duplicated],
  })
}

function updateVariation(index: number, updates: Partial<VariationFormData>): void {
  const newVariations = [...productFormStore.formData.variations]
  const current = newVariations[index]

  if (!current) {
    return
  }

  newVariations[index] = {
    ...current,
    ...updates,
  }

  if (updates.stock_quantity !== undefined) {
    newVariations[index].stock_status = updates.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'
  }

  productFormStore.setFormData({ variations: newVariations })
}

function getAttributeValues(attributeId: string) {
  const attribute = props.attributes.find((item) => item.id === attributeId)

  return attribute?.values?.map((value) => ({
    label: value.label,
    value: value.id,
    color: value.color_code,
  })) || []
}

function generateVariationName(index: number): void {
  const variation = form.value.variations[index]

  if (!variation) {
    return
  }

  const nameParts = activeAttributeIds.value
    .map((attributeId) => {
      const valueId = variation.attributes[attributeId]

      if (!valueId) {
        return null
      }

      const attribute = props.attributes.find((item) => item.id === attributeId)
      const value = attribute?.values?.find((item) => item.id === valueId)

      return value?.label || null
    })
    .filter(Boolean)

  updateVariation(index, {
    variation_name: nameParts.join(' / ') || 'Nouvelle variation',
  })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <UAlert v-if="!form.is_variable" icon="i-lucide-info" color="neutral" variant="soft" title="Produit simple"
      description="Ce produit n’utilise pas encore de variations. Activez l’option dans l’onglet Publication si vous souhaitez gérer des tailles, couleurs ou modèles." />

    <template v-else>
      <!-- Résumé -->
      <div class="grid gap-4 md:grid-cols-4">
        <UCard>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Variations
          </p>

          <p class="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
            {{ form.variations.length }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Actives
          </p>

          <p class="mt-1 text-2xl font-semibold text-success">
            {{ activeVariationsCount }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Stock total
          </p>

          <p class="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
            {{ totalStock }}
          </p>
        </UCard>

        <UCard>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            À corriger
          </p>

          <p class="mt-1 text-2xl font-semibold" :class="invalidVariationsCount > 0 ? 'text-error' : 'text-success'">
            {{ invalidVariationsCount }}
          </p>
        </UCard>
      </div>

      <!-- Configuration -->
      <UCard>
        <template #header>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-base font-semibold text-gray-950 dark:text-white">
                Attributs des variations
              </h2>

              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choisissez les attributs utilisés pour composer les variations, par exemple taille, couleur ou pointure.
              </p>
            </div>

            <UBadge :color="variationSummaryColor" variant="subtle">
              {{ invalidVariationsCount > 0 ? 'À vérifier' : form.variations.length > 0 ? 'Correct' : 'À compléter' }}
            </UBadge>
          </div>
        </template>

        <USelectMenu v-model="activeAttributeIds" :items="attributeItems" value-key="value" label-key="label" multiple
          searchable placeholder="Choisir les attributs utilisés" class="w-full" />

        <UAlert class="mt-4" color="primary" variant="soft" icon="i-lucide-lightbulb" title="Conseil"
          description="Sélectionnez uniquement les attributs utiles. Trop de combinaisons peuvent rendre la gestion du stock plus complexe." />
      </UCard>

      <!-- Actions -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-950 dark:text-white">
            Liste des variations
          </h2>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Gérez le prix, le stock et les options de chaque déclinaison.
          </p>
        </div>

        <UButton icon="i-lucide-plus" label="Ajouter une variation" color="primary" @click="addVariation" />
      </div>

      <!-- Liste -->
      <div v-if="form.variations.length > 0" class="space-y-4">
        <UCard v-for="(variation, index) in form.variations" :key="variation.id || index" class="overflow-visible">
          <div class="space-y-5">
            <!-- Header -->
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <UBadge color="primary" variant="soft">
                    Variation {{ index + 1 }}
                  </UBadge>

                  <UBadge :color="variation.is_active ? 'success' : 'neutral'" variant="subtle">
                    {{ variation.is_active ? 'Active' : 'Masquée' }}
                  </UBadge>

                  <UBadge :color="Number(variation.stock_quantity || 0) > 0 ? 'success' : 'error'" variant="subtle">
                    {{ Number(variation.stock_quantity || 0) > 0 ? 'En stock' : 'Rupture' }}
                  </UBadge>
                </div>

                <h3 class="truncate text-base font-semibold text-gray-950 dark:text-white">
                  {{ variation.variation_name || 'Variation sans nom' }}
                </h3>

                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configurez les options, le prix et le stock de cette variation.
                </p>
              </div>

              <div class="flex gap-1">
                <UButton icon="i-lucide-copy" color="neutral" variant="ghost" size="sm"
                  aria-label="Dupliquer la variation" @click="duplicateVariation(index)" />

                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                  aria-label="Supprimer la variation" @click="removeVariation(index)" />
              </div>
            </div>

            <!-- Attributs -->
            <div v-if="filteredAttributes.length > 0"
              class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <div class="mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-sliders-horizontal" class="size-4 text-gray-500" />

                <p class="text-sm font-medium text-gray-950 dark:text-white">
                  Options de la variation
                </p>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <UFormField v-for="attribute in filteredAttributes" :key="attribute.id" :label="attribute.name">
                  <USelectMenu :model-value="variation.attributes[attribute.id]"
                    :items="getAttributeValues(attribute.id)" value-key="value" label-key="label"
                    placeholder="Choisir une option" class="w-full" @update:model-value="(value) => {
                      const newAttributes = {
                        ...variation.attributes,
                        [attribute.id]: String(value || ''),
                      }

                      updateVariation(index, { attributes: newAttributes })
                      generateVariationName(index)
                    }">
                    <template v-if="attribute.type === 'color' && variation.attributes[attribute.id]" #leading>
                      <div class="size-4 rounded-full border border-gray-200 shadow-sm"
                        :style="{ backgroundColor: getAttributeValues(attribute.id).find((item) => item.value === variation.attributes[attribute.id])?.color || '#ccc' }" />
                    </template>

                    <template v-if="attribute.type === 'color'" #item-leading="{ item }">
                      <div class="size-4 rounded-full border border-gray-200"
                        :style="{ backgroundColor: item.color || '#ccc' }" />
                    </template>
                  </USelectMenu>
                </UFormField>
              </div>
            </div>

            <UAlert v-else color="warning" variant="soft" icon="i-lucide-alert-triangle"
              title="Aucun attribut sélectionné"
              description="Choisissez au moins un attribut pour définir correctement cette variation." />

            <!-- Données commerciales -->
            <div class="grid gap-4 md:grid-cols-3">
              <UFormField label="Prix de vente" description="Prix payé par le client pour cette variation.">
                <UInput :model-value="variation.price" type="number" step="500" min="0" class="w-full"
                  @update:model-value="updateVariation(index, { price: Number($event) })">
                  <template #trailing>
                    <span class="text-xs text-gray-400">F CFA</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField label="Prix barré" description="Optionnel, pour afficher une réduction.">
                <UInput :model-value="variation.compare_price" type="number" step="500" min="0" class="w-full"
                  @update:model-value="updateVariation(index, { compare_price: $event ? Number($event) : undefined })">
                  <template #trailing>
                    <span class="text-xs text-gray-400">F CFA</span>
                  </template>
                </UInput>
              </UFormField>

              <UFormField label="Stock disponible" description="Quantité disponible pour cette variation.">
                <UInput :model-value="variation.stock_quantity" type="number" min="0" class="w-full"
                  @update:model-value="updateVariation(index, { stock_quantity: Math.max(0, Number($event)) })">
                  <template #trailing>
                    <span class="text-xs text-gray-400">unités</span>
                  </template>
                </UInput>
              </UFormField>
            </div>

            <!-- Références -->
            <div class="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <UFormField label="Référence SKU" description="Référence interne de la variation.">
                <UInput :model-value="variation.sku" placeholder="Générée automatiquement" class="w-full"
                  @update:model-value="updateVariation(index, { sku: String($event || '') })" />
              </UFormField>

              <UFormField label="Code-barres" description="Référence scannée en boutique ou en stock.">
                <UInput :model-value="variation.barcode" placeholder="Optionnel" class="w-full"
                  @update:model-value="updateVariation(index, { barcode: String($event || '') })" />
              </UFormField>

              <div
                class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
                <div>
                  <p class="text-sm font-medium text-gray-950 dark:text-white">
                    Visible
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Afficher cette variation
                  </p>
                </div>

                <USwitch :model-value="variation.is_active"
                  @update:model-value="updateVariation(index, { is_active: $event as boolean })" />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty state -->
      <AdminEmptyState v-else icon="i-lucide-layers" title="Aucune variation créée"
        description="Ajoutez une première variation pour gérer les tailles, couleurs, prix ou stocks séparément.">
        <template #actions>
          <UButton label="Ajouter une variation" icon="i-lucide-plus" color="primary" @click="addVariation" />
        </template>
      </AdminEmptyState>
    </template>
  </div>
</template>
