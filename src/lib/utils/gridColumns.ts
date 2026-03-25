/**
 * Calculate optimal column count for a grid of items.
 * Minimizes empty cells in the last row while avoiding
 * a single item sitting alone (remainder 1).
 * Uses a minimum column floor of ceil(maxColumns/2) to
 * prevent overly narrow grids.
 *
 * Decision table (maxColumns=5):
 * 2→2, 3→3, 4→4, 5→5, 6→3, 7→4, 8→4, 9→3,
 * 10→5, 11→4, 12→4, 13→5, 14→5, 15→5, 16→4
 */
export function getOptimalColumnCount(
  total: number,
  maxColumns: number,
): number {
  if (total <= 0) return 1
  if (total === 1) return 1
  if (total <= maxColumns) return total

  const minCols = Math.max(2, Math.ceil(maxColumns / 2))

  let bestCols = minCols
  let bestEmpty = Infinity
  let bestIsAlone = true

  for (let cols = minCols; cols <= maxColumns; cols++) {
    const remainder = total % cols
    const emptyCells = remainder === 0 ? 0 : cols - remainder
    const isAlone = remainder === 1

    // Compare: prefer no-alone, then fewer empty cells, then more cols
    const isBetter =
      (!isAlone && bestIsAlone) ||
      (isAlone === bestIsAlone && emptyCells < bestEmpty) ||
      (isAlone === bestIsAlone && emptyCells === bestEmpty && cols > bestCols)

    if (isBetter) {
      bestCols = cols
      bestEmpty = emptyCells
      bestIsAlone = isAlone
    }
  }

  return bestCols
}
