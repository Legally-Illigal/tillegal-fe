import { describe, expect, it, beforeEach } from 'vitest'
import { tokenStorage } from '@/lib/api'

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
