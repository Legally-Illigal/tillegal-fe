import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CitationItem } from '@/features/citation'
import { chatApi } from './api/chat-api'
import { MessageContent } from './components/message-content'
import type { Conversation } from './types/chat.types'

describe('Chat Feature', () => {
  describe('chatApi local storage management', () => {
    beforeEach(() => {
      chatApi.clearLocalConversations()
    })

    it('saves and retrieves conversations correctly', () => {
      const conv1: Conversation = {
        id: 'c1',
        title: 'Tư vấn thừa kế',
        createdAt: '2026-10-26T14:00:00Z',
      }
      chatApi.saveLocalConversation(conv1)

      const stored = chatApi.getLocalConversations()
      expect(stored).toHaveLength(1)
      expect(stored[0]?.id).toBe('c1')
      expect(stored[0]?.title).toBe('Tư vấn thừa kế')
    })

    it('deletes conversations by id', () => {
      chatApi.saveLocalConversation({ id: 'c1', title: 'Hội thoại 1', createdAt: '' })
      chatApi.saveLocalConversation({ id: 'c2', title: 'Hội thoại 2', createdAt: '' })

      expect(chatApi.getLocalConversations()).toHaveLength(2)

      chatApi.deleteLocalConversation('c1')
      const remaining = chatApi.getLocalConversations()
      expect(remaining).toHaveLength(1)
      expect(remaining[0]?.id).toBe('c2')
    })
  })

  describe('MessageContent', () => {
    const citations: CitationItem[] = [
      {
        id: 'cit-1',
        index: 1,
        documentTitle: 'Luật Đất đai 2024',
        articleReference: 'Điều 45',
      },
    ]

    it('renders headers, bold text, and bullet points', () => {
      const text = `### 1. Cơ sở pháp lý\n- Căn cứ vào **khoản 1** quy định.`
      render(<MessageContent content={text} />)

      expect(screen.getByText('1. Cơ sở pháp lý')).toBeInTheDocument()
      expect(screen.getByText('khoản 1')).toBeInTheDocument()
    })

    it('renders inline citation badges and triggers onSelectCitation', () => {
      const text = `Theo quy định của pháp luật[^1], người sử dụng đất có quyền thừa kế.`
      const handleSelect = vi.fn()

      render(
        <MessageContent
          content={text}
          citations={citations}
          onSelectCitation={handleSelect}
        />,
      )

      const badge = screen.getByRole('button', { name: /Trích dẫn 1/i })
      expect(badge).toBeInTheDocument()

      fireEvent.click(badge)
      expect(handleSelect).toHaveBeenCalledWith(citations[0])
    })
  })
})
