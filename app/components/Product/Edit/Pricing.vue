<script setup lang="ts">
import { useProductFormStore } from '~/stores/productForm'

const productFormStore = useProductFormStore()
</script>

<template>
  <div class="space-y-6 p-6">
    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Prix
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Définissez le prix affiché au client et le prix de référence si le produit est en promotion.
          </p>
        </div>
      </template>

      <div class="grid gap-4 lg:grid-cols-3">
        <UFormField label="Prix de vente" required>
          <UInput
            :model-value="productFormStore.formData.price"
            type="number"
            step="500"
            min="0"
            placeholder="0"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ price: Number($event) })"
          >
            <template #trailing>
              <span class="text-xs text-gray-400">F CFA</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Prix barré">
          <UInput
            :model-value="productFormStore.formData.compare_price"
            type="number"
            step="500"
            min="0"
            placeholder="Optionnel"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ compare_price: $event ? Number($event) : undefined })"
          >
            <template #trailing>
              <span class="text-xs text-gray-400">F CFA</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Coût d’achat">
          <UInput
            :model-value="productFormStore.formData.cost_price"
            type="number"
            step="500"
            min="0"
            placeholder="Interne"
            class="w-full"
            @update:model-value="productFormStore.setFormData({ cost_price: $event ? Number($event) : undefined })"
          >
            <template #trailing>
              <span class="text-xs text-gray-400">F CFA</span>
            </template>
          </UInput>
          <template #hint>
            Non visible par les clients.
          </template>
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div>
          <h2 class="text-base font-semibold text-gray-950 dark:text-white">
            Stock
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Activez le suivi de stock pour éviter les ventes au-delà des quantités disponibles.
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <UFormField name="track_inventory">
          <USwitch
            :model-value="productFormStore.formData.track_inventory"
            label="Suivre le stock de ce produit"
            @update:model-value="productFormStore.setFormData({ track_inventory: $event as boolean })"
          />
        </UFormField>

        <div v-if="productFormStore.formData.track_inventory" class="grid gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50 lg:grid-cols-2">
          <UFormField label="Quantité disponible">
            <UInput
              :model-value="productFormStore.formData.stock_quantity"
              type="number"
              min="0"
              class="w-full"
              @update:model-value="productFormStore.setFormData({ stock_quantity: Number($event) })"
            />
          </UFormField>

          <UFormField label="Alerte stock faible">
            <UInput
              :model-value="productFormStore.formData.low_stock_threshold"
              type="number"
              min="0"
              class="w-full"
              @update:model-value="productFormStore.setFormData({ low_stock_threshold: Number($event) })"
            />
          </UFormField>
        </div>

        <UFormField label="Code-barres">
          <UInput
            :model-value="productFormStore.formData.barcode"
            placeholder="Généré automatiquement ou scanné plus tard"
            disabled
            class="w-full lg:w-1/2"
          />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
