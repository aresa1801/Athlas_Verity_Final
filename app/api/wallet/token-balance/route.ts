import { type NextRequest, NextResponse } from "next/server"

// Token contract addresses for different networks
const tokenAddresses: Record<string, { usdt: string; cafi: string; tao?: string }> = {
  sepolia: {
    usdt: "0x7169d38eaf9e3c9b05b94da8ba5dcf703e4b214d",
    cafi: "0xa5359E55423E47Afe93D86b1bdaD827f1C1c16EB",
  },
  arbitrum: {
    usdt: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    cafi: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  },
  bnb: {
    usdt: "0x55d398326f99059ff775485246999027b3197955",
    cafi: "0x1234567890123456789012345678901234567890",
  },
  "bittensor-testnet": {
    usdt: "0x1234567890123456789012345678901234567890",
    cafi: "0x0987654321098765432109876543210987654321",
    tao: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  },
  "bittensor-mainnet": {
    usdt: "0x1234567890123456789012345678901234567890",
    cafi: "0x0987654321098765432109876543210987654321",
    tao: "0xbittensortoken000000000000000000000000000",
  },
}

const rpcEndpoints: Record<string, string[]> = {
  sepolia: ["https://eth-sepolia.g.alchemy.com/v2/demo", "https://sepolia.drpc.org", "https://rpc.sepolia.org"],
  arbitrum: ["https://arb1.arbitrum.io/rpc", "https://arbitrum.drpc.org"],
  bnb: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"],
  "bittensor-testnet": ["https://archive-api.bittensor.com/testnet"],
  "bittensor-mainnet": ["https://archive-api.bittensor.com"],
}

async function fetchTokenBalance(rpcUrls: string[], tokenAddress: string, walletAddress: string): Promise<string> {
  let lastError: Error | null = null

  // Try each RPC endpoint in sequence
  for (const rpcUrl of rpcUrls) {
    try {
      // Validate inputs before making RPC calls
      if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        continue
      }

      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        continue
      }

      // Get decimals
      const decimalsResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: tokenAddress,
              data: "0x313ce567",
            },
            "latest",
          ],
          id: 1,
        }),
      })

      if (!decimalsResponse.ok) {
        lastError = new Error(`RPC error: ${decimalsResponse.status}`)
        continue
      }

      const decimalsData = await decimalsResponse.json()

      if (!decimalsData.result || decimalsData.error) {
        lastError = new Error(decimalsData.error?.message || "Invalid decimals response")
        continue
      }

      const decimals = Number.parseInt(decimalsData.result, 16) || 18

      // Get balance
      const balanceResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: tokenAddress,
              data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`,
            },
            "latest",
          ],
          id: 2,
        }),
      })

      if (!balanceResponse.ok) {
        lastError = new Error(`Balance RPC error: ${balanceResponse.status}`)
        continue
      }

      const balanceData = await balanceResponse.json()

      if (!balanceData.result || balanceData.error) {
        lastError = new Error(balanceData.error?.message || "Invalid balance response")
        continue
      }

      // Safe BigInt conversion with validation
      if (balanceData.result === "0x0" || !balanceData.result) {
        return "0.00"
      }

      const balance = BigInt(balanceData.result)
      const divisor = BigInt(10 ** decimals)
      const formattedBalance = (Number(balance) / Number(divisor)).toFixed(2)
      return formattedBalance
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  if (lastError) {
    console.error("[v0] Token balance fetch failed for all RPC endpoints:", lastError.message)
  }
  return "0.00"
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, networkId } = await request.json()

    if (!walletAddress || !networkId) {
      return NextResponse.json({ error: "Missing walletAddress or networkId" }, { status: 400 })
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }

    const networkTokens = tokenAddresses[networkId]
    if (!networkTokens) {
      return NextResponse.json({ error: `Unsupported network: ${networkId}` }, { status: 400 })
    }

    const rpcUrls = rpcEndpoints[networkId]
    if (!rpcUrls || rpcUrls.length === 0) {
      return NextResponse.json({ error: `No RPC endpoint for network: ${networkId}` }, { status: 500 })
    }

    const balances: Record<string, string> = {}

    // Fetch USDT balance
    balances.usdt = await fetchTokenBalance(rpcUrls, networkTokens.usdt, walletAddress)

    // Fetch CAFI balance
    balances.cafi = await fetchTokenBalance(rpcUrls, networkTokens.cafi, walletAddress)

    // Fetch TAO balance for Bittensor networks
    if (networkTokens.tao) {
      balances.tao = await fetchTokenBalance(rpcUrls, networkTokens.tao, walletAddress)
    }

    return NextResponse.json({
      success: true,
      walletAddress,
      networkId,
      balances,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Token balance API error:", error)
    return NextResponse.json({ error: "Failed to fetch token balances" }, { status: 500 })
  }
}
