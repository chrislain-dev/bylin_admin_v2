<script setup lang="ts">
import type { ApiResponse } from '~/types/product'
import { useProductFormStore } from '~/stores/productForm'

const props = defineProps<{
  productId?: string
  mode: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()
const { brands } = useBrands()
const client = useSanctumClient()

const isBylinBrand = computed(() => {
  const selectedBrand = brands.value.find((brand) => brand.id === productFormStore.formData.brand_id)
  return selectedBrand?.slug === 'bylin'
})

const authenticityStats = ref<{
  total: number
  activated: number
  unactivated: number
} | null>(null)

const isLoadingStats = ref(false)

const codesChangeMessage = computed(() => {
  if (!authenticityStats.value || props.mode === 'create') {
    return null
  }

  const requested = Number(productFormStore.formData.authenticity_codes_count || 0)
  const current = authenticityStats.value.total
  const activated = authenticityStats.value.activated

  if (requested > current) {
    const diff = requested - current

    return {
      label: `${diff} nouveau${diff > 1 ? 'x' : ''} code${diff > 1 ? 's' : ''} sera généré${diff > 1 ? 's' : ''}.`,
      color: 'success' as const,
      icon: 'i-lucide-plus-circle',
    }
  }

  if (requested < activated) {
    return {
      label: `${activated} code(s) sont déjà activés. Vous ne pouvez pas descendre en dessous.`,
      color: 'error' as const,
      icon: 'i-lucide-alert-triangle',
    }
  }

  if (requested < current) {
    const diff = current - requested

    return {
      label: `${diff} code(s) non activés seront supprimés.`,
      color: 'warning' as const,
      icon: 'i-lucide-trash-2',
    }
  }

  return {
    label: 'Aucun changement sur les codes.',
    color: 'neutral' as const,
    icon: 'i-lucide-info',
  }
})

const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)

  return date.toISOString().split('T')[0]
})

const oneYearLater = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)

  return date.toISOString().split('T')[0]
})

watch(
  () => [
    props.mode,
    props.productId,
    productFormStore.formData.requires_authenticity,
    productFormStore.formData.brand_id,
  ],
  async () => {
    if (
      props.mode === 'edit'
      && props.productId
      && productFormStore.formData.requires_authenticity
      && isBylinBrand.value
    ) {
      await loadAuthenticityStats()
    }
  },
  { immediate: true },
)

watch(isBylinBrand, (enabled) => {
  if (!enabled && productFormStore.formData.requires_authenticity) {
    productFormStore.setFormData({
      requires_authenticity: false,
      authenticity_codes_count: 0,
    })
  }
})

