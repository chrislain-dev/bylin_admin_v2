<script setup lang="ts">
import {
  getOrderCustomerEmail,
  getOrderCustomerName,
  getOrderNumber,
  getOrderStatusColor,
  getOrderStatusLabel,
  getOrderTotal,
  getPaymentStatusColor,
  getPaymentStatusLabel
} from '~/types/order'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { currentOrder, isLoading, fetchOrder, updateOrderStatus, cancelOrder } = useOrders()
const orderId = route.params.id as string

const statusItems = [
  { label: 'En attente', value: 'pending' },
  { label: 'En traitement', value: 'processing' },
  { label: 'Expédiée', value: 'shipped' },
  { label: 'Livrée', value: 'delivered' },
  { label: 'Annulée', value: 'cancelled' }
]

const selectedStatus = ref<string | undefined>()
const cancelReason = ref('')
const cancelModalOpen = ref(false)

async function handleStatusUpdate() {
  if (!selectedStatus.value) return

  const success = await updateOrderStatus(orderId, selectedStatus.value)
  if (success) {
    toast.add({ title: 'Statut mis à jour', color: 'success' })
    await fetchOrder(orderId)
  }
}

async function handleCancel() {
  const success = await cancelOrder(orderId, cancelReason.value || undefined)
  if (success) {
    toast.add({ title: 'Commande annulée', color: 'success' })
    cancelModalOpen.value = false
    await fetchOrder(orderId)
  }
}

onMounted(async () => {
  const order = await fetchOrder(orderId)
  selectedStatus.value = order?.status
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="currentOrder ? `Commande ${getOrderNumber(currentOrder)}` : 'Commande'">
        <template #left>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="router.push('/orders')" />
        </template>
        <template #right>
          <UButton
            label="Annuler"
            icon="i-lucide-x-circle"
            color="error"
            variant="soft"
            :disabled="!currentOrder || ['cancelled', 'delivered', 'completed', 'refunded'].includes(currentOrder.status)"
            @click="cancelModalOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-10 w-64" />
        <USkeleton class="h-64 w-full" />
      </div>

      <div v-else-if="currentOrder" class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold">Articles</h2>
                <UBadge :color="getOrderStatusColor(currentOrder.status)" variant="outline">
                  {{ getOrderStatusLabel(currentOrder.status) }}
                </UBadge>
              </div>
            </template>

            <div v-if="currentOrder.items?.length" class="divide-y divide-default">
              <div v-for="item in currentOrder.items" :key="item.id" class="py-4 flex items-center justify-between gap-4">
                <div>
                  <p class="font-medium">{{ item.product_name || item.name || 'Produit' }}</p>
                  <p class="text-sm text-muted">SKU: {{ item.sku || '—' }} · Qté: {{ item.quantity }}</p>
                </div>
                <p class="font-semibold">
                  {{ formatPriceXOF(Number(item.total ?? item.subtotal ?? item.price ?? item.unit_price ?? 0)) }}
                </p>
              </div>
            </div>

            <UAlert v-else color="neutral" variant="soft" title="Aucun article chargé" />
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <h2 class="font-semibold">Résumé</h2>
            </template>

            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Total</dt>
                <dd class="font-semibold">{{ formatPriceXOF(getOrderTotal(currentOrder)) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Paiement</dt>
                <dd>
                  <UBadge :color="getPaymentStatusColor(currentOrder.payment_status)" variant="subtle">
                    {{ getPaymentStatusLabel(currentOrder.payment_status) }}
                  </UBadge>
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Date</dt>
                <dd>{{ new Date(currentOrder.created_at).toLocaleString('fr-FR') }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold">Client</h2>
            </template>
            <p class="font-medium">{{ getOrderCustomerName(currentOrder) }}</p>
            <p class="text-sm text-muted">{{ getOrderCustomerEmail(currentOrder) }}</p>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold">Changer le statut</h2>
            </template>
            <div class="space-y-3">
              <USelect v-model="selectedStatus" :items="statusItems" value-key="value" label-key="label" class="w-full" />
              <UButton label="Mettre à jour" block :loading="isLoading" @click="handleStatusUpdate" />
            </div>
          </UCard>
        </div>
      </div>

      <UAlert v-else color="error" variant="soft" title="Commande introuvable" />

      <UModal v-model:open="cancelModalOpen" title="Annuler la commande">
        <template #body>
          <UTextarea v-model="cancelReason" placeholder="Motif d’annulation" class="w-full" />
        </template>
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton label="Fermer" color="neutral" variant="ghost" @click="cancelModalOpen = false" />
            <UButton label="Confirmer l’annulation" color="error" @click="handleCancel" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
