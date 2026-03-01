'use client'

import { useState, useCallback } from 'react'

export interface LoadingState {
  isLoading: boolean
  progress: number
  status: string
  error: Error | null
}

export function useLoadingState(initialStatus = 'Initializing...') {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    status: initialStatus,
    error: null,
  })

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
      ...(loading && { error: null, progress: 0 }),
    }))
  }, [])

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }))
  }, [])

  const setStatus = useCallback((status: string) => {
    setState((prev) => ({
      ...prev,
      status,
    }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      status: initialStatus,
      error: null,
    })
  }, [initialStatus])

  return {
    ...state,
    setLoading,
    setProgress,
    setStatus,
    setError,
    reset,
  }
}

export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) {
  const { isLoading, error, setLoading, setError, reset } = useLoadingState()
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await operation()
      setData(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [operation, onSuccess, onError, setLoading, setError])

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  }
}
