/**
 * Format number with thousand separators using international standard (commas)
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: number, decimals: number = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param value - Number to format
 * @returns Formatted string with abbreviation
 */
export function formatNumberWithAbbreviation(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + "B"
  if (value >= 1e6) return (value / 1e6).toFixed(2) + "M"
  if (value >= 1e3) return (value / 1e3).toFixed(2) + "K"
  return value.toFixed(2)
}
