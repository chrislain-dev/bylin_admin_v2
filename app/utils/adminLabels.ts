export const FIELD_LABELS: Record<string, string> = {
  id: 'Identifiant',
  name: 'Nom',
  title: 'Titre',
  email: 'Email',
  phone: 'Téléphone',
  status: 'Statut',
  role: 'Rôle',
  created_at: 'Date de création',
  updated_at: 'Dernière modification',
  deleted_at: 'Date de suppression',
  is_active: 'Visible sur le site',
  is_featured: 'Mis en avant',
  is_variable: 'Produit avec variantes',
  is_preorder_enabled: 'Précommande activée',
  products_count: 'Nombre de produits',
  orders_count: 'Nombre de commandes',
  sort_order: 'Ordre d’affichage',
  collection_id: 'Collection',
  brand_id: 'Marque',
  category_id: 'Catégorie',
  price: 'Prix de vente',
  compare_price: 'Prix barré',
  cost_price: 'Coût d’achat',
  stock_quantity: 'Quantité en stock',
  low_stock_threshold: 'Seuil d’alerte stock',
  track_inventory: 'Suivi du stock',
  short_description: 'Résumé court',
  description: 'Description',
  cover_image_url: 'Image de couverture',
  banner_image_url: 'Bannière',
  meta_title: 'Titre SEO',
  meta_description: 'Description SEO',
}

export function adminLabel(key: string): string {
  return FIELD_LABELS[key] || key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  disabled: 'Désactivé',
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
  suspended: 'Suspendu',
  invited: 'Invité',
  pending: 'En attente',
  processing: 'En traitement',
  completed: 'Terminé',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
  paid: 'Payé',
  unpaid: 'Non payé',
  failed: 'Échoué',
}

export function adminStatusLabel(value?: string | boolean | null): string {
  if (value === true) return 'Visible'
  if (value === false) return 'Masqué'
  if (!value) return 'Non défini'
  return STATUS_LABELS[value] || adminLabel(value)
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
  manager: 'Gestionnaire',
}

export function adminRoleLabel(role?: string | null): string {
  if (!role) return 'Aucun rôle'
  return ROLE_LABELS[role] || adminLabel(role)
}

export function booleanVisibilityLabel(value?: boolean | null): string {
  return value ? 'Visible sur le site' : 'Masqué du site'
}
