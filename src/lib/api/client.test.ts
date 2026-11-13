import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, tokenStorage } from '@/lib/api'

describe('tokenStorage', () => {
  beforeEach(() => {
    tokenStorage.clearTokens()
  })

  it('stores and retrieves access token correctly', () => {
    tokenStorage.setAccessToken('sample-access-token')
    expect(tokenStorage.getAccessToken()).toBe('sample-access-token')
  })

  it('clears access token when clearTokens is called', () => {
    tokenStorage.setAccessToken('token1')
    tokenStorage.clearTokens()
    expect(tokenStorage.getAccessToken()).toBeNull()
  })
})

describe('apiClient FormData and Blob requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    tokenStorage.clearTokens()
  })

  it('sends FormData without forcing application/json Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'att-1', fileName: 'hop-dong.pdf' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    tokenStorage.setAccessToken('jwt-123')

    const formData = new FormData()
    formData.append(
      'file',
      new File(['hello'], 'hop-dong.pdf', { type: 'application/pdf' }),
    )

    const res = await apiClient.postForm<{ id: string }>(
      '/conversations/conv-1/attachments',
      formData,
    )

    expect(res.id).toBe('att-1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
    expect(headers.Authorization).toBe('Bearer jwt-123')
    expect(init.body).toBe(formData)
  })

  it('downloads binary blob and parses UTF-8 filename from Content-Disposition', async () => {
    const mockBlob = new Blob(['pdf-bytes'], { type: 'application/pdf' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
      headers: new Headers({
        'content-disposition':
          "attachment; filename*=UTF-8''h%E1%BB%A3p-%C4%91%E1%BB%93ng.pdf",
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiClient.getBlob(
      '/conversations/conv-1/attachments/att-1/download',
    )
    expect(result.blob).toBe(mockBlob)
    expect(result.fileName).toBe('hợp-đồng.pdf')
  })
})
