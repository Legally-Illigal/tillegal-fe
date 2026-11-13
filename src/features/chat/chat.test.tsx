import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CitationItem } from '@/features/citation'
import { apiClient } from '@/lib/api/client'
import { ApiError } from '@/lib/api/types'
import {
  chatApi,
  normalizeAttachment,
  normalizeConversation,
  normalizeMessage,
} from './api/chat-api'
import { AttachmentDrawer } from './components/attachment-drawer'
import { ChatInput } from './components/chat-input'
import { ChatSidebar } from './components/chat-sidebar'
import { MessageContent } from './components/message-content'
import { MessageList } from './components/message-list'
import { deduplicateMessages } from './hooks/use-chat'
import type {
  Conversation,
  ConversationAttachment,
  ConversationMessage,
} from './types/chat.types'
import {
  formatAttachmentErrorMessage,
  formatFileSize,
  getAttachmentStatusMeta,
  MAX_ATTACHMENT_SIZE_BYTES,
  validateAttachmentFile,
} from './utils/attachment-helpers'

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

    it('sanitizes and purges contaminated conversations from another user in local storage', () => {
      const userAId = 'user-a-1111'
      const userBId = 'user-b-2222'

      // Contaminate local storage for user A with an item belonging to user B
      const key = `tillegal_saved_conversations_${userAId}`
      localStorage.setItem(
        key,
        JSON.stringify([
          { id: 'c-a', userId: userAId, title: 'Hội thoại A', createdAt: '' },
          {
            id: 'c-b',
            userId: userBId,
            title: 'Hội thoại B của người khác',
            createdAt: '',
          },
        ]),
      )

      const safeList = chatApi.getLocalConversations(userAId)
      expect(safeList).toHaveLength(1)
      expect(safeList[0]?.id).toBe('c-a')

      // Check that localStorage was cleaned
      const cleaned = JSON.parse(localStorage.getItem(key) || '[]')
      expect(cleaned).toHaveLength(1)
      expect(cleaned[0].id).toBe('c-a')
    })

    it('refuses to save a conversation belonging to a different user', () => {
      const userAId = 'user-a-1111'
      const userBId = 'user-b-2222'

      chatApi.saveLocalConversation(
        { id: 'c-foreign', userId: userBId, title: 'Hội thoại B', createdAt: '' },
        userAId,
      )

      const stored = chatApi.getLocalConversations(userAId)
      expect(stored).toHaveLength(0)
    })
  })

  describe('Session mismatch & ownership security guards', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('normalizes conversation object and formats userId to lowercase', () => {
      const conv = normalizeConversation({
        id: 'conv-99',
        user_id: 'USER-UUID-ABCD',
        title: 'Tư vấn tranh chấp đất',
      })

      expect(conv.id).toBe('conv-99')
      expect(conv.userId).toBe('user-uuid-abcd')
      expect(conv.title).toBe('Tư vấn tranh chấp đất')
    })

    it('throws ApiError and fires auth:session-mismatch when getConversations receives foreign user conversations', async () => {
      const activeUserId = '20000000-0000-0000-0000-000000000001'
      const foreignUserId = '99999999-9999-9999-9999-999999999999'

      const mismatchSpy = vi.fn()
      window.addEventListener('auth:session-mismatch', mismatchSpy)

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce([
        {
          id: 'conv-foreign-1',
          userId: foreignUserId,
          title: 'Hội thoại bí mật của người khác',
          createdAt: '2026-11-12T10:00:00Z',
        },
      ])

      await expect(chatApi.getConversations(activeUserId)).rejects.toThrow(ApiError)
      expect(mismatchSpy).toHaveBeenCalledTimes(1)

      // Ensure foreign data was NOT saved into active user's local storage
      const key = `tillegal_saved_conversations_${activeUserId}`
      expect(localStorage.getItem(key)).toBeNull()

      window.removeEventListener('auth:session-mismatch', mismatchSpy)
    })

    it('throws ApiError and fires auth:session-mismatch when createConversation creates under another user', async () => {
      const activeUserId = '20000000-0000-0000-0000-000000000001'
      const foreignUserId = '99999999-9999-9999-9999-999999999999'

      const mismatchSpy = vi.fn()
      window.addEventListener('auth:session-mismatch', mismatchSpy)

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        id: 'new-conv',
        userId: foreignUserId,
        title: 'Tạo dưới tài khoản khác',
      })

      await expect(
        chatApi.createConversation({ title: 'Test' }, activeUserId),
      ).rejects.toThrow(ApiError)
      expect(mismatchSpy).toHaveBeenCalledTimes(1)

      window.removeEventListener('auth:session-mismatch', mismatchSpy)
    })

    it('throws ApiError and fires auth:session-mismatch when getAttachments returns attachments of another user', async () => {
      const activeUserId = 'user-a'
      const foreignUserId = 'user-b'

      const mismatchSpy = vi.fn()
      window.addEventListener('auth:session-mismatch', mismatchSpy)

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce([
        {
          id: 'att-foreign',
          conversationId: 'c1',
          userId: foreignUserId,
          fileName: 'tai-lieu-bi-mat.pdf',
        },
      ])

      await expect(chatApi.getAttachments('c1', activeUserId)).rejects.toThrow(ApiError)
      expect(mismatchSpy).toHaveBeenCalledTimes(1)

      window.removeEventListener('auth:session-mismatch', mismatchSpy)
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

  describe('deduplicateMessages', () => {
    it('removes duplicate messages by id and duplicate user messages with the same content', () => {
      const msgs: ConversationMessage[] = [
        {
          id: 'temp-1',
          conversationId: 'c1',
          role: 'user',
          content: 'xử phạt vi phạm nồng độ cồn',
          createdAt: '2026-10-26T14:00:00Z',
        },
        {
          id: 'guid-1',
          conversationId: 'c1',
          role: 'user',
          content: 'xử phạt vi phạm nồng độ cồn',
          createdAt: '2026-10-26T14:00:01Z',
        },
        {
          id: 'guid-2',
          conversationId: 'c1',
          role: 'assistant',
          content: 'Khung 1 phạt 2-3 triệu',
          createdAt: '2026-10-26T14:00:02Z',
        },
      ]

      const deduplicated = deduplicateMessages(msgs)
      expect(deduplicated).toHaveLength(2)
      expect(deduplicated[0]?.role).toBe('user')
      expect(deduplicated[1]?.role).toBe('assistant')
    })
  })

  describe('Attachment helpers & API', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('validates file extension, empty size, and max size', () => {
      const validFile = new File(['abc'], 'hop-dong.pdf', { type: 'application/pdf' })
      expect(validateAttachmentFile(validFile)).toEqual({ valid: true })

      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' })
      expect(validateAttachmentFile(emptyFile).valid).toBe(false)

      const unsupportedFile = new File(['exe'], 'malware.exe')
      expect(validateAttachmentFile(unsupportedFile).valid).toBe(false)

      const hugeFile = {
        name: 'huge.pdf',
        size: MAX_ATTACHMENT_SIZE_BYTES + 1,
      } as File
      expect(validateAttachmentFile(hugeFile).valid).toBe(false)
    })

    it('formats file size and maps processing status metadata', () => {
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(2048)).toBe('2.0 KB')
      expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')

      expect(getAttachmentStatusMeta('Pending').isProcessing).toBe(true)
      expect(getAttachmentStatusMeta('Processing').isProcessing).toBe(true)
      expect(getAttachmentStatusMeta('Completed').label).toBe('Sẵn sàng')
      expect(getAttachmentStatusMeta('Failed').tone).toBe('failed')
    })

    it('formats attachment upload error messages for duplicate, signature, and limit errors', () => {
      const dupError = new ApiError('Duplicate', 400, {
        code: 'DUPLICATE_FILE',
        detail: 'This file has already been uploaded to this conversation.',
      })
      expect(formatAttachmentErrorMessage(dupError, 'doc.pdf')).toContain(
        'đã được tải lên',
      )

      const sigError = new ApiError('Invalid', 400, {
        code: 'INVALID_FILE_SIGNATURE',
        detail:
          'File signature does not match the file extension or file content is invalid.',
      })
      expect(formatAttachmentErrorMessage(sigError, 'bad.pdf')).toContain(
        'không hợp lệ hoặc không khớp',
      )

      const limitError = new ApiError('Limit', 400, {
        code: 'ATTACHMENT_LIMIT_EXCEEDED',
        detail: 'A conversation can have at most 5 attachments.',
      })
      expect(formatAttachmentErrorMessage(limitError)).toContain(
        'đạt giới hạn tối đa 5 tài liệu',
      )

      const sizeError = new ApiError('Too large', 413)
      expect(formatAttachmentErrorMessage(sizeError, 'large.pdf')).toContain(
        'vượt quá dung lượng tối đa 20 MB',
      )
    })

    it('normalizes attachment payload and calls attachment endpoints', async () => {
      const normalized = normalizeAttachment({
        id: 'att-1',
        conversation_id: 'conv-1',
        user_id: 'user-1',
        file_name: 'nghi-dinh.pdf',
        file_size: 4096,
        content_type: 'application/pdf',
        processing_status: 'Completed',
        token_count: 1500,
        file_hash: 'sha256-xyz',
        created_at: '2026-11-12T10:00:00Z',
        updated_at: null,
      })

      expect(normalized.id).toBe('att-1')
      expect(normalized.fileName).toBe('nghi-dinh.pdf')
      expect(normalized.tokenCount).toBe(1500)

      const postFormSpy = vi
        .spyOn(apiClient, 'postForm')
        .mockResolvedValueOnce(normalized)
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce([normalized])
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined)

      const file = new File(['content'], 'nghi-dinh.pdf', { type: 'application/pdf' })
      const uploaded = await chatApi.uploadAttachment('conv-1', file)
      expect(uploaded.id).toBe('att-1')
      expect(postFormSpy).toHaveBeenCalledWith(
        '/conversations/conv-1/attachments',
        expect.any(FormData),
        undefined,
      )

      const list = await chatApi.getAttachments('conv-1')
      expect(list).toHaveLength(1)
      expect(getSpy).toHaveBeenCalledWith('/conversations/conv-1/attachments')

      await chatApi.deleteAttachment('conv-1', 'att-1')
      expect(deleteSpy).toHaveBeenCalledWith('/conversations/conv-1/attachments/att-1')
    })
  })

  describe('AttachmentDrawer & ChatInput attachments UI', () => {
    const sampleAttachments: ConversationAttachment[] = [
      {
        id: 'att-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        fileName: 'Hop-dong-lao-dong.pdf',
        fileSize: 204800,
        contentType: 'application/pdf',
        processingStatus: 'Completed',
        tokenCount: 1240,
        fileHash: 'abc123def456',
        createdAt: '2026-11-12T10:00:00Z',
        updatedAt: '2026-11-12T10:01:00Z',
      },
      {
        id: 'att-2',
        conversationId: 'conv-1',
        userId: 'user-1',
        fileName: 'Phu-luc-01.docx',
        fileSize: 51200,
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        processingStatus: 'Processing',
        tokenCount: null,
        fileHash: null,
        createdAt: '2026-11-12T10:05:00Z',
        updatedAt: null,
      },
    ]

    it('renders attachments, filters by search, expands system metadata, and triggers callbacks', () => {
      const onUploadFiles = vi.fn()
      const onDelete = vi.fn()
      const onDownload = vi.fn()

      render(
        <AttachmentDrawer
          open
          onOpenChange={vi.fn()}
          attachments={sampleAttachments}
          isLoading={false}
          uploadTasks={[
            {
              tempId: 'tmp-1',
              fileName: 'Bien-ban.pdf',
              fileSize: 10240,
              progress: 45,
              status: 'uploading',
            },
          ]}
          onUploadFiles={onUploadFiles}
          onDelete={onDelete}
          onDownload={onDownload}
        />,
      )

      expect(screen.getByText('Hop-dong-lao-dong.pdf')).toBeInTheDocument()
      expect(screen.getByText('Phu-luc-01.docx')).toBeInTheDocument()
      expect(screen.getByText('Bien-ban.pdf')).toBeInTheDocument()

      // Expand metadata of first attachment
      const metadataButtons = screen.getAllByRole('button', {
        name: /Metadata hệ thống/i,
      })
      fireEvent.click(metadataButtons[0]!)
      expect(screen.getByText('abc123def456')).toBeInTheDocument()

      // Search filters list
      const searchInput = screen.getByLabelText('Tìm kiếm tài liệu')
      fireEvent.change(searchInput, { target: { value: 'Hop-dong' } })
      expect(screen.getByText('Hop-dong-lao-dong.pdf')).toBeInTheDocument()
      expect(screen.queryByText('Phu-luc-01.docx')).not.toBeInTheDocument()

      // Download & delete actions
      fireEvent.click(screen.getByRole('button', { name: /Tải về/i }))
      expect(onDownload).toHaveBeenCalledWith(sampleAttachments[0])

      fireEvent.click(
        screen.getByRole('button', { name: /Xóa tài liệu Hop-dong-lao-dong\.pdf/i }),
      )
      expect(onDelete).toHaveBeenCalledWith('att-1')

      // Upload via file input
      const fileInput = screen.getByLabelText('Chọn tệp tài liệu tải lên')
      const testFile = new File(['hello'], 'new-doc.pdf', { type: 'application/pdf' })
      fireEvent.change(fileInput, { target: { files: [testFile] } })
      expect(onUploadFiles).toHaveBeenCalledTimes(1)
    })

    it('renders attachment chips and attach button in ChatInput', () => {
      const onSend = vi.fn()
      const onUploadFiles = vi.fn()
      const onDeleteAttachment = vi.fn()
      const onOpenAttachments = vi.fn()

      render(
        <ChatInput
          onSend={onSend}
          attachments={[sampleAttachments[0]!]}
          onUploadFiles={onUploadFiles}
          onDeleteAttachment={onDeleteAttachment}
          onOpenAttachments={onOpenAttachments}
        />,
      )

      expect(screen.getByText('Hop-dong-lao-dong.pdf')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Đính kèm/i })).toBeInTheDocument()

      fireEvent.click(
        screen.getByRole('button', { name: /Gỡ tài liệu Hop-dong-lao-dong\.pdf/i }),
      )
      expect(onDeleteAttachment).toHaveBeenCalledWith('att-1')

      const fileInput = screen.getByLabelText('Đính kèm tài liệu')
      const testFile = new File(['abc'], 'van-ban.txt', { type: 'text/plain' })
      fireEvent.change(fileInput, { target: { files: [testFile] } })
      expect(onUploadFiles).toHaveBeenCalledTimes(1)
    })

    it('renders all 5 attachments inside scrollable drawer and clears failed upload tasks', () => {
      const fiveAttachments: ConversationAttachment[] = Array.from(
        { length: 5 },
        (_, i) => ({
          id: `att-${i + 1}`,
          conversationId: 'conv-1',
          userId: 'user-1',
          fileName: `Tai-lieu-${i + 1}.pdf`,
          fileSize: 1024 * (i + 1),
          contentType: 'application/pdf',
          processingStatus: 'Completed',
          tokenCount: 100 * (i + 1),
          fileHash: `hash-${i + 1}`,
          createdAt: '2026-11-12T10:00:00Z',
          updatedAt: null,
        }),
      )
      const onClearFailedUploadTasks = vi.fn()

      render(
        <AttachmentDrawer
          open
          onOpenChange={vi.fn()}
          attachments={fiveAttachments}
          isLoading={false}
          uploadTasks={[
            {
              tempId: 'err-1',
              fileName: 'Loi.png',
              fileSize: 500,
              progress: 0,
              status: 'error',
              error: 'A conversation can have at most 5 attachments.',
            },
          ]}
          onUploadFiles={vi.fn()}
          onDelete={vi.fn()}
          onDownload={vi.fn()}
          onClearFailedUploadTasks={onClearFailedUploadTasks}
        />,
      )

      for (let i = 1; i <= 5; i += 1) {
        expect(screen.getByText(`Tai-lieu-${i}.pdf`)).toBeInTheDocument()
      }

      const clearBtn = screen.getByRole('button', { name: /Xóa thông báo lỗi/i })
      fireEvent.click(clearBtn)
      expect(onClearFailedUploadTasks).toHaveBeenCalledTimes(1)
    })

    it('renders dedicated Quản lý tài liệu button below Cuộc trò chuyện mới in ChatSidebar', () => {
      const onOpenAttachments = vi.fn()

      render(
        <MemoryRouter>
          <ChatSidebar
            conversations={[]}
            activeId={null}
            onSelect={vi.fn()}
            onNewChat={vi.fn()}
            onDelete={vi.fn()}
            onOpenAttachments={onOpenAttachments}
            attachmentsCount={5}
          />
        </MemoryRouter>,
      )

      const newChatBtn = screen.getByRole('button', { name: /Cuộc trò chuyện mới/i })
      const manageDocsBtn = screen.getByRole('button', { name: /Quản lý tài liệu/i })
      expect(newChatBtn).toBeInTheDocument()
      expect(manageDocsBtn).toBeInTheDocument()
      expect(manageDocsBtn).toHaveTextContent('5')

      fireEvent.click(manageDocsBtn)
      expect(onOpenAttachments).toHaveBeenCalledTimes(1)
    })
  })
})
