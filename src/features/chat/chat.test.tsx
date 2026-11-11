import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CitationItem } from '@/features/citation'
import { apiClient } from '@/lib/api/client'
import { chatApi, normalizeMessage } from './api/chat-api'
import { MessageContent } from './components/message-content'
import { MessageList } from './components/message-list'
import type { Conversation, ConversationMessage } from './types/chat.types'

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

  describe('normalizeMessage & getMessages API parsing', () => {
    it('normalizes raw object and parses string citations safely', () => {
      const raw = {
        id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'ASSISTANT',
        content: 'Nội dung trả lời',
        citations: JSON.stringify([
          {
            id: 'cit-1',
            index: 1,
            documentTitle: 'Luật Đất đai',
          },
        ]),
        created_at: '2026-10-26T14:00:00Z',
      }

      const normalized = normalizeMessage(raw)
      expect(normalized.id).toBe('msg-1')
      expect(normalized.conversationId).toBe('conv-1')
      expect(normalized.role).toBe('assistant')
      expect(normalized.content).toBe('Nội dung trả lời')
      expect(normalized.citations).toHaveLength(1)
      expect(normalized.citations?.[0]?.documentTitle).toBe('Luật Đất đai')
    })

    it('handles CursorPagedMessagesApiResponse object from backend correctly', async () => {
      const mockPagedResponse = {
        data: [
          {
            id: 'msg-101',
            conversationId: 'conv-101',
            role: 'user',
            content: 'Chào bạn',
            citations: null,
            createdAt: '2026-10-26T14:00:00Z',
          },
        ],
        has_more: false,
        next_cursor: null,
      }

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockPagedResponse)

      const result = await chatApi.getMessages('conv-101')
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('msg-101')
      expect(result[0]?.role).toBe('user')
    })
  })

  describe('MessageList', () => {
    it('renders empty suggestions state safely without throwing when messages is empty or unnormalized', () => {
      // Test when messages is empty array
      const { rerender } = render(<MessageList messages={[]} isLoading={false} />)
      expect(screen.getByText('Trợ lý AI Pháp luật Việt Nam')).toBeInTheDocument()

      // Test defensive guard if messages is passed as non-array at runtime (e.g. backend paged object)
      rerender(
        // @ts-expect-error Testing runtime defensive guard against unexpected backend shape
        <MessageList messages={{ data: [], has_more: false }} isLoading={false} />,
      )
      expect(screen.getByText('Trợ lý AI Pháp luật Việt Nam')).toBeInTheDocument()
    })

    it('renders list of messages safely without errors', () => {
      const messages: ConversationMessage[] = [
        {
          id: 'm1',
          conversationId: 'c1',
          role: 'user',
          content: 'Thủ tục cấp sổ đỏ thế nào?',
          createdAt: '2026-10-26T14:00:00Z',
        },
      ]

      render(<MessageList messages={messages} isLoading={false} />)
      expect(screen.getByText('Thủ tục cấp sổ đỏ thế nào?')).toBeInTheDocument()
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
