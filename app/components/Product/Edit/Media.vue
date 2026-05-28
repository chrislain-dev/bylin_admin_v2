<script setup lang="ts">
const productFormStore = useProductFormStore()
const toast = useToast()

function handleImageUpload(files: File[]) {
  const newImages = [...productFormStore.images]

  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        title: 'Image trop lourde',
        description: `${file.name} dépasse la limite de 5 Mo`,
        color: 'error',
      })
      return
    }

    const url = URL.createObjectURL(file)
    newImages.push({ url, file, isNew: true })
  })

  productFormStore.images = newImages
}

function removeImage(index: number) {
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

function reorderImages(oldIndex: number, newIndex: number) {
  const newImages = [...productFormStore.images]
  const item = newImages[oldIndex]
  if (!item) return

  newImages.splice(oldIndex, 1)
  newImages.splice(newIndex, 0, item)
  productFormStore.images = newImages
}
</script>

<template>
  <div class="space-y-6 p-6">
    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Images du produit
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ajoutez des visuels propres. La première image sera utilisée comme image principale sur la boutique.
          </p>
        </div>
      </template>

      <div class="space-y-5">
        <label class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-primary-300 hover:bg-primary-50/60 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-primary-800 dark:hover:bg-primary-950/20">
          <UIcon name="i-lucide-image-plus" class="size-9 text-gray-400" />
          <span class="mt-3 text-sm font-medium text-gray-950 dark:text-white">
            Ajouter une ou plusieurs images
          </span>
          <span class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG ou WEBP — 5 Mo maximum par image
          </span>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            class="sr-only"
            @change="(event) => {
              const files = (event.target as HTMLInputElement).files
              if (files) handleImageUpload(Array.from(files))
            }"
          >
        </label>

        <div v-if="productFormStore.images.length > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-950 dark:text-white">
              Galerie produit — {{ productFormStore.images.length }} image(s)
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Glissez l’image principale en première position avec les flèches.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
              v-for="(image, index) in productFormStore.images"
              :key="`${image.id || 'new'}-${index}`"
              class="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
            >
              <img :src="image.url" :alt="`Image produit ${index + 1}`" class="size-full object-cover">

              <div class="absolute left-2 top-2 flex gap-2">
                <UBadge v-if="index === 0" color="primary" variant="solid" size="xs">
                  Image principale
                </UBadge>
                <UBadge v-if="image.isNew" color="success" variant="solid" size="xs">
                  Nouvelle
                </UBadge>
              </div>

              <div class="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-black/60 p-3 transition group-hover:translate-y-0">
                <UButton
                  v-if="index > 0"
                  icon="i-lucide-arrow-left"
                  color="neutral"
                  variant="solid"
                  size="xs"
                  @click="reorderImages(index, index - 1)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="solid"
                  size="xs"
                  @click="removeImage(index)"
                />
                <UButton
                  v-if="index < productFormStore.images.length - 1"
                  icon="i-lucide-arrow-right"
                  color="neutral"
                  variant="solid"
                  size="xs"
                  @click="reorderImages(index, index + 1)"
                />
              </div>
            </div>
          </div>
        </div>

        <AdminEmptyState
          v-else
          icon="i-lucide-images"
          title="Aucune image pour ce produit"
          description="Ajoutez au moins une image propre avant de publier le produit."
        />
      </div>
    </UCard>
  </div>
</template>
