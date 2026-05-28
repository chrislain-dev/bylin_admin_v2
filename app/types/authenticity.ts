import type { Product, LaravelPaginator } from './product'

export interface AuthenticityAnalytics {
  total_scans: number
  authentic_scans: number
  fake_scans: number
  already_activated_scans: number
  fake_rate: number
}

export interface AuthenticityProductStats {
  product_id?: string
  total_codes?: number
  total?: number
  activated: number
  unactivated: number
  activation_rate?: number
  total_scans?: number
  average_scans_per_code?: number
}

export interface AuthenticityCode {
  id: string
  product_id: string
  qr_code: string
  serial_number?: string | null
  is_authentic?: boolean
  is_activated?: boolean
  scan_count?: number
  created_at?: string
  updated_at?: string
}

export interface AuthenticityProductRow extends Product {
  authenticity_stats?: AuthenticityProductStats | null
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string[]>
}

export interface ProductPaginator extends LaravelPaginator<Product> {}
