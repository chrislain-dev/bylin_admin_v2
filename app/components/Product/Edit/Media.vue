<script setup lang="ts">
const productFormStore = useProductFormStore()
const toast = useToast()

function handleImageUpload(files: File[]): void {
  const newImages = [...productFormStore.images]

  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        title: 'Image trop lourde',
        description: `${file.name} dépasse la limite de 5 Mo.`,
        color: 'error',
        icon: 'i-lucide-alert-circle',
      })

      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.add({
        title: 'Format non accepté',
        description: `${file.name} doit être au format PNG, JPG ou WEBP.`,
        color: 'error',
        icon: 'i-lucide-alert-circle',
      })

      return
    }

    const url = URL.createObjectURL(file)

    newImages.push({
      url,
      file,
      isNew: true,
    })
  })

  productFormStore.images = newImages
}

function removeImage(index: number): void {
  const image = productFormStore.images[index]
  const newImages = [...productFormStore.images]
  const newImagesToDelete = [...productFormStore.imagesToDelete]

  if (image && !image.isNew && image.id) {
    newImagesToDelete.push(image.id)
    productFormStore.imagesToDelete = newImagesToDelete
  }

  newImages.splice(index, 1)
  productFormStore.images = newImages
}

function reorderImages(oldIndex: number, newIndex: number): void {
  const newImages = [...productFormStore.images]
  const item = newImages[oldIndex]

  if (!item) {
    return
  }

  newImages.splice(oldIndex, 1)
  newImages.splice(newIndex, 0, item)

  productFormStore.images = newImages
}

function setAsMainImage(index: number): void {
  reorderImages(index, 0)
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (files) {
    handleImageUpload(Array.from(files))
  }

  input.value = ''
}
</script>

<template>
  <div class="space-y-6 p-6">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Images du produit
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajoutez des visuels propres. La première image sera utilisée comme image principale sur la boutique.
            </p>
          </div>

          <UBadge :color="productFormStore.images.length > 0 ? 'success' : 'warning'" variant="subtle">
            {{ productFormStore.images.length > 0 ? `${productFormStore.images.length} image(s)` : 'Aucune image' }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Upload -->
        <label
          class="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-primary-300 hover:bg-primary-50/60 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
          <div
            class="flex size-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition group-hover:scale-105 dark:bg-gray-950 dark:ring-gray-800">
            <UIcon name="i-lucide-image-plus" class="size-7 text-primary" />
          </div>

          <span class="mt-4 text-sm font-medium text-gray-950 dark:text-white">
            Ajouter des images
          </span>

          <span class="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
            Sélectionnez une ou plusieurs images au format PNG, JPG ou WEBP. Taille maximale : 5 Mo par image.
          </span>

          <input type="file" multiple accept="image/png,image/jpeg,image/webp" class="sr-only" @change="onFileChange">
        </label>

        <!-- Galerie -->
        <div v-if="productFormStore.images.length > 0" class="space-y-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-950 dark:text-white">
                Galerie produit
              </h3>

              <p class="text-sm text-gray-500 dark:text-gray-400">
                Réorganisez les images. La première image sera affichée en priorité.
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div v-for="(image, index) in productFormStore.images" :key="`${image.id || 'new'}-${index}`"
              class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
              <div class="aspect-square">
                <img :src="image.url" :alt="`Image produit ${index + 1}`" class="size-full object-cover">
              </div>

              <div class="absolute left-2 top-2 flex flex-wrap gap-2">
                <UBadge v-if="index === 0" color="primary" variant="solid" size="xs">
                  Image principale
                </UBadge>

                <UBadge v-if="image.isNew" color="success" variant="solid" size="xs">
                  Nouvelle
                </UBadge>
              </div>

              <div
                class="absolute inset-x-0 bottom-0 translate-y-full bg-black/65 p-3 transition group-hover:translate-y-0">
                <div class="flex items-center justify-center gap-2">
                  <UButton v-if="index !== 0" label="Principale" size="xs" color="primary" variant="solid"
                    @click="setAsMainImage(index)" />

                  <UButton v-if="index > 0" icon="i-lucide-arrow-left" color="neutral" variant="solid" size="xs"
                    aria-label="Déplacer vers la gauche" @click="reorderImages(index, index - 1)" />

                  <UButton v-if="index < productFormStore.images.length - 1" icon="i-lucide-arrow-right" color="neutral"
                    variant="solid" size="xs" aria-label="Déplacer vers la droite"
                    @click="reorderImages(index, index + 1)" />

                  <UButton icon="i-lucide-trash-2" color="error" variant="solid" size="xs"
                    aria-label="Supprimer l’image" @click="removeImage(index)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <AdminEmptyState v-else icon="i-lucide-images" title="Aucune image ajoutée"
          description="Ajoutez au moins une image propre pour rendre le produit plus attractif sur la boutique." />
      </div>
    </UCard>

    <UAlert color="primary" variant="soft" icon="i-lucide-lightbulb" title="Conseil image"
      description="Utilisez des images nettes, bien cadrées et cohérentes. Pour un meilleur rendu, gardez un format carré ou proche du carré." />
  </div>
</template>
