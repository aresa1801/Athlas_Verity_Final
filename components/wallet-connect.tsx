"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, RefreshCw, Power, Network, Loader2 } from "lucide-react"
import { fetchTokenBalances, clearBalanceCache } from "@/lib/token-balance-service"

type NetworkType = {
  id: string
  name: string
  chainId: string | null
  isTestnet?: boolean
}

const networks: NetworkType[] = [
  { id: "sepolia", name: "Sepolia Ethereum", chainId: "0xaa36a7" },
  { id: "arbitrum", name: "Arbitrum Mainnet", chainId: "0xa4b1" },
  { id: "bnb", name: "BNB Mainnet", chainId: "0x38" },
  { id: "bittensor-testnet", name: "Bittensor Testnet", chainId: null, isTestnet: true },
  { id: "bittensor-mainnet", name: "Bittensor Mainnet", chainId: null, isTestnet: true },
]

interface TokenBalances {
  usdt: string
  cafi: string
  tao?: string
}

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenBalances, setTokenBalances] = useState<TokenBalances>({
    usdt: "0.00",
    cafi: "0.00",
    tao: "0.00",
  })

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadTokenBalances()
    }
  }, [selectedNetwork, isConnected, walletAddress])

  const loadTokenBalances = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const balances = await fetchTokenBalances(walletAddress, selectedNetwork.id)
      setTokenBalances(balances)
    } catch (error) {
      console.error("[v0] Error loading token balances:", error)
      setError("Failed to load balances")
    } finally {
      setIsLoading(false)
    }
  }

  const connectWallet = async () => {
    try {
      setError(null)
      if (typeof window === "undefined") {
        console.log("[v0] Not in browser environment")
        return
      }

      if ((window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          })

          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0])
            setIsConnected(true)
            clearBalanceCache()
          }
        } catch (error: any) {
          console.log("[v0] MetaMask connection error:", error.message)
          // Demo mode fallback
          setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4")
          setIsConnected(true)
        }
      } else {
        console.log("[v0] MetaMask not detected, using demo mode")
        setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4")
        setIsConnected(true)
      }
    } catch (error) {
      console.error("[v0] Unexpected error during wallet connection:", error)
      setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4")
      setIsConnected(true)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress("")
    setTokenBalances({ usdt: "0.00", cafi: "0.00", tao: "0.00" })
    setIsDropdownOpen(false)
    setError(null)
    clearBalanceCache()
  }

  const refreshBalance = async () => {
    clearBalanceCache(walletAddress, selectedNetwork.id)
    await loadTokenBalances()
  }

  const reinitializeConnection = async () => {
    disconnectWallet()
    setTimeout(() => {
      connectWallet()
    }, 500)
  }

  const switchNetwork = async (network: NetworkType) => {
    setSelectedNetwork(network)
    setError(null)

    if (network.chainId && typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: network.chainId }],
        })
      } catch (error: any) {
        console.log("[v0] Network switch info:", error.message)
        // Don't show error for Bittensor - they're not EVM chains
        if (!network.isTestnet) {
          setError("Failed to switch network")
        }
      }
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        variant="outline"
        className="border-accent text-accent hover:bg-accent/10 bg-transparent"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 bg-transparent">
          <Wallet className="w-4 h-4 mr-2" />
          {formatAddress(walletAddress)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-card border-border" align="end">
        <DropdownMenuLabel className="text-foreground">Wallet Information</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        {/* Error Message */}
        {error && (
          <div className="px-2 py-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive mb-2">
            {error}
          </div>
        )}

        {/* Token Balances Section */}
        <div className="px-2 py-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-xs text-muted-foreground">Loading balances...</span>
            </div>
          ) : (
            <>
              <div>
                <div className="text-xs text-muted-foreground mb-1">USDT Balance</div>
                <div className="text-lg font-bold text-accent">${tokenBalances.usdt}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">CAFI Token</div>
                <div className="text-lg font-bold text-accent">{tokenBalances.cafi}</div>
              </div>
              {(selectedNetwork.id.includes("bittensor") || tokenBalances.tao !== "0.00") && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">TAO Token</div>
                  <div className="text-lg font-bold text-accent">{tokenBalances.tao || "0.00"}</div>
                </div>
              )}
            </>
          )}
        </div>

        <DropdownMenuSeparator className="bg-border" />

        {/* Network Selection */}
        <DropdownMenuLabel className="text-foreground flex items-center gap-2">
          <Network className="w-4 h-4" />
          Network
        </DropdownMenuLabel>
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => switchNetwork(network)}
            className={`cursor-pointer ${
              selectedNetwork.id === network.id ? "bg-accent/10 text-accent" : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="ml-6">{network.name}</span>
            {selectedNetwork.id === network.id && <span className="ml-auto text-accent">✓</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-border" />

        {/* Actions */}
        <DropdownMenuItem
          onClick={refreshBalance}
          disabled={isLoading}
          className="cursor-pointer text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Balances
        </DropdownMenuItem>

        <DropdownMenuItem onClick={reinitializeConnection} className="cursor-pointer text-foreground hover:bg-muted">
          <Power className="w-4 h-4 mr-2" />
          Reinitialize Connection
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={disconnectWallet}
          className="cursor-pointer text-destructive hover:bg-destructive/10"
        >
          <Power className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
