<script setup lang="ts">
import type { Product } from '~/types/product'

const props = defineProps<{
  product?: Product
  isSaving: boolean
  hasUnsavedChanges?: boolean
  isFormValid?: boolean
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  save: []
  duplicate: []
  delete: []
  cancel: []
}>()

const productFormStore = useProductFormStore()

const config = useRuntimeConfig()

const storefrontUrl = computed(() => {
  return String(config.public.storefrontUrl || 'http://localhost:3001').replace(/\/$/, '')
})

const { brands, fetchBrands } = useBrands()
const { categoryTree, fetchCategoryTree } = useCategories()
const { attributes, fetchAttributes } = useAttributes()
const { collections, fetchCollections } = useCollections()

const activeTab = ref('general')

const tabs = computed(() => [
  {
    label: 'Essentiel',
    value: 'general',
    icon: 'i-lucide-info',
    slot: 'general' as const,
  },
  {
    label: 'Prix et stock',
    value: 'pricing',
    icon: 'i-lucide-banknote',
    slot: 'pricing' as const,
  },
  {
    label: 'Images',
    value: 'media',
    icon: 'i-lucide-images',
    badge: productFormStore.images.length || undefined,
    slot: 'media' as const,
  },
  {
    label: 'Variations',
    value: 'variations',
    icon: 'i-lucide-layers',
    badge: productFormStore.formData.variations.length || undefined,
    disabled: !productFormStore.formData.is_variable,
    slot: 'variations' as const,
  },
  {
    label: 'Référencement',
    value: 'seo',
    icon: 'i-lucide-search',
    slot: 'seo' as const,
  },
  {
    label: 'Publication',
    value: 'advanced',
    icon: 'i-lucide-settings-2',
    slot: 'advanced' as const,
  },
])

onMounted(async () => {
  await Promise.all([
    fetchBrands(),
    fetchCategoryTree(),
    fetchAttributes(),
    fetchCollections(),
  ])
})
</script>

<template>
  <div class="flex flex-col gap-6 xl:flex-row xl:items-start">
    <!-- Formulaire principal -->
    <div class="min-w-0 flex-1">
      <UCard :ui="{ body: 'p-0' }">
        <UTabs v-model="activeTab" :items="tabs" class="w-full" :ui="{
          list: 'mx-4 mt-4',
          content: 'mt-0',
        }">
          <template #general>
            <ProductEditGeneral :brands="brands" :categories="categoryTree" :collections="collections" :mode="mode" />
          </template>

          <template #pricing>
            <ProductEditPricing :mode="mode" />
          </template>

          <template #media>
            <ProductEditMedia :mode="mode" />
          </template>

          <template #variations>
            <ProductEditVariations :attributes="attributes" :categories="categoryTree" :mode="mode" />
          </template>

          <template #seo>
            <ProductEditSeo :mode="mode" />
          </template>

          <template #advanced>
            <ProductEditAdvanced :product-id="product?.id" :mode="mode" />
          </template>
        </UTabs>
      </UCard>
    </div>

    <!-- Aperçu / actions rapides -->
    <div class="w-full xl:w-[340px] shrink-0 product-sidebar-sticky">
      <ProductEditSidebar :product="product" :mode="mode" />
    </div>
  </div>
</template>
