<script setup lang="ts">
import { buildProductPayload } from '~/utils/productPayload'

definePageMeta({
  layout: 'default',
  title: 'Créer un produit',
  description: 'Ajouter un nouveau produit au catalogue'
})

const router = useRouter()
const toast = useToast()
const productFormStore = useProductFormStore()
const { createProduct } = useProduct()
const { brands } = useBrands()

const isBylinBrand = computed(() => {
  const selected = brands.value.find(brand => brand.id === productFormStore.formData.brand_id)
  return selected?.slug === 'bylin'
})

const isSaving = ref(false)

// Validation
const isFormValid = computed(() => {
  const form = productFormStore.formData

  // Validation de base
  const basicValidation = !!(
    form.name?.trim().length > 0 &&
    form.categories.length > 0 &&
    form.brand_id &&
    (!isBylinBrand.value || !!form.collection_id) &&
    form.price > 0
  )

  // Validation spécifique pour les produits variables
  if (form.is_variable) {

    if (form.variations.length === 0) {
      return false
    }

    const variationsValid = form.variations.every(v =>
      v.variation_name?.trim() &&
      v.price > 0 &&
      v.stock_quantity >= 0
    )

    return basicValidation && variationsValid
  }

  return basicValidation
})

async function handleSave() {
  if (!isFormValid.value) {
    toast.add({
      title: 'Erreur de validation',
      description: productFormStore.formData.is_variable
        ? 'Veuillez remplir tous les champs requis et ajouter au moins une variation valide'
        : isBylinBrand.value && !productFormStore.formData.collection_id
          ? 'Veuillez sélectionner une collection pour ce produit Bylin'
          : 'Veuillez remplir tous les champs requis',
      color: 'error'
    })
    return
  }

  isSaving.value = true

  try {
    const imageFiles = productFormStore.images
      .filter(img => img.file)
      .map(img => img.file as File)

    const dataToSend = buildProductPayload(productFormStore.formData, {
      images: imageFiles,
      imagesToDelete: [],
    })

    const created = await createProduct(dataToSend)

    if (created) {
      toast.add({
        title: 'Produit créé',
        description: 'Le produit a été créé avec succès',
        color: 'success'
      })

      router.push(`/products/${created.id}`)
    }
  } catch (error: any) {
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      Object.keys(errors).forEach(field => {
        let fieldName = field
        if (field.includes('variations')) {
          const match = field.match(/variations\.(\d+)\.(.+)/)
          if (match) {
            const index = parseInt(match[1] as string) + 1
            const subField = match[2]
            fieldName = `Variation ${index} - ${subField}`
          }
        }

        toast.add({
          title: `Erreur: ${fieldName}`,
          description: Array.isArray(errors[field]) ? errors[field][0] : errors[field],
          color: 'error',
          duration: 5000
        })
      })
    } else {
      toast.add({
        title: 'Erreur de création',
        description: error.message || 'Une erreur est survenue lors de la création du produit',
        color: 'error'
      })
    }
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  productFormStore.resetFormData()
})
</script>

<template>
  <ProductForm
:is-saving="isSaving"
:is-form-valid="isFormValid"
mode="create"
@save="handleSave"
    @cancel="router.push('/products')" />
</template>
