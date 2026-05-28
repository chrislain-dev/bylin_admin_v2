<script setup lang="ts">
import type { Category } from '~/types/category'
import type { Brand } from '~/types/brand'
import type { Collection } from '~/types/collection'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  brands: Brand[]
  categories: readonly Category[]
  collections: Collection[]
  mode?: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()

interface CategoryOption {
  label: string
  value: string
  level?: number
}

const selectedBrand = computed(() => {
  if (!productFormStore.formData.brand_id) {
    return null
  }

  return props.brands.find((brand) => brand.id === productFormStore.formData.brand_id) || null
})

const isBylinBrand = computed(() => selectedBrand.value?.slug === 'bylin')

const brandOptions = computed(() => {
  return props.brands.map((brand) => ({
    label: brand.name,
    value: brand.id,
    logo_url: brand.logo_url,
  }))
})

const collectionOptions = computed(() => {
  return props.collections
    .filter((collection) => collection.is_active)
    .map((collection) => ({
      label: collection.name,
      value: collection.id,
    }))
})

const categoryOptions = computed<CategoryOption[]>(() => {
  const flatten = (
    categories: readonly Category[],
    prefix = '',
    result: CategoryOption[] = [],
  ): CategoryOption[] => {
    categories.forEach((category) => {
      result.push({
        label: `${prefix}${category.name}`,
        value: category.id,
        level: category.level,
      })

      if (category.children?.length) {
        flatten(category.children, `${prefix}— `, result)
      }
    })

    return result
  }

  return flatten(props.categories)
})

const productNameLength = computed(() => productFormStore.formData.name?.length || 0)
const shortDescriptionLength = computed(() => productFormStore.formData.short_description?.length || 0)
const descriptionLength = computed(() => productFormStore.formData.description?.length || 0)

watch(isBylinBrand, (enabled) => {
  if (!enabled) {
    productFormStore.setFormData({
      collection_id: null,
      requires_authenticity: false,
      authenticity_codes_count: 0,
    })

    return
  }

  productFormStore.setFormData({
    requires_authenticity: true,
  })
})

function generateSlug(): void {
  const name = productFormStore.formData.name

  if (!name?.trim()) {
    return
  }

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  productFormStore.setFormData({ slug })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Bloc essentiel -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Informations principales
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ces informations permettent d’identifier le produit et de le placer correctement dans la boutique.
            </p>
          </div>

          <UBadge
            :color="productFormStore.formData.name && productFormStore.formData.brand_id && productFormStore.formData.categories.length ? 'success' : 'warning'"
            variant="subtle">
            {{ productFormStore.formData.name && productFormStore.formData.brand_id &&
              productFormStore.formData.categories.length ? 'Essentiel complété' : 'À compléter' }}
          </UBadge>
        </div>
      </template>

      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Nom du produit" description="Nom affiché sur la boutique et dans le catalogue." required>
          <UInput :model-value="productFormStore.formData.name" placeholder="Ex. Sac cabas Bylin noir" class="w-full"
            @update:model-value="productFormStore.setFormData({ name: String($event || '') })" @blur="generateSlug" />

          <template #hint>
            <span class="text-xs text-gray-500">
              {{ productNameLength }}/120 caractères recommandés
            </span>
          </template>
        </UFormField>

        <UFormField label="Marque" description="Marque à laquelle ce produit appartient." required>
          <USelectMenu :model-value="productFormStore.formData.brand_id" :items="brandOptions" value-key="value"
            label-key="label" placeholder="Choisir une marque" searchable class="w-full"
            @update:model-value="productFormStore.setFormData({ brand_id: $event as string })">
            <template v-if="selectedBrand" #leading>
              <img v-if="selectedBrand.logo_url" :src="selectedBrand.logo_url" :alt="selectedBrand.name"
                class="size-4 rounded object-contain">

              <UIcon v-else name="i-lucide-tag" class="size-4 text-gray-400" />
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Catégories" description="Classez le produit pour faciliter la navigation client." required>
          <USelectMenu :model-value="productFormStore.formData.categories" :items="categoryOptions" value-key="value"
            label-key="label" placeholder="Choisir une ou plusieurs catégories" multiple searchable class="w-full"
            @update:model-value="productFormStore.setFormData({ categories: $event as string[] })" />
        </UFormField>

        <UFormField v-if="isBylinBrand" label="Collection Bylin"
          description="Collection dans laquelle le produit sera présenté." required>
          <USelectMenu :model-value="productFormStore.formData.collection_id || undefined" :items="collectionOptions"
            value-key="value" label-key="label" placeholder="Choisir une collection" searchable class="w-full"
            @update:model-value="productFormStore.setFormData({ collection_id: $event as string })" />

          <template #hint>
            <span class="text-xs text-primary">
              Obligatoire pour les produits de la marque Bylin.
            </span>
          </template>
        </UFormField>
      </div>

      <UAlert v-if="isBylinBrand" class="mt-5" color="primary" variant="soft" icon="i-lucide-sparkles"
        title="Produit Bylin détecté"
        description="Ce produit sera automatiquement compatible avec l’authentification Bylin et devra être rattaché à une collection." />
    </UCard>

    <!-- Présentation -->
    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Présentation commerciale
          </h2>

          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Aidez le client à comprendre rapidement le produit, ses avantages et son usage.
          </p>
        </div>
      </template>

      <div class="space-y-5">
        <UFormField label="Résumé court"
          description="Phrase courte utilisée dans les listes, cartes produit ou aperçus.">
          <UTextarea :model-value="productFormStore.formData.short_description" :rows="3"
            placeholder="Ex. Sac élégant et pratique pour le quotidien." class="w-full"
            @update:model-value="productFormStore.setFormData({ short_description: String($event || '') })" />

          <template #hint>
            <span class="text-xs text-gray-500">
              {{ shortDescriptionLength }}/180 caractères recommandés
            </span>
          </template>
        </UFormField>

        <UFormField label="Description complète"
          description="Détaillez la matière, les dimensions, l’usage, les conseils d’entretien et les avantages.">
          <UTextarea :model-value="productFormStore.formData.description" :rows="8"
            placeholder="Décrivez le produit avec des informations utiles pour le client." class="w-full"
            @update:model-value="productFormStore.setFormData({ description: String($event || '') })" />

          <template #hint>
            <span class="text-xs text-gray-500">
              {{ descriptionLength }} caractères
            </span>
          </template>
        </UFormField>
      </div>
    </UCard>

    <!-- Références internes -->
    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Références internes
          </h2>

          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ces informations servent à identifier le produit dans le système.
          </p>
        </div>
      </template>

      <div class="grid gap-5 lg:grid-cols-2">
        <UFormField label="Adresse du produit" description="Lien généré automatiquement à partir du nom.">
          <UInput :model-value="productFormStore.formData.slug" placeholder="adresse-du-produit" readonly class="w-full"
            @update:model-value="productFormStore.setFormData({ slug: String($event || '') })" />
        </UFormField>

        <UFormField label="Référence SKU" description="Référence interne du produit.">
          <UInput :model-value="productFormStore.formData.sku" placeholder="Générée par le système"  readonly class="w-full"
            @update:model-value="productFormStore.setFormData({ sku: String($event || '') })" />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
