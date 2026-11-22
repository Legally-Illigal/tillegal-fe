import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
import { MessageItem } from './components/message-item'
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
import {
  isLawyerRole,
  isLawyerUser,
  isMultiAgentWorkflow,
} from './utils/workflow-helpers'
import { buildMessageThread } from './utils/message-tree'

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

    it('normalizes parentMessageId from parentMessageId and parent_message_id', () => {
      const msg1 = normalizeMessage({
        id: 'msg-1',
        parentMessageId: 'parent-uuid-1',
      })
      expect(msg1.parentMessageId).toBe('parent-uuid-1')

      const msg2 = normalizeMessage({
        id: 'msg-2',
        parent_message_id: 'parent-uuid-2',
      })
      expect(msg2.parentMessageId).toBe('parent-uuid-2')

      const msg3 = normalizeMessage({
        id: 'msg-3',
        parentMessageId: null,
      })
      expect(msg3.parentMessageId).toBeNull()
    })

    it('reconstructs active thread and branches using buildMessageThread based on parentMessageId', () => {
      const allMsgs: ConversationMessage[] = [
        {
          id: 'u1',
          conversationId: 'c1',
          parentMessageId: null,
          role: 'user',
          content: 'Câu hỏi 1',
          createdAt: '2026-11-15T01:00:00Z',
        },
        {
          id: 'a1',
          conversationId: 'c1',
          parentMessageId: 'u1',
          role: 'assistant',
          content: 'Trả lời 1',
          createdAt: '2026-11-15T01:01:00Z',
        },
        // Branch 1
        {
          id: 'u2-b1',
          conversationId: 'c1',
          parentMessageId: 'a1',
          role: 'user',
          content: 'Nhánh 1: Hỏi về thừa kế',
          createdAt: '2026-11-15T01:02:00Z',
        },
        {
          id: 'a2-b1',
          conversationId: 'c1',
          parentMessageId: 'u2-b1',
          role: 'assistant',
          content: 'Trả lời nhánh 1',
          createdAt: '2026-11-15T01:03:00Z',
        },
        // Branch 2
        {
          id: 'u2-b2',
          conversationId: 'c1',
          parentMessageId: 'a1',
          role: 'user',
          content: 'Nhánh 2: Hỏi về đất đai',
          createdAt: '2026-11-15T01:04:00Z',
        },
        {
          id: 'a2-b2',
          conversationId: 'c1',
          parentMessageId: 'u2-b2',
          role: 'assistant',
          content: 'Trả lời nhánh 2',
          createdAt: '2026-11-15T01:05:00Z',
        },
      ]

      // Default should pick the latest branch (index 1: Nhánh 2)
      const threadDefault = buildMessageThread(allMsgs, {})
      expect(threadDefault).toHaveLength(4)
      expect(threadDefault[2]?.id).toBe('u2-b2')
      expect(threadDefault[2]?.branches).toHaveLength(2)
      expect(threadDefault[2]?.activeBranchIndex).toBe(1)
      expect(threadDefault[3]?.id).toBe('a2-b2')

      // Selecting branch 0 (Nhánh 1)
      const threadBranch0 = buildMessageThread(allMsgs, { 'u2-b1': 0 })
      expect(threadBranch0).toHaveLength(4)
      expect(threadBranch0[2]?.id).toBe('u2-b1')
      expect(threadBranch0[2]?.branches).toHaveLength(2)
      expect(threadBranch0[2]?.activeBranchIndex).toBe(0)
      expect(threadBranch0[3]?.id).toBe('a2-b1')
    })

    it('switches between branches seamlessly across full message trees from backend', () => {
      const allMsgs: ConversationMessage[] = [
        {
          id: 'u1',
          conversationId: 'c1',
          parentMessageId: null,
          role: 'user',
          content: 'Câu hỏi 1',
          createdAt: '2026-11-15T01:00:00Z',
        },
        {
          id: 'a1',
          conversationId: 'c1',
          parentMessageId: 'u1',
          role: 'assistant',
          content: 'Trả lời 1',
          createdAt: '2026-11-15T01:01:00Z',
        },
        // Branch 1 of Q2
        {
          id: 'u2-b1',
          conversationId: 'c1',
          parentMessageId: 'a1',
          role: 'user',
          content: 'Câu hỏi 2 nhánh 1',
          createdAt: '2026-11-15T01:02:00Z',
        },
        {
          id: 'a2-b1',
          conversationId: 'c1',
          parentMessageId: 'u2-b1',
          role: 'assistant',
          content: 'Trả lời 2 nhánh 1',
          createdAt: '2026-11-15T01:03:00Z',
        },
        // Branch 2 of Q2
        {
          id: 'u2-b2',
          conversationId: 'c1',
          parentMessageId: 'a1',
          role: 'user',
          content: 'Câu hỏi 2 nhánh 2',
          createdAt: '2026-11-15T01:04:00Z',
        },
        {
          id: 'a2-b2',
          conversationId: 'c1',
          parentMessageId: 'u2-b2',
          role: 'assistant',
          content: 'Trả lời 2 nhánh 2',
          createdAt: '2026-11-15T01:05:00Z',
        },
      ]

      // By default without local storage, picks latest branch (index 1)
      const threadLatest = buildMessageThread(allMsgs)
      expect(threadLatest).toHaveLength(4)
      expect(threadLatest[2]?.id).toBe('u2-b2')
      expect(threadLatest[2]?.branches).toHaveLength(2)
      expect(threadLatest[2]?.activeBranchIndex).toBe(1)
      expect(threadLatest[3]?.id).toBe('a2-b2')

      // With active branch set to branch 0
      const threadBranch0 = buildMessageThread(allMsgs, { 'u2-b1': 0 })
      expect(threadBranch0).toHaveLength(4)
      expect(threadBranch0[2]?.id).toBe('u2-b1')
      expect(threadBranch0[2]?.branches).toHaveLength(2)
      expect(threadBranch0[2]?.activeBranchIndex).toBe(0)
      expect(threadBranch0[3]?.id).toBe('a2-b1')
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

  describe('Conversation & Message API endpoints (PUT / DELETE)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('updates conversation title via PUT and updates local storage', async () => {
      const mockPut = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Tiêu đề mới cập nhật',
        createdAt: '2026-11-12T10:00:00Z',
        updatedAt: '2026-11-12T10:10:00Z',
      })

      const updated = await chatApi.updateConversation(
        'conv-1',
        'Tiêu đề mới cập nhật',
        'user-1',
      )

      expect(mockPut).toHaveBeenCalledWith('/conversations/conv-1', {
        title: 'Tiêu đề mới cập nhật',
      })
      expect(updated.title).toBe('Tiêu đề mới cập nhật')

      const local = chatApi.getLocalConversations('user-1')
      expect(local.find((c) => c.id === 'conv-1')?.title).toBe('Tiêu đề mới cập nhật')
    })

    it('updates message content via PUT', async () => {
      const mockPut = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'Nội dung câu hỏi đã sửa',
        citations: null,
        createdAt: '2026-11-12T10:00:00Z',
        updatedAt: '2026-11-12T10:05:00Z',
      })

      const res = await chatApi.updateMessage(
        'conv-1',
        'msg-1',
        'Nội dung câu hỏi đã sửa',
      )

      expect(mockPut).toHaveBeenCalledWith('/conversations/conv-1/messages/msg-1', {
        content: 'Nội dung câu hỏi đã sửa',
        citations: null,
      })
      expect(res.content).toBe('Nội dung câu hỏi đã sửa')
      expect(res.updatedAt).toBe('2026-11-12T10:05:00Z')
    })

    it('deletes message via DELETE', async () => {
      const mockDelete = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined)

      await chatApi.deleteMessage('conv-1', 'msg-1')

      expect(mockDelete).toHaveBeenCalledWith('/conversations/conv-1/messages/msg-1')
    })

    it('forks conversation via POST /conversations/{id}/fork and saves to local storage', async () => {
      const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        id: 'conv-forked',
        userId: 'user-1',
        title: 'Nhánh mới',
        createdAt: '2026-11-12T10:15:00Z',
        updatedAt: null,
      })

      const forked = await chatApi.forkConversation(
        'conv-1',
        {
          fromMessageId: 'msg-1',
          newPrompt: 'Câu hỏi mới cho nhánh',
        },
        'user-1',
      )

      expect(mockPost).toHaveBeenCalledWith('/conversations/conv-1/fork', {
        fromMessageId: 'msg-1',
        newPrompt: 'Câu hỏi mới cho nhánh',
      })
      expect(forked.id).toBe('conv-forked')
      expect(forked.title).toBe('Nhánh mới')

      const local = chatApi.getLocalConversations('user-1')
      expect(local.find((c) => c.id === 'conv-forked')).toBeDefined()
    })
  })

  describe('ChatSidebar Rename & Delete Dialog UI', () => {
    it('supports inline title renaming and confirms deletion via Dialog', async () => {
      const onRename = vi.fn()
      const onDelete = vi.fn()
      const conversations: Conversation[] = [
        { id: 'c1', title: 'Hội thoại ban đầu', createdAt: '2026-11-12T10:00:00Z' },
      ]

      render(
        <MemoryRouter>
          <ChatSidebar
            conversations={conversations}
            activeId="c1"
            onSelect={vi.fn()}
            onNewChat={vi.fn()}
            onDelete={onDelete}
            onRename={onRename}
          />
        </MemoryRouter>,
      )

      // Click rename button
      const renameBtn = screen.getByRole('button', { name: /Sửa tiêu đề/i })
      fireEvent.click(renameBtn)

      // Input appears
      const input = screen.getByPlaceholderText('Tiêu đề cuộc trò chuyện...')
      expect(input).toHaveValue('Hội thoại ban đầu')
      fireEvent.change(input, { target: { value: 'Hội thoại đổi tên' } })

      // Save via Check button
      const saveBtn = screen.getByRole('button', { name: /Lưu tiêu đề/i })
      fireEvent.click(saveBtn)
      expect(onRename).toHaveBeenCalledWith('c1', 'Hội thoại đổi tên')

      // Click delete button -> Dialog opens
      const deleteBtn = screen.getByRole('button', { name: /Xóa hội thoại/i })
      fireEvent.click(deleteBtn)
      expect(
        screen.getByText(/Bạn có chắc chắn muốn xóa cuộc trò chuyện/i),
      ).toBeInTheDocument()

      // Confirm deletion
      const confirmDeleteBtn = screen.getByRole('button', { name: /Xác nhận xóa/i })
      fireEvent.click(confirmDeleteBtn)
      expect(onDelete).toHaveBeenCalledWith('c1')
    })
  })

  describe('MessageItem Editing & Branching Navigation UI', () => {
    it('renders edit button on user message, edits content, and navigates between branches', async () => {
      const onEditMessage = vi.fn().mockResolvedValue(undefined)
      const onEditInPlace = vi.fn().mockResolvedValue(undefined)
      const onSwitchBranch = vi.fn()

      const userMessage: ConversationMessage = {
        id: 'm1',
        conversationId: 'c1',
        role: 'user',
        content: 'Câu hỏi ban đầu',
        createdAt: '2026-11-12T10:00:00Z',
        branches: [
          { id: 'b0', content: 'Câu hỏi ban đầu' },
          { id: 'b1', content: 'Câu hỏi nhánh 2' },
        ],
        activeBranchIndex: 1,
      }

      render(
        <MessageItem
          message={userMessage}
          onEditMessage={onEditMessage}
          onEditInPlace={onEditInPlace}
          onSwitchBranch={onSwitchBranch}
        />,
      )

      // Shows branch indicator 2/2
      expect(screen.getByText('2/2')).toBeInTheDocument()

      // Confirm there is no delete message button
      expect(
        screen.queryByRole('button', { name: /Xóa tin nhắn/i }),
      ).not.toBeInTheDocument()

      // Click previous branch
      const prevBranchBtn = screen.getByRole('button', { name: /Nhánh trước/i })
      fireEvent.click(prevBranchBtn)
      expect(onSwitchBranch).toHaveBeenCalledWith('m1', 0)

      // Click edit button
      const editBtn = screen.getByRole('button', { name: /Sửa tin nhắn/i })
      fireEvent.click(editBtn)

      // Textarea appears
      const textarea = screen.getByPlaceholderText('Nhập nội dung chỉnh sửa...')
      expect(textarea).toHaveValue('Câu hỏi ban đầu')
      fireEvent.change(textarea, { target: { value: 'Câu hỏi sửa chính tả' } })

      // Click Sửa tại chỗ
      const saveInPlaceBtn = screen.getByRole('button', { name: /Sửa tại chỗ/i })
      fireEvent.click(saveInPlaceBtn)

      await waitFor(() => {
        expect(onEditInPlace).toHaveBeenCalledWith('m1', 'Câu hỏi sửa chính tả')
      })
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText('Nhập nội dung chỉnh sửa...'),
        ).not.toBeInTheDocument()
      })

      // Click edit again to test Tạo nhánh mới
      const editBtn2 = screen.getByRole('button', { name: /Sửa tin nhắn/i })
      fireEvent.click(editBtn2)

      const textarea2 = screen.getByPlaceholderText('Nhập nội dung chỉnh sửa...')
      fireEvent.change(textarea2, { target: { value: 'Câu hỏi nhánh 3 đã sửa' } })

      const saveBranchBtn = screen.getByRole('button', { name: /Tạo nhánh mới/i })
      fireEvent.click(saveBranchBtn)

      await waitFor(() => {
        expect(onEditMessage).toHaveBeenCalledWith('m1', 'Câu hỏi nhánh 3 đã sửa')
      })
    })
  })

  describe('Multi-Agent Role-Based AI Consultation for Lawyers', () => {
    it('detects lawyer roles correctly via isLawyerRole and isLawyerUser', () => {
      expect(isLawyerRole('Lawyer')).toBe(true)
      expect(isLawyerRole('lawyer')).toBe(true)
      expect(isLawyerRole('Lawer')).toBe(true)
      expect(isLawyerRole('User')).toBe(false)
      expect(isLawyerRole(null)).toBe(false)
      expect(isLawyerRole(undefined)).toBe(false)

      expect(isLawyerUser({ role: 'Lawyer' })).toBe(true)
      expect(isLawyerUser({ role: 'User' })).toBe(false)
      expect(isLawyerUser(null)).toBe(false)
    })

    it('detects multi-agent workflow correctly from message content, workflowMode, or lawyer user', () => {
      expect(
        isMultiAgentWorkflow(
          {
            id: 'm1',
            conversationId: 'c1',
            role: 'assistant',
            content: '[Đa Agent - Chuyên sâu] Hệ thống đã tổng hợp ý kiến...',
            createdAt: '',
          },
          null,
        ),
      ).toBe(true)

      expect(
        isMultiAgentWorkflow(
          {
            id: 'm2',
            conversationId: 'c1',
            role: 'assistant',
            content: 'Nội dung thông thường',
            createdAt: '',
            workflowMode: 'multi_agent',
          },
          null,
        ),
      ).toBe(true)

      expect(
        isMultiAgentWorkflow(
          {
            id: 'm3',
            conversationId: 'c1',
            role: 'assistant',
            content: 'Nội dung thông thường',
            createdAt: '',
          },
          { role: 'Lawyer' },
        ),
      ).toBe(true)

      expect(
        isMultiAgentWorkflow(
          {
            id: 'm4',
            conversationId: 'c1',
            role: 'assistant',
            content: 'Nội dung thông thường',
            createdAt: '',
          },
          { role: 'User' },
        ),
      ).toBe(false)
    })

    it('handles backend assistant MessageApiResponse directly without duplicate POST', async () => {
      const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        id: 'asst-backend-uuid',
        conversationId: 'conv-101',
        parentMessageId: 'user-backend-uuid',
        role: 'assistant',
        content: '[Đa Agent - Chuyên sâu] Phân tích từ Hội đồng chuyên gia pháp lý.',
        citations: [
          {
            id: 'cit-1',
            index: 1,
            documentTitle: 'Bộ luật Dân sự 2015',
          },
        ],
        createdAt: '2026-11-20T10:00:00Z',
      })

      const response = await chatApi.askQuestion(
        'conv-101',
        'Tôi cần tư vấn tranh chấp thương mại',
        null,
        'multi_agent',
      )

      // Exactly 1 POST call to send user question to backend
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith('/conversations/conv-101/messages', {
        role: 'user',
        content: 'Tôi cần tư vấn tranh chấp thương mại',
        workflowMode: 'multi_agent',
      })

      // Associated userMessage has the parent ID from backend and assistantMessage has the AI result
      expect(response.userMessage.id).toBe('user-backend-uuid')
      expect(response.userMessage.role).toBe('user')
      expect(response.userMessage.content).toBe('Tôi cần tư vấn tranh chấp thương mại')
      expect(response.assistantMessage.id).toBe('asst-backend-uuid')
      expect(response.assistantMessage.role).toBe('assistant')
      expect(response.assistantMessage.workflowMode).toBe('multi_agent')
      expect(response.assistantMessage.citations).toHaveLength(1)
    })

    it('renders lawyer-specific empty state and multi-agent loading state in MessageList', () => {
      // Empty state for Lawyer
      const { rerender } = render(
        <MessageList messages={[]} isLoading={false} isLawyer={true} />,
      )
      expect(
        screen.getByText('Chế độ Phân tích Chuyên sâu dành cho Luật sư'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Trợ lý AI Pháp luật Đa Tác tử (Multi-Agent)'),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Chiến lược phản biện & luận cứ tranh tụng/i),
      ).toBeInTheDocument()

      // Loading state for Lawyer
      rerender(<MessageList messages={[]} isLoading={true} isLawyer={true} />)
      expect(screen.getByText('Hệ thống Multi-Agent Luật sư')).toBeInTheDocument()
      expect(
        screen.getByText(/Agent 1: Rà soát & truy xuất văn bản quy phạm pháp luật/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Agent 2: Phân tích đa chiều, phản biện rủi ro/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Agent Tổng hợp: Kiểm chứng trích dẫn/i),
      ).toBeInTheDocument()
    })

    it('renders Multi-Agent badge and banner in MessageItem for lawyer messages', () => {
      const assistantMsg: ConversationMessage = {
        id: 'asst-1',
        conversationId: 'c1',
        role: 'assistant',
        content: 'Kết quả phân tích vụ án và căn cứ tố tụng.',
        createdAt: '2026-11-20T10:00:00Z',
      }

      render(<MessageItem message={assistantMsg} isLawyer={true} />)
      expect(screen.getByText('Trợ lý Tillegal AI (Multi-Agent)')).toBeInTheDocument()
      expect(screen.getByText('Đa tác tử')).toBeInTheDocument()
      expect(
        screen.getByText('Tư vấn phân tích đa chiều từ Hệ thống Multi-Agent Luật sư'),
      ).toBeInTheDocument()
    })

    it('renders lawyer-specific quick chips and placeholder in ChatInput', () => {
      render(<ChatInput onSend={vi.fn()} isLawyer={true} />)

      expect(screen.getByText('Phân tích rủi ro & đa góc nhìn')).toBeInTheDocument()
      expect(screen.getByText('Luận cứ tranh tụng & phản biện')).toBeInTheDocument()
      expect(screen.getByText('Thẩm định điều khoản & tiền lệ')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText(
          'Mô tả vụ việc, yêu cầu tư vấn chuyên sâu hoặc chiến lược tranh tụng...',
        ),
      ).toBeInTheDocument()
    })
  })
})
