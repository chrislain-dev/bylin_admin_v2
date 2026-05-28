/* =========================================================================
 * 🏷️ PROMOTION UTILS — Nuxt 4 / E-commerce
 * ========================================================================= */

import type {
  Promotion,
  PromotionType,
  PromotionStatus,
} from "~/types/promotion";

import {
  formatPriceXOF,
  generateRandomCode,
  normalizeCode,
  getDaysRemaining,
  formatDateTimeFR,
} from "~/utils/helpers";

/* =========================================================================
 * ⚡ CONSTANTS (évite recréation mémoire)
 * ========================================================================= */

const TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "Pourcentage",
  fixed_amount: "Montant fixe",
  buy_x_get_y: "Achetez X obtenez Y",
};

const TYPE_ICONS: Record<PromotionType, string> = {
  percentage: "i-lucide-percent",
  fixed_amount: "i-lucide-coins",
  buy_x_get_y: "i-lucide-gift",
};

const TYPE_COLORS: Record<PromotionType, string> = {
  percentage: "primary",
  fixed_amount: "success",
  buy_x_get_y: "secondary",
};

const STATUS_LABELS: Record<PromotionStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expirée",
  upcoming: "À venir",
  exhausted: "Épuisée",
};

const STATUS_COLORS: Record<PromotionStatus, string> = {
  active: "success",
  inactive: "neutral",
  expired: "error",
  upcoming: "info",
  exhausted: "warning",
};

/* =========================================================================
 * 🏷️ TYPES — UI FRIENDLY EXPORTS
 * ========================================================================= */

export const getTypeLabel = (type: PromotionType): string =>
  TYPE_LABELS[type] ?? type;

export const getTypeIcon = (type: PromotionType): string =>
  TYPE_ICONS[type] ?? "i-lucide-tag";

export const getTypeColor = (type: PromotionType): string =>
  TYPE_COLORS[type] ?? "neutral";

/* =========================================================================
 * 📊 STATUS — LOGIQUE MÉTIER CORRECTE
 * ========================================================================= */

/**
 * Ordre IMPORTANT :
 * upcoming → expired → exhausted → active → inactive
 */
export function getPromotionStatus(promotion: Promotion): PromotionStatus {
  const now = Date.now();

  if (promotion.starts_at) {
    if (new Date(promotion.starts_at).getTime() > now) {
      return "upcoming";
    }
  }

  if (promotion.expires_at) {
    if (new Date(promotion.expires_at).getTime() < now) {
      return "expired";
    }
  }

  if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
    return "exhausted";
  }

  if (promotion.is_active) {
    return "active";
  }

  return "inactive";
}

export const getStatusLabel = (status: PromotionStatus): string =>
  STATUS_LABELS[status];

export const getPromotionStatusColor = (status: PromotionStatus): string =>
  STATUS_COLORS[status];

/* =========================================================================
 * 💰 VALEURS & CALCULS
 * ========================================================================= */

export function formatPromotionValue(promotion: Promotion): string {
  if (promotion.type === "percentage") {
    return `${Number(promotion.value)}%`;
  }

  if (promotion.type === "fixed_amount") {
    return formatPriceXOF(promotion.value);
  }

  return String(promotion.value);
}

export function calculateDiscount(
  promotion: Promotion,
  amount: number
): number {
  let discount = 0;

  if (promotion.type === "percentage") {
    discount = (amount * promotion.value) / 100;
  } else if (promotion.type === "fixed_amount") {
    discount = promotion.value;
  }

  if (
    promotion.max_discount_amount &&
    discount > promotion.max_discount_amount
  ) {
    discount = promotion.max_discount_amount;
  }

  return Math.max(0, Math.min(amount, Math.round(discount)));
}

export function isApplicableToAmount(
  promotion: Promotion,
  amount: number
): boolean {
  return (
    !promotion.min_purchase_amount || amount >= promotion.min_purchase_amount
  );
}

/* =========================================================================
 * 📈 UTILISATION
 * ========================================================================= */

export const hasReachedLimit = (promotion: Promotion): boolean =>
  !!promotion.usage_limit && promotion.usage_count >= promotion.usage_limit;

export const getUsagePercentage = (promotion: Promotion): number =>
  promotion.usage_limit
    ? Math.min(100, (promotion.usage_count / promotion.usage_limit) * 100)
    : 0;

export function formatUsageLimit(promotion: Promotion): string {
  if (!promotion.usage_limit) return "Illimité";
  return `${promotion.usage_limit - promotion.usage_count} / ${
    promotion.usage_limit
  } restants`;
}

/* =========================================================================
 * 🔑 CODES PROMO
 * ========================================================================= */

export const generatePromotionCode = (prefix = "", length = 8): string =>
  generateRandomCode(prefix, length);

export const normalizePromotionCode = (code: string): string =>
  normalizeCode(code);

export const isValidPromotionCode = (code: string): boolean =>
  /^[A-Z0-9]{3,50}$/.test(normalizePromotionCode(code));

/* =========================================================================
 * 📅 DATES
 * ========================================================================= */

export const formatPromotionDate = (date: string | null): string =>
  date ? formatDateTimeFR(date) : "—";

export const getPromotionDaysRemaining = (date: string | null): number | null =>
  getDaysRemaining(date);

/* =========================================================================
 * 📝 RÉSUMÉ UI
 * ========================================================================= */

export function createPromotionSummary(promotion: Promotion): string {
  const parts: string[] = [formatPromotionValue(promotion)];

  if (promotion.min_purchase_amount) {
    parts.push(`Min. ${formatPriceXOF(promotion.min_purchase_amount)}`);
  }

  if (promotion.max_discount_amount) {
    parts.push(`Max ${formatPriceXOF(promotion.max_discount_amount)}`);
  }

  return parts.join(" • ");
}
