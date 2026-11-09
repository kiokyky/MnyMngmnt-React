export function parseDecimalInput(val: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Support both comma and dot as decimal separator if user types "115,33"
  const normalized = val.trim().replace(',', '.');
  const parsed = Number(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCurrency(
  value: string | number | undefined | null,
  currency = 'IDR',
  maxDecimals = 2
): string {
  const num = Number(value || 0);
  if (isNaN(num)) return `${currency} 0`;

  const hasFraction = Math.abs(num % 1) > 0.00001;

  if (currency.toUpperCase() === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? Math.max(2, maxDecimals) : 0,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(num);
}

export function formatRateIDR(value: string | number | undefined | null): string {
  return formatCurrency(value, 'IDR', 4);
}

export function formatNumber(value: string | number | undefined | null, maxDecimals = 4): string {
  const num = Number(value || 0);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(num);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const ICON_MAP: Record<string, string> = {
  'shopping-bag': '🛍️',
  'shopping-cart': '🛒',
  'dollar-sign': '💵',
  utensils: '🍽️',
  coffee: '☕',
  zap: '⚡',
  car: '🚗',
  gift: '🎁',
  wallet: '👛',
  'trending-up': '📈',
  'trending-down': '📉',
  home: '🏠',
  heart: '❤️',
  briefcase: '💼',
  'credit-card': '💳',
  smartphone: '📱',
  book: '📚',
  plane: '✈️',
  music: '🎵',
  film: '🎬',
  shield: '🛡️',
  tag: '🏷️',
};

export function renderCategoryIcon(iconName: string | undefined | null): string {
  if (!iconName) return '🏷️';
  const key = iconName.trim().toLowerCase();
  if (ICON_MAP[key]) {
    return ICON_MAP[key];
  }
  // If already an emoji or short 1-2 char symbol, display it directly
  if ([...iconName.trim()].length <= 2) {
    return iconName.trim();
  }
  // Fallback: take first uppercase letter so it never overflows the 38px badge box
  return iconName.trim().charAt(0).toUpperCase();
}

