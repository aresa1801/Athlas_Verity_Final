// Service for managing token balance fetching with caching and error handling

interface TokenBalances {
  usdt: string
  cafi: string
  tao?: string
}

interface CachedBalance {
  balances: TokenBalances
  timestamp: number
}

const balanceCache = new Map<string, CachedBalance>()
const CACHE_DURATION = 60000 // 1 minute

export async function fetchTokenBalances(walletAddress: string, networkId: string): Promise<TokenBalances> {
  const cacheKey = `${walletAddress}-${networkId}`
  const cached = balanceCache.get(cacheKey)

  // Return cached balance if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.balances
  }

  try {
    const response = await fetch("/api/wallet/token-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, networkId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the result
    balanceCache.set(cacheKey, {
      balances: data.balances,
      timestamp: Date.now(),
    })

    return data.balances
  } catch (error) {
    console.error("[v0] Error fetching token balances:", error)
    // Return fallback values on error
    return {
      usdt: "0.00",
      cafi: "0.00",
      tao: "0.00",
    }
  }
}

export function clearBalanceCache(walletAddress?: string, networkId?: string) {
  if (walletAddress && networkId) {
    const cacheKey = `${walletAddress}-${networkId}`
    balanceCache.delete(cacheKey)
  } else {
    balanceCache.clear()
  }
}