async function loadAuthenticityStats(): Promise<void> {
  if (!props.productId) {
    return
  }

  isLoadingStats.value = true

  try {
    const response = await client<ApiResponse<{
      total: number
      activated: number
      unactivated: number
    }>>(`/api/v1/admin/products/${props.productId}/authenticity/stats`)

    if (response.success) {
      authenticityStats.value = response.data
    }
  } catch {
    authenticityStats.value = null
  } finally {
    isLoadingStats.value = false
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Authenticité -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Authenticité Bylin
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Générez des codes QR d’authenticité pour vérifier les produits de marque Bylin.
            </p>
          </div>

          <UBadge :color="productFormStore.formData.requires_authenticity ? 'success' : 'neutral'" variant="subtle">
            {{ productFormStore.formData.requires_authenticity ? 'Activée' : 'Désactivée' }}
          </UBadge>
        </div>
      </template>

      <div v-if="isBylinBrand" class="space-y-5">
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-medium text-gray-950 dark:text-white">
                Activer les codes d’authenticité
              </p>

              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Chaque produit physique pourra être vérifié avec un code unique.
              </p>
            </div>

            <USwitch :model-value="productFormStore.formData.requires_authenticity"
              @update:model-value="productFormStore.setFormData({ requires_authenticity: $event as boolean })" />
          </div>
        </div>

        <div v-if="productFormStore.formData.requires_authenticity" class="space-y-5">
          <div v-if="mode === 'edit' && authenticityStats" class="grid gap-4 sm:grid-cols-3">
            <UCard>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Codes générés
              </p>

              <p class="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
                {{ authenticityStats.total }}
              </p>
            </UCard>

            <UCard>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Déjà activés
              </p>

              <p class="mt-1 text-2xl font-semibold text-success">
                {{ authenticityStats.activated }}
              </p>
            </UCard>

            <UCard>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Disponibles
              </p>

              <p class="mt-1 text-2xl font-semibold text-primary">
                {{ authenticityStats.unactivated }}
              </p>
            </UCard>
          </div>

          <UFormField label="Nombre de codes à générer"
            description="Préparez les codes qui seront utilisés pour vérifier les produits vendus.">
            <UInput :model-value="productFormStore.formData.authenticity_codes_count" type="number" min="1" max="10000"
              placeholder="10" class="w-full lg:w-1/2"
              @update:model-value="productFormStore.setFormData({ authenticity_codes_count: Number($event) })">
              <template #trailing>
                <span class="text-xs text-gray-400">codes</span>
              </template>
            </UInput>
          </UFormField>

          <UAlert v-if="codesChangeMessage" :color="codesChangeMessage.color" variant="soft"
            :icon="codesChangeMessage.icon" :title="codesChangeMessage.label" />

          <UAlert v-if="mode === 'edit' && authenticityStats && authenticityStats.activated > 0"
            icon="i-lucide-shield-check" color="success" variant="soft"
            :title="`${authenticityStats.activated} code(s) déjà activés`"
            description="Ces codes sont liés à des produits déjà vendus ou scannés et ne doivent pas être supprimés." />
        </div>
      </div>

      <UAlert v-else icon="i-lucide-info" color="neutral" variant="soft"
        title="Authenticité réservée aux produits Bylin"
        description="Sélectionnez la marque Bylin pour activer cette option." />
    </UCard>

    <!-- Variations -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Variations du produit
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Utilisez les variations si le produit existe en plusieurs tailles, couleurs ou modèles.
            </p>
          </div>

          <UBadge :color="productFormStore.formData.is_variable ? 'primary' : 'neutral'" variant="subtle">
            {{ productFormStore.formData.is_variable ? 'Produit variable' : 'Produit simple' }}
          </UBadge>
        </div>
      </template>

      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-medium text-gray-950 dark:text-white">
              Ce produit a plusieurs options
            </p>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Activez cette option pour gérer les tailles, couleurs, prix ou stocks par variation.
            </p>
          </div>

          <USwitch :model-value="productFormStore.formData.is_variable"
            @update:model-value="productFormStore.setFormData({ is_variable: $event as boolean })" />
        </div>
      </div>

      <UAlert v-if="productFormStore.formData.is_variable" class="mt-5" icon="i-lucide-info" color="primary"
        variant="soft" title="Variations activées"
        description="Rendez-vous dans l’onglet Variations pour créer les déclinaisons du produit." />
    </UCard>

    <!-- Précommande -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-950 dark:text-white">
              Précommande
            </h2>

            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Permettez aux clients de commander un produit avant sa disponibilité officielle.
            </p>
          </div>

          <UBadge :color="productFormStore.formData.is_preorder_enabled ? 'warning' : 'neutral'" variant="subtle">
            {{ productFormStore.formData.is_preorder_enabled ? 'Activée' : 'Désactivée' }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-5">
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-medium text-gray-950 dark:text-white">
                Activer la précommande
              </p>

              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Le produit pourra être commandé même s’il n’est pas encore disponible.
              </p>
            </div>

            <USwitch :model-value="productFormStore.formData.is_preorder_enabled"
              @update:model-value="productFormStore.setFormData({ is_preorder_enabled: $event as boolean })" />
          </div>
        </div>

        <div v-if="productFormStore.formData.is_preorder_enabled" class="grid gap-5 lg:grid-cols-2">
          <UFormField label="Date de disponibilité" description="Date à laquelle le produit sera disponible." required>
            <UInput :model-value="productFormStore.formData.preorder_available_date" type="date" :min="tomorrow"
              :max="oneYearLater" class="w-full"
              @update:model-value="productFormStore.setFormData({ preorder_available_date: String($event || '') })" />
          </UFormField>

          <UFormField label="Limite de précommandes"
            description="Laissez vide si le nombre de précommandes est illimité.">
            <UInput :model-value="productFormStore.formData.preorder_limit" type="number" min="1" placeholder="Illimité"
              class="w-full"
              @update:model-value="productFormStore.setFormData({ preorder_limit: $event ? Number($event) : undefined })">
              <template #trailing>
                <span class="text-xs text-gray-400">unités</span>
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Message affiché au client" description="Message visible sur la page produit."
            class="lg:col-span-2">
            <UTextarea :model-value="productFormStore.formData.preorder_message" :rows="3"
              placeholder="Ex. Disponible à partir du 15 janvier." class="w-full"
              @update:model-value="productFormStore.setFormData({ preorder_message: String($event || '') })" />
          </UFormField>

          <UFormField label="Conditions de précommande" description="Informations importantes liées à la précommande."
            class="lg:col-span-2">
            <UTextarea :model-value="productFormStore.formData.preorder_terms" :rows="4"
              placeholder="Ex. Expédition après disponibilité, paiement immédiat, conditions d’annulation..."
              class="w-full"
              @update:model-value="productFormStore.setFormData({ preorder_terms: String($event || '') })" />
          </UFormField>
        </div>
      </div>
    </UCard>
  </div>
</template>
