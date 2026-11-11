import * as React from 'react'
import { toast } from 'sonner'
import { verificationApi } from '../api/verification-api'
import type {
  SampleVerificationScenario,
  VerifyCitationRequest,
  VerifyCitationResponse,
} from '../types/verification.types'

export interface UseVerificationReturn {
  request: VerifyCitationRequest | null
  result: VerifyCitationResponse | null
  isLoading: boolean
  error: string | null
  history: VerifyCitationResponse[]
  verify: (data: VerifyCitationRequest) => Promise<void>
  loadSample: (scenario: SampleVerificationScenario) => void
  selectHistoryItem: (item: VerifyCitationResponse) => void
  deleteHistoryItem: (id: string) => void
  clearHistory: () => void
  reset: () => void
}

export function useVerification(): UseVerificationReturn {
  const [request, setRequest] = React.useState<VerifyCitationRequest | null>(null)
  const [result, setResult] = React.useState<VerifyCitationResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [history, setHistory] = React.useState<VerifyCitationResponse[]>(() =>
    verificationApi.getVerificationHistory(),
  )

  const verify = React.useCallback(async (data: VerifyCitationRequest) => {
    setIsLoading(true)
    setError(null)
    setRequest(data)

    try {
      const response = await verificationApi.verifyCitation(data)
      setResult(response)
      setHistory(verificationApi.getVerificationHistory())
      toast.success('Đã hoàn tất thẩm định căn cứ pháp lý')
    } catch (err) {
      const msg = (err as Error).message || 'Không thể thực hiện thẩm định'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSample = React.useCallback((scenario: SampleVerificationScenario) => {
    setRequest(scenario.request)
    setResult(null)
    setError(null)
  }, [])

  const selectHistoryItem = React.useCallback((item: VerifyCitationResponse) => {
    setResult(item)
    setRequest({
      claim: item.claim,
      citedArticle: item.citedArticle,
      citedText: item.citedText,
    })
    setError(null)
  }, [])

  const deleteHistoryItem = React.useCallback((id: string) => {
    verificationApi.deleteVerificationHistory(id)
    setHistory((prev) => prev.filter((item) => item.id !== id))
    setResult((prev) => (prev?.id === id ? null : prev))
    toast.success('Đã xóa khỏi lịch sử')
  }, [])

  const clearHistory = React.useCallback(() => {
    verificationApi.clearVerificationHistory()
    setHistory([])
    toast.success('Đã xóa toàn bộ lịch sử thẩm định')
  }, [])

  const reset = React.useCallback(() => {
    setRequest(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    request,
    result,
    isLoading,
    error,
    history,
    verify,
    loadSample,
    selectHistoryItem,
    deleteHistoryItem,
    clearHistory,
    reset,
  }
}
