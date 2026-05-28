<script setup lang="ts">
import { useProducts } from '~/composables/useProducts'
import { buildProductPayload } from '~/utils/productPayload'

definePageMeta({
  layout: 'default',
  title: 'Créer un produit',
  description: 'Ajouter un nouveau produit au catalogue',
})

const router = useRouter()
const toast = useToast()

const productFormStore = useProductFormStore()
const { createProduct } = useProducts()
const { brands } = useBrands()

const isSaving = ref(false)

const selectedBrand = computed(() => {
  return brands.value.find((brand) => brand.id === productFormStore.formData.brand_id)
})

const isBylinBrand = computed(() => {
  return selectedBrand.value?.slug === 'bylin'
})

const missingFields = computed<string[]>(() => {
  const form = productFormStore.formData
  const fields: string[] = []

  if (!form.name?.trim()) fields.push('Nom du produit')
  if (!form.brand_id) fields.push('Marque')
  if (!form.categories.length) fields.push('Catégorie')
  if (isBylinBrand.value && !form.collection_id) fields.push('Collection Bylin')
  if (!form.price || form.price <= 0) fields.push('Prix de vente')

  if (form.is_variable) {
    if (form.variations.length === 0) fields.push('Au moins une variation')
    const invalidVariation = form.variations.some((variation) => {
      return !variation.variation_name?.trim()
        || Number(variation.price) <= 0
        || Number(variation.stock_quantity) < 0
    })
    if (invalidVariation) fields.push('Variations valides')
  }

  return fields
})

const isFormValid = computed(() => missingFields.value.length === 0)

function goBack(): void {
  router.push('/products')
}

function formatApiFieldName(field: string): string {
  const normalized: Record<string, string> = {
    name: 'Nom du produit',
    brand_id: 'Marque',
    categories: 'Catégories',
    collection_id: 'Collection',
    price: 'Prix de vente',
    compare_price: 'Prix barré',
    cost_price: 'Coût d\'achat',
    stock_quantity: 'Quantité en stock',
    low_stock_threshold: 'Seuil de stock faible',
    description: 'Description',
    short_description: 'Résumé court',
    sku: 'Référence SKU',
    barcode: 'Code-barres',
    status: 'Statut',
    images: 'Images',
  }

  if (field.includes('variations')) {
    const match = field.match(/variations\.(\d+)\.(.+)/)
    if (match) {
      const index = Number(match[1]) + 1
      const subField = match[2] ?? ''
      const variationFields: Record<string, string> = {
        variation_name: 'Nom',
        price: 'Prix',
        compare_price: 'Prix barré',
        cost_price: 'Coût d\'achat',
        stock_quantity: 'Stock',
        sku: 'SKU',
        barcode: 'Code-barres',
        attributes: 'Attributs',
      }
      return `Variation ${index} — ${variationFields[subField] ?? subField}`
    }
  }

  return normalized[field] ?? field
}

function showValidationError(): void {
  const fields = missingFields.value.slice(0, 5).join(', ')
  toast.add({
    title: 'Informations incomplètes',
    description: fields
      ? `Veuillez compléter : ${fields}${missingFields.value.length > 5 ? '…' : ''}`
      : 'Veuillez vérifier les informations du produit.',
    color: 'error',
    icon: 'i-lucide-alert-triangle',
  })
}

async function handleSave(): Promise<void> {
  if (!isFormValid.value) {
    showValidationError()
    return
  }

  isSaving.value = true

  try {
    const imageFiles = productFormStore.images
      .filter((image) => image.file)
      .map((image) => image.file as File)

    const payload = buildProductPayload(productFormStore.formData, {
      images: imageFiles,
      imagesToDelete: [],
    })

    const created = await createProduct(payload)

    if (!created) {
      toast.add({
        title: 'Création impossible',
        description: 'Le produit n\'a pas pu être créé. Veuillez réessayer.',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      })
      return
    }

    toast.add({
      title: 'Produit créé',
      description: 'Le produit a été ajouté au catalogue avec succès.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    await router.push(`/products/${created.id}`)
  } catch (error: any) {
    const validationErrors = error?.response?.data?.errors
      ?? error?.data?.errors
      ?? error?.response?._data?.errors

    if (validationErrors && typeof validationErrors === 'object') {
      Object.keys(validationErrors).forEach((field) => {
        const message = Array.isArray(validationErrors[field])
          ? validationErrors[field][0]
          : validationErrors[field]

        toast.add({
          title: formatApiFieldName(field),
          description: message || 'Ce champ contient une erreur.',
          color: 'error',
          icon: 'i-lucide-alert-circle',
          duration: 6000,
        })
      })
      return
    }

    const message = error?.response?.data?.message
      ?? error?.data?.message
      ?? error?.response?._data?.message
      ?? error?.message
      ?? 'Une erreur est survenue lors de la création du produit.'

    toast.add({
      title: 'Erreur de création',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  productFormStore.resetFormData()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" aria-label="Retour aux produits"
            @click="goBack" />
          <div class="ml-3">
            <p class="text-xs font-medium text-primary">Catalogue</p>
            <h1 class="text-lg font-semibold text-gray-950 dark:text-white leading-tight">
              Créer un produit
            </h1>
          </div>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton label="Annuler" color="neutral" variant="ghost" :disabled="isSaving" @click="goBack" />
            <UButton label="Créer le produit" icon="i-lucide-plus" color="primary" :loading="isSaving"
              :disabled="!isFormValid" @click="handleSave" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-5">
        <!-- Alerte produit Bylin -->
        <UAlert v-if="isBylinBrand" color="primary" variant="soft" icon="i-lucide-sparkles" title="Produit Bylin"
          description="Les produits Bylin doivent être associés à une collection afin d'être correctement organisés sur la boutique." />

        <!-- Résumé validation -->
        <UAlert v-if="missingFields.length > 0" color="warning" variant="soft" icon="i-lucide-list-checks"
          title="Informations à compléter">
          <template #description>
            <div class="mt-2 flex flex-wrap gap-2">
              <UBadge v-for="field in missingFields" :key="field" color="warning" variant="subtle">
                {{ field }}
              </UBadge>
            </div>
          </template>
        </UAlert>

        <!-- Formulaire produit -->
        <ProductForm :is-saving="isSaving" :is-form-valid="isFormValid" mode="create" @save="handleSave"
          @cancel="goBack" />
      </div>
    </template>
  </UDashboardPanel>
</template>
