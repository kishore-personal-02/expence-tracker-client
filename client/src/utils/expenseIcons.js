export const CATEGORY_ICONS = {
  Food: '🍽️',
  Transport: '🚗',
  Housing: '🏠',
  Utilities: '💡',
  Entertainment: '🎬',
  Healthcare: '💊',
  Shopping: '🛍️',
  Education: '📚',
  Other: '📦',
}

const FALLBACK_ICONS = ['📦', '🧾', '💼', '🎁', '☕', '🐾', '🏖️', '🎮', '📈', '🛒']

export const getCategoryIcon = (category) => {
  if (!category) return '📦'
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category]
  const hash = category.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return FALLBACK_ICONS[hash % FALLBACK_ICONS.length]
}