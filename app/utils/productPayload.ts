import type { ProductFormData, VariationFormData } from '~/types/product'

interface ProductPayloadOptions {
  images?: File[]
  imagesToDelete?: number[]
}

function positiveNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(fallback, parsed) : fallback
}

function optionalPositiveNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function cleanVariation(variation: VariationFormData): VariationFormData {
  const stockQuantity = positiveNumber(variation.stock_quantity, 0)
  const cleaned: VariationFormData = {
    ...variation,
    variation_name: variation.variation_name?.trim() || 'Nouvelle variation',
    price: positiveNumber(variation.price, 0.01),
    stock_quantity: stockQuantity,
    stock_status: variation.stock_status || (stockQuantity > 0 ? 'in_stock' : 'out_of_stock'),
    is_active: variation.is_active !== false,
    attributes: variation.attributes || {},
  }

  cleaned.compare_price = optionalPositiveNumber(cleaned.compare_price)
  cleaned.cost_price = optionalPositiveNumber(cleaned.cost_price)

  if (!cleaned.sku?.trim()) delete cleaned.sku
  if (!cleaned.barcode?.trim()) delete cleaned.barcode

  return cleaned
}

export function buildProductPayload(
  formData: ProductFormData,
  options: ProductPayloadOptions = {},
): Partial<ProductFormData> {
  const payload: Partial<ProductFormData> = {
    ...formData,
    name: formData.name?.trim(),
    slug: formData.slug?.trim() || undefined,
    sku: formData.sku?.trim() || undefined,
    description: formData.description?.trim() || undefined,
    short_description: formData.short_description?.trim() || undefined,
    price: positiveNumber(formData.price, 0.01),
    stock_quantity: positiveNumber(formData.stock_quantity, 0),
    low_stock_threshold: positiveNumber(formData.low_stock_threshold, 0),
    images: options.images || [],
    images_to_delete: options.imagesToDelete || [],
  }

  payload.compare_price = optionalPositiveNumber(formData.compare_price)
  payload.cost_price = optionalPositiveNumber(formData.cost_price)
  payload.preorder_limit = optionalPositiveNumber(formData.preorder_limit)

  if (!payload.collection_id) delete payload.collection_id
  if (!payload.barcode?.trim()) delete payload.barcode
  if (!payload.preorder_available_date) delete payload.preorder_available_date
  if (!payload.preorder_message?.trim()) delete payload.preorder_message
  if (!payload.preorder_terms?.trim()) delete payload.preorder_terms
  if (!payload.meta_title?.trim()) delete payload.meta_title
  if (!payload.meta_description?.trim()) delete payload.meta_description

  if (payload.is_variable && formData.variations.length > 0) {
    payload.variations = formData.variations.map(cleanVariation)
  } else {
    payload.variations = []
  }

  if (payload.requires_authenticity) {
    payload.authenticity_codes_count = Math.max(1, Number(formData.authenticity_codes_count || 10))
  } else {
    delete payload.authenticity_codes_count
  }

  return payload
}
