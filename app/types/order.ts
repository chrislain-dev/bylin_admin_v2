export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'completed'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'
  | 'unpaid'

export interface OrderCustomer {
  id?: string
  name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
}

export interface OrderItem {
  id: string
  product_id?: string | null
  product_name?: string
  name?: string
  sku?: string | null
  quantity: number
  unit_price?: number
  price?: number
  total?: number
  subtotal?: number
}

export interface Order {
  id: string
  order_number?: string
  reference?: string
  status: OrderStatus | string
  payment_status: PaymentStatus | string
  total_amount?: number
  total?: number
  grand_total?: number
  subtotal?: number
  currency?: string
  customer?: OrderCustomer | null
  customer_name?: string
  customer_email?: string
  items?: OrderItem[]
  created_at: string
  updated_at?: string
}

export interface LaravelPaginator<T> {
  data: T[]
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface OrderFilters {
  search?: string
  status?: string
  payment_status?: string
  per_page?: number
  page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export function getOrderNumber(order: Order): string {
  return order.order_number || order.reference || order.id
}

export function getOrderCustomerName(order: Order): string {
  if (order.customer_name) return order.customer_name
  if (order.customer?.name) return order.customer.name
  const fullName = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ')
  return fullName || order.customer_email || order.customer?.email || 'Client inconnu'
}

export function getOrderCustomerEmail(order: Order): string {
  return order.customer_email || order.customer?.email || '—'
}

export function getOrderTotal(order: Order): number {
  return Number(order.total_amount ?? order.grand_total ?? order.total ?? 0)
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En traitement',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    refunded: 'Remboursée'
  }

  return labels[status] || status
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    unpaid: 'Non payé',
    paid: 'Payé',
    failed: 'Échoué',
    refunded: 'Remboursé',
    partially_refunded: 'Partiellement remboursé',
    cancelled: 'Annulé'
  }

  return labels[status] || status
}

export function getOrderStatusColor(status: string): 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' {
  const colors: Record<string, 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'> = {
    pending: 'warning',
    processing: 'primary',
    confirmed: 'info',
    shipped: 'secondary',
    delivered: 'success',
    completed: 'success',
    cancelled: 'neutral',
    refunded: 'neutral'
  }

  return colors[status] || 'neutral'
}

export function getPaymentStatusColor(status: string): 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' {
  const colors: Record<string, 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'> = {
    pending: 'warning',
    unpaid: 'warning',
    paid: 'success',
    failed: 'error',
    refunded: 'neutral',
    partially_refunded: 'info',
    cancelled: 'neutral'
  }

  return colors[status] || 'neutral'
}
