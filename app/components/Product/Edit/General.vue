<script setup lang="ts">
import type { Category } from '~/types/category'
import type { Brand } from '~/types/brand'
import type { Collection } from '~/types/collection'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  brands: Brand[]
  categories: readonly Category[]
  collections: Collection[]
}>()

const productFormStore = useProductFormStore()

interface CategoryOption {
  label: string
  value: number | string
  level?: number
}

const selectedBrand = computed(() => {
  if (!productFormStore.formData.brand_id) return null
  return props.brands.find((brand) => brand.id === productFormStore.formData.brand_id) || null
})

const isBylinBrand = computed(() => selectedBrand.value?.slug === 'bylin')

const brandOptions = computed(() => props.brands.map((brand) => ({
  label: brand.name,
  value: brand.id,
  logo_url: brand.logo_url,
})))

const collectionOptions = computed(() => props.collections
  .filter((collection) => collection.is_active)
  .map((collection) => ({
    label: collection.name,
    value: collection.id,
  })))

const categoryOptions = computed(() => {
  const flatten = (categories: readonly Category[], prefix = '', result: CategoryOption[] = []): CategoryOption[] => {
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

watch(isBylinBrand, (enabled) => {
  if (!enabled) {
    productFormStore.setFormData({
      collection_id: null,
      requires_authenticity: false,
      authenticity_codes_count: 0,
    })
    return
  }

  productFormStore.setFormData({ requires_authenticity: true })
})

function generateSlug(): void {
  if (!productFormStore.formData.name) return

  const slug = productFormStore.formData.name
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
    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Informations essentielles
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ces informations permettent d’identifier et de classer le produit dans la boutique.
          </p>
        </div>
      </template>

      <div class="grid gap-4 lg:grid-cols-2">
        <UFormField label="Nom du produit" required>
          <UInput
            :model-value="productFormStore.formData.name"
            placeholder="Ex. Sac cabas Bylin noir"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ name: String($event) })"
            @blur="generateSlug"
          />
        </UFormField>

        <UFormField label="Marque" required>
          <USelectMenu
            :model-value="productFormStore.formData.brand_id"
            :items="brandOptions"
            value-key="value"
            label-key="label"
            placeholder="Choisir une marque"
            searchable
            class="w-full"
            @update:model-value="productFormStore.setFormData({ brand_id: $event as string })"
          >
            <template v-if="selectedBrand" #leading>
              <img v-if="selectedBrand.logo_url" :src="selectedBrand.logo_url" class="size-4 rounded object-contain">
              <UIcon v-else name="i-lucide-tag" class="size-4 text-gray-400" />
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Catégories" required>
          <USelectMenu
            :model-value="productFormStore.formData.categories"
            :items="categoryOptions"
            value-key="value"
            label-key="label"
            placeholder="Choisir une ou plusieurs catégories"
            multiple
            searchable
            class="w-full"
            @update:model-value="productFormStore.setFormData({ categories: $event as string[] })"
          />
        </UFormField>

        <UFormField v-if="isBylinBrand" label="Collection Bylin" required>
          <USelectMenu
            :model-value="productFormStore.formData.collection_id || undefined"
            :items="collectionOptions"
            value-key="value"
            label-key="label"
            placeholder="Choisir la collection"
            searchable
            class="w-full"
            @update:model-value="productFormStore.setFormData({ collection_id: $event as string })"
          />
          <template #hint>
            Obligatoire pour les produits de la marque Bylin.
          </template>
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Présentation commerciale
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Utilisez un langage clair pour aider le client à comprendre le produit.
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Résumé court">
          <UTextarea
            :model-value="productFormStore.formData.short_description"
            :rows="3"
            placeholder="Phrase courte affichée dans les listes ou cartes produit."
            class="w-full"
            @update:model-value="productFormStore.setFormData({ short_description: String($event) })"
          />
        </UFormField>

        <UFormField label="Description complète">
          <UTextarea
            :model-value="productFormStore.formData.description"
            :rows="8"
            placeholder="Décrivez les matières, l’usage, les dimensions, les conseils d’entretien, etc."
            class="w-full"
            @update:model-value="productFormStore.setFormData({ description: String($event) })"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-gray-950 dark:text-white">
          Référencement interne
        </h2>
      </template>

      <div class="grid gap-4 lg:grid-cols-2">
        <UFormField label="Adresse du produit">
          <UInput :model-value="productFormStore.formData.slug" disabled class="w-full" />
          <template #hint>
            Générée automatiquement à partir du nom.
          </template>
        </UFormField>

        <UFormField label="Référence SKU">
          <UInput :model-value="productFormStore.formData.sku" disabled class="w-full" />
          <template #hint>
            Générée par le système.
          </template>
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
