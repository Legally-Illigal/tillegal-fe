import * as React from 'react'
import { toast } from 'sonner'
import { adminApi } from '../api/admin-api'
import type { AiEvaluation, AiEvaluationSummary } from '../types/admin.types'

const DEFAULT_PAGE_SIZE = 10

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

export type HelpfulFilter = 'all' | 'helpful' | 'unhelpful'
export type RoleFilter = 'all' | 'User' | 'Lawyer'
export type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5'

export interface UseAdminEvaluationsReturn {
  summary: AiEvaluationSummary | null
  totalUsersCount: number | null
  evaluations: AiEvaluation[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  helpfulFilter: HelpfulFilter
  roleFilter: RoleFilter
  ratingFilter: RatingFilter
  setHelpfulFilter: (value: HelpfulFilter) => void
  setRoleFilter: (value: RoleFilter) => void
  setRatingFilter: (value: RatingFilter) => void
  setPageNumber: (page: number) => void
  resetFilters: () => void
  isSummaryLoading: boolean
  isListLoading: boolean
  summaryError: string | null
  listError: string | null
  selectedEvaluation: AiEvaluation | null
  isDetailOpen: boolean
  isDetailLoading: boolean
  setIsDetailOpen: (open: boolean) => void
  refresh: () => Promise<void>
  openEvaluationDetail: (evaluation: AiEvaluation) => Promise<void>
}

export function useAdminEvaluations(
  initialPageSize = DEFAULT_PAGE_SIZE,
): UseAdminEvaluationsReturn {
  const [summary, setSummary] = React.useState<AiEvaluationSummary | null>(null)
  const [totalUsersCount, setTotalUsersCount] = React.useState<number | null>(null)
  const [evaluations, setEvaluations] = React.useState<AiEvaluation[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize] = React.useState(initialPageSize)
  const [totalPages, setTotalPages] = React.useState(1)

  const [helpfulFilter, setHelpfulFilterState] = React.useState<HelpfulFilter>('all')
  const [roleFilter, setRoleFilterState] = React.useState<RoleFilter>('all')
  const [ratingFilter, setRatingFilterState] = React.useState<RatingFilter>('all')

  const [isSummaryLoading, setIsSummaryLoading] = React.useState(true)
  const [isListLoading, setIsListLoading] = React.useState(true)
  const [summaryError, setSummaryError] = React.useState<string | null>(null)
  const [listError, setListError] = React.useState<string | null>(null)

  const [selectedEvaluation, setSelectedEvaluation] = React.useState<AiEvaluation | null>(
    null,
  )
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isDetailLoading, setIsDetailLoading] = React.useState(false)

  const setHelpfulFilter = React.useCallback((value: HelpfulFilter) => {
    setHelpfulFilterState(value)
    setPageNumber(1)
  }, [])

  const setRoleFilter = React.useCallback((value: RoleFilter) => {
    setRoleFilterState(value)
    setPageNumber(1)
  }, [])

  const setRatingFilter = React.useCallback((value: RatingFilter) => {
    setRatingFilterState(value)
    setPageNumber(1)
  }, [])

  const resetFilters = React.useCallback(() => {
    setHelpfulFilterState('all')
    setRoleFilterState('all')
    setRatingFilterState('all')
    setPageNumber(1)
  }, [])

  const fetchSummary = React.useCallback(async () => {
    setIsSummaryLoading(true)
    setSummaryError(null)
    try {
      const [summaryRes, usersCountRes] = await Promise.allSettled([
        adminApi.getAiEvaluationsSummary(),
        adminApi.getUsers({ pageNumber: 1, pageSize: 1 }),
      ])

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value)
      } else {
        setSummaryError(
          extractErrorMessage(summaryRes.reason, 'Không thể tải thống kê đánh giá AI.'),
        )
      }

      if (usersCountRes.status === 'fulfilled') {
        setTotalUsersCount(usersCountRes.value.totalCount ?? 0)
      }
    } finally {
      setIsSummaryLoading(false)
    }
  }, [])

  const fetchList = React.useCallback(async () => {
    setIsListLoading(true)
    setListError(null)
    try {
      const response = await adminApi.getAiEvaluations({
        pageNumber,
        pageSize,
        isHelpful:
          helpfulFilter === 'helpful'
            ? true
            : helpfulFilter === 'unhelpful'
              ? false
              : undefined,
        evaluatorRole: roleFilter === 'all' ? undefined : roleFilter,
        rating: ratingFilter === 'all' ? undefined : Number(ratingFilter),
      })

      setEvaluations(Array.isArray(response.items) ? response.items : [])
      setTotalCount(response.totalCount ?? 0)
      setTotalPages(Math.max(1, response.totalPages ?? 1))
    } catch (err) {
      setListError(extractErrorMessage(err, 'Không thể tải danh sách đánh giá AI.'))
    } finally {
      setIsListLoading(false)
    }
  }, [pageNumber, pageSize, helpfulFilter, roleFilter, ratingFilter])

  React.useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  React.useEffect(() => {
    void fetchList()
  }, [fetchList])

  const refresh = React.useCallback(async () => {
    await Promise.all([fetchSummary(), fetchList()])
  }, [fetchSummary, fetchList])

  const openEvaluationDetail = React.useCallback(async (evaluation: AiEvaluation) => {
    setSelectedEvaluation(evaluation)
    setIsDetailOpen(true)
    setIsDetailLoading(true)
    try {
      const detail = await adminApi.getAiEvaluationById(evaluation.id)
      setSelectedEvaluation(detail)
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể tải chi tiết đánh giá.'))
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  return {
    summary,
    totalUsersCount,
    evaluations,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    helpfulFilter,
    roleFilter,
    ratingFilter,
    setHelpfulFilter,
    setRoleFilter,
    setRatingFilter,
    setPageNumber,
    resetFilters,
    isSummaryLoading,
    isListLoading,
    summaryError,
    listError,
    selectedEvaluation,
    isDetailOpen,
    isDetailLoading,
    setIsDetailOpen,
    refresh,
    openEvaluationDetail,
  }
}
