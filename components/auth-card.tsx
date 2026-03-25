"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogIn, Mail } from "lucide-react"

export function AuthCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = () => {
    setIsLoading(true)
    // In a real app, this would trigger Google OAuth flow
    // For demo purposes, simulate the flow
    console.log("[v0] Google Auth initiated")
    setTimeout(() => {
      setIsLoading(false)
      setIsOpen(false)
      // In real implementation, user would be logged in here
    }, 1000)
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60 bg-transparent gap-2"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>

      {/* Auth Card Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 bg-card border-border/50 shadow-xl z-50 p-6 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isSignUp ? "Create Account" : "Sign In"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isSignUp
                  ? "Join Athlas Verity to start verifying carbon credits"
                  : "Access your carbon verification dashboard"}
              </p>
            </div>

            {/* Email Input (for future enhancement) */}
            <div className="space-y-2 hidden">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-accent/50"
              />
            </div>

            {/* Google OAuth Button */}
            <Button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            {/* Email Sign In (disabled for now, placeholder for future) */}
            <Button
              disabled
              variant="outline"
              className="w-full border-border/50 text-muted-foreground hover:border-border/50 hover:bg-transparent bg-background/50 cursor-not-allowed"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email (Coming Soon)
            </Button>

            {/* Toggle Between Sign In and Sign Up */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>

            {/* Terms Notice */}
            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
              By signing in, you agree to our{" "}
              <a href="/terms" className="text-emerald-400 hover:text-emerald-300 underline">
                Terms
              </a>
              {" "}and{" "}
              <a href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline">
                Privacy
              </a>
            </p>
          </div>

          {/* Close when clicking outside */}
          <div
            className="fixed inset-0 z-40 -m-96"
            onClick={() => setIsOpen(false)}
          />
        </Card>
      )}
    </div>
  )
}
