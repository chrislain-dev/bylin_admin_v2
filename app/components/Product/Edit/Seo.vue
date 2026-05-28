<script setup lang="ts">
import { useProductFormStore } from '~/stores/productForm'

const productFormStore = useProductFormStore()
const config = useRuntimeConfig()

const storefrontUrl = computed(() => {
  return String(config.public.storefrontUrl || 'http://localhost:3001').replace(/\/$/, '')
})

const seoTitle = computed(() => {
  return productFormStore.formData.meta_title
    || productFormStore.formData.name
    || 'Nom du produit'
})

const seoDescription = computed(() => {
  return productFormStore.formData.meta_description
    || productFormStore.formData.short_description
    || 'Ajoutez une description courte pour améliorer la présentation du produit sur les moteurs de recherche.'
})

const productUrl = computed(() => {
  const slug = productFormStore.formData.slug || 'nouveau-produit'
  return `${storefrontUrl.value}/products/${slug}`
})

const titleLength = computed(() => productFormStore.formData.meta_title?.length || 0)
const descriptionLength = computed(() => productFormStore.formData.meta_description?.length || 0)

const titleStatus = computed(() => {
  if (titleLength.value === 0) {
    return {
      color: 'neutral' as const,
      label: 'Non renseigné',
    }
  }

  if (titleLength.value > 60) {
    return {
      color: 'warning' as const,
      label: 'Trop long',
    }
  }

  return {
    color: 'success' as const,
    label: 'Correct',
  }
})

const descriptionStatus = computed(() => {
  if (descriptionLength.value === 0) {
    return {
      color: 'neutral' as const,
      label: 'Non renseignée',
    }
  }

  if (descriptionLength.value > 160) {
    return {
      color: 'warning' as const,
      label: 'Trop longue',
    }
  }

  return {
    color: 'success' as const,
    label: 'Correcte',
  }
})

function generateSeoFromProduct(): void {
  const name = productFormStore.formData.name || ''
  const shortDescription = productFormStore.formData.short_description || ''

  productFormStore.setFormData({
    meta_title: name.slice(0, 60),
    meta_description: shortDescription.slice(0, 160),
  })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Référencement naturel
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Personnalisez l’affichage du produit dans les résultats de recherche et lors du partage.
            </p>
          </div>

          <UButton label="Générer depuis le produit" icon="i-lucide-wand-sparkles" color="neutral" variant="soft"
            size="sm" @click="generateSeoFromProduct" />
        </div>
      </template>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-5">
          <UFormField label="Titre SEO" description="Titre affiché sur Google. Idéalement entre 45 et 60 caractères.">
            <UInput :model-value="productFormStore.formData.meta_title"
              placeholder="Ex. Sac cabas Bylin noir — Élégant et pratique" class="w-full"
              @update:model-value="productFormStore.setFormData({ meta_title: String($event || '') })" />

            <template #hint>
              <div class="mt-1 flex items-center justify-between gap-3">
                <span class="text-xs text-gray-500">
                  {{ titleLength }}/60 caractères recommandés
                </span>

                <UBadge :color="titleStatus.color" variant="subtle" size="xs">
                  {{ titleStatus.label }}
                </UBadge>
              </div>
            </template>
          </UFormField>

          <UFormField label="Description SEO" description="Résumé affiché sous le titre dans les moteurs de recherche.">
            <UTextarea :model-value="productFormStore.formData.meta_description" :rows="6"
              placeholder="Décrivez brièvement le produit, son style, son usage et sa valeur pour le client."
              class="w-full"
              @update:model-value="productFormStore.setFormData({ meta_description: String($event || '') })" />

            <template #hint>
              <div class="mt-1 flex items-center justify-between gap-3">
                <span class="text-xs text-gray-500">
                  {{ descriptionLength }}/160 caractères recommandés
                </span>

                <UBadge :color="descriptionStatus.color" variant="subtle" size="xs">
                  {{ descriptionStatus.label }}
                </UBadge>
              </div>
            </template>
          </UFormField>
        </div>

        <div class="space-y-4">
          <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div class="mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-search" class="size-4 text-primary" />

              <p class="text-sm font-medium text-gray-950 dark:text-white">
                Aperçu recherche
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-gray-500 truncate">
                {{ productUrl }}
              </p>

              <h3 class="line-clamp-2 text-lg font-medium text-blue-700 dark:text-blue-400">
                {{ seoTitle }}
              </h3>

              <p class="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                {{ seoDescription }}
              </p>
            </div>
          </div>

          <UAlert color="primary" variant="soft" icon="i-lucide-lightbulb" title="Conseil"
            description="Un bon titre SEO doit être clair, contenir le nom du produit et rester court. La description doit donner envie de cliquer sans être trop longue." />
        </div>
      </div>
    </UCard>
  </div>
</template>
