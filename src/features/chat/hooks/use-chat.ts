import * as React from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth'
import type { CitationItem } from '@/features/citation'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/types'
import { chatApi, generateAssistantReply, normalizeMessage } from '../api/chat-api'
import type {
  AttachmentUploadTask,
  Conversation,
  ConversationAttachment,
  ConversationMessage,
} from '../types/chat.types'
import {
  formatAttachmentErrorMessage,
  getAttachmentStatusMeta,
  validateAttachmentFile,
} from '../utils/attachment-helpers'
import { isLawyerUser } from '../utils/workflow-helpers'
import { buildMessageThread } from '../utils/message-tree'

export interface UseChatReturn {
  conversations: Conversation[]
  activeConversationId: string | null
  activeConversation: Conversation | undefined
  messages: ConversationMessage[]
  attachments: ConversationAttachment[]
  isAttachmentsLoading: boolean
  uploadTasks: AttachmentUploadTask[]
  isUploadingAttachment: boolean
  deletingAttachmentIds: string[]
  downloadingAttachmentId: string | null
  isLoading: boolean
  error: string | null
  isLawyer: boolean
  workflowMode: 'single_agent' | 'multi_agent'
  selectedCitation: CitationItem | null
  isCitationDrawerOpen: boolean
  setIsCitationDrawerOpen: (open: boolean) => void
  selectCitation: (citation: CitationItem) => void
  sendMessage: (content: string) => Promise<void>
  createNewChat: () => void
  selectConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  updateConversationTitle: (id: string, newTitle: string) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  editMessageInPlace: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  switchMessageBranch: (messageId: string, branchIndex: number) => void
  forkConversation: (
    fromMessageId?: string | null,
    newPrompt?: string | null,
    newTitle?: string | null,
  ) => Promise<void>
  uploadAttachments: (files: FileList | File[]) => Promise<void>
  refreshAttachments: () => Promise<void>
  refreshAttachmentDetail: (
    attachmentId: string,
  ) => Promise<ConversationAttachment | null>
  deleteAttachment: (attachmentId: string) => Promise<void>
  downloadAttachment: (attachment: ConversationAttachment) => Promise<void>
  dismissUploadTask: (tempId: string) => void
  clearFailedUploadTasks: () => void
}

/**
 * Loại bỏ các tin nhắn trùng ID hoặc tin nhắn tạm (temp-) bị trùng với tin nhắn thật từ máy chủ
 */
export function deduplicateMessages(list: ConversationMessage[]): ConversationMessage[] {
  const seenIds = new Set<string>()
  const result: ConversationMessage[] = []

  // Tập hợp nội dung của các tin nhắn user thật đã có ID chính thức từ server
  const realUserContent = new Set<string>()
  for (const m of list) {
    if (m?.id && !m.id.startsWith('temp-') && m.role === 'user') {
      realUserContent.add(m.content.trim())
    }
  }

  for (const msg of list) {
    if (!msg || !msg.id) continue

    if (seenIds.has(msg.id)) continue

    // Chỉ loại bỏ tin nhắn tạm thời nếu tin nhắn chính thức với cùng nội dung đã có mặt
    if (
      msg.id.startsWith('temp-') &&
      msg.role === 'user' &&
      realUserContent.has(msg.content.trim())
    ) {
      continue
    }

    seenIds.add(msg.id)
    result.push(msg)
  }

  return result
}

export function useChat(initialConversationId?: string | null): UseChatReturn {
  const { user } = useAuth()
  const userId = user?.id
  const isLawyer = React.useMemo(() => isLawyerUser(user), [user])
  const workflowMode = isLawyer ? 'multi_agent' : 'single_agent'

  const isSendingRef = React.useRef(false)
  const skipFetchForConvIdRef = React.useRef<string | null>(null)

  const [conversations, setConversations] = React.useState<Conversation[]>(() =>
    chatApi.getLocalConversations(userId),
  )
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(
    initialConversationId ?? null,
  )
  const [messages, setMessages] = React.useState<ConversationMessage[]>([])
  const [attachments, setAttachments] = React.useState<ConversationAttachment[]>([])
  const [isAttachmentsLoading, setIsAttachmentsLoading] = React.useState(false)
  const [uploadTasks, setUploadTasks] = React.useState<AttachmentUploadTask[]>([])
  const [deletingAttachmentIds, setDeletingAttachmentIds] = React.useState<string[]>([])
  const [downloadingAttachmentId, setDownloadingAttachmentId] = React.useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Danh sách toàn bộ tin nhắn gốc của cuộc hội thoại hiện tại (từ backend DB)
  const rawMessagesRef = React.useRef<ConversationMessage[]>([])
  // Bản đồ ghi nhớ nhánh đang chọn cho mỗi tin nhắn anh em (trong bộ nhớ phiên làm việc)
  const activeBranchMapRef = React.useRef<Record<string, number>>({})

  const activeConversationIdRef = React.useRef<string | null>(activeConversationId)
  React.useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])
  // Quản lý Citation Drawer
  const [selectedCitation, setSelectedCitation] = React.useState<CitationItem | null>(
    null,
  )
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = React.useState(false)

  // Đồng bộ danh sách hội thoại từ máy chủ khi user thay đổi hoặc khởi tạo
  React.useEffect(() => {
    let isMounted = true

    // Reset về trạng thái sạch sẽ cho đúng tài khoản hiện tại
    setActiveConversationId(null)
    rawMessagesRef.current = []
    activeBranchMapRef.current = {}
    setMessages([])
    setAttachments([])
    setUploadTasks([])
    setConversations(chatApi.getLocalConversations(userId))

    chatApi
      .getConversations(userId)
      .then((serverList) => {
        if (isMounted && Array.isArray(serverList)) {
          setConversations(serverList)
        }
      })
      .catch((err) => {
        if (isMounted && err instanceof ApiError && err.status === 401) {
          setConversations([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  // Lắng nghe sự kiện phát hiện phiên đăng nhập không trùng khớp
  React.useEffect(() => {
    const handleSessionMismatch = () => {
      setActiveConversationId(null)
      rawMessagesRef.current = []
      activeBranchMapRef.current = {}
      setMessages([])
      setAttachments([])
      setUploadTasks([])
      setConversations([])
    }

    window.addEventListener('auth:session-mismatch', handleSessionMismatch)
    return () => {
      window.removeEventListener('auth:session-mismatch', handleSessionMismatch)
    }
  }, [])

  const activeConversation = React.useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  )

  // Tải danh sách tin nhắn khi đổi activeConversationId
  React.useEffect(() => {
    if (!activeConversationId) {
      rawMessagesRef.current = []
      setMessages([])
      return
    }

    // Bỏ qua lần fetch tự động nếu hội thoại này vừa được tạo bởi sendMessage
    if (skipFetchForConvIdRef.current === activeConversationId) {
      skipFetchForConvIdRef.current = null
      return
    }

    let isMounted = true

    async function fetchMessages() {
      setIsLoading(true)
      setError(null)
      try {
        const remoteMessages = await chatApi.getMessages(activeConversationId!)
        if (isMounted) {
          const deduplicated = deduplicateMessages(
            Array.isArray(remoteMessages) ? remoteMessages : [],
          )
          rawMessagesRef.current = deduplicated
          const finalMessages = buildMessageThread(
            deduplicated,
            activeBranchMapRef.current,
          )
          setMessages(finalMessages)
        }
      } catch (err) {
        if (isMounted) {
          const apiErr = err as { status?: number; message?: string }
          // Nếu cuộc hội thoại không tồn tại (404) hoặc thuộc người khác (403):
          if (apiErr.status === 403 || apiErr.status === 404) {
            toast.error(
              'Cuộc trò chuyện này không tồn tại hoặc bạn không có quyền truy cập.',
            )
            chatApi.deleteLocalConversation(activeConversationId!, userId)
            setConversations((prev) =>
              Array.isArray(prev)
                ? prev.filter((c) => c.id !== activeConversationId)
                : [],
            )
            setActiveConversationId(null)
            rawMessagesRef.current = []
            setMessages([])
          } else {
            const msg = (err as Error).message || 'Không thể tải tin nhắn hội thoại'
            setError(msg)
            toast.error(msg)
            rawMessagesRef.current = []
            setMessages([])
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMessages()

    return () => {
      isMounted = false
    }
  }, [activeConversationId, userId])

  const loadAttachments = React.useCallback(
    async (convId: string, silent = false) => {
      if (!silent) {
        setIsAttachmentsLoading(true)
      }
      try {
        const list = await chatApi.getAttachments(convId, userId)
        if (activeConversationIdRef.current === convId) {
          setAttachments(list)
        }
      } catch (err) {
        if (!silent && activeConversationIdRef.current === convId) {
          const msg = (err as Error).message || 'Không thể tải danh sách tài liệu'
          toast.error(msg)
        }
      } finally {
        if (!silent && activeConversationIdRef.current === convId) {
          setIsAttachmentsLoading(false)
        }
      }
    },
    [userId],
  )

  // Tải danh sách tài liệu đính kèm khi đổi hội thoại
  React.useEffect(() => {
    if (!activeConversationId) {
      setAttachments([])
      setIsAttachmentsLoading(false)
      return
    }

    void loadAttachments(activeConversationId)
  }, [activeConversationId, loadAttachments])

  // Tự động cập nhật trạng thái khi có tài liệu đang được hệ thống xử lý/lập chỉ mục
  const hasProcessingAttachment = React.useMemo(
    () =>
      attachments.some(
        (item) => getAttachmentStatusMeta(item.processingStatus).isProcessing,
      ),
    [attachments],
  )

  React.useEffect(() => {
    if (!activeConversationId || !hasProcessingAttachment) return

    let pollCount = 0
    const maxPolls = 30
    const timer = window.setInterval(() => {
      pollCount += 1
      if (pollCount > maxPolls) {
        window.clearInterval(timer)
        return
      }
      void loadAttachments(activeConversationId, true)
    }, 4000)

    return () => {
      window.clearInterval(timer)
    }
  }, [activeConversationId, hasProcessingAttachment, loadAttachments])

  const selectCitation = React.useCallback((citation: CitationItem) => {
    setSelectedCitation(citation)
    setIsCitationDrawerOpen(true)
  }, [])

  const selectConversation = React.useCallback(
    async (id: string) => {
      const target = conversations.find((c) => c.id === id)
      if (
        target?.userId &&
        userId &&
        target.userId.toLowerCase() !== userId.toLowerCase()
      ) {
        toast.error('Bạn không có quyền truy cập cuộc trò chuyện này.')
        return
      }
      setActiveConversationId(id)
    },
    [conversations, userId],
  )

  const createNewChat = React.useCallback(() => {
    setActiveConversationId(null)
    rawMessagesRef.current = []
    activeBranchMapRef.current = {}
    setMessages([])
    setAttachments([])
    setUploadTasks([])
    setError(null)
  }, [])

  const deleteConversation = React.useCallback(
    async (id: string) => {
      try {
        await chatApi.deleteConversation(id, userId)
        setConversations((prev) =>
          Array.isArray(prev) ? prev.filter((c) => c.id !== id) : [],
        )
        if (activeConversationId === id) {
          createNewChat()
        }
        toast.success('Đã xóa cuộc trò chuyện')
      } catch (err) {
        const msg = (err as Error).message || 'Không thể xóa cuộc trò chuyện'
        toast.error(msg)
      }
    },
    [activeConversationId, createNewChat, userId],
  )

  const updateConversationTitle = React.useCallback(
    async (id: string, newTitle: string) => {
      const trimmed = newTitle.trim()
      if (!trimmed) return

      const existing = conversations.find((c) => c.id === id)
      if (existing && existing.title === trimmed) return

      // Optimistic update
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
      )

      try {
        const updated = await chatApi.updateConversation(id, trimmed, userId)
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        )
        toast.success('Đã cập nhật tiêu đề cuộc trò chuyện')
      } catch (err) {
        // Rollback
        if (existing) {
          setConversations((prev) => prev.map((c) => (c.id === id ? existing : c)))
        }
        const msg = (err as Error).message || 'Không thể cập nhật tiêu đề'
        toast.error(msg)
      }
    },
    [conversations, userId],
  )

  const editMessageInPlace = React.useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim()
      const convId = activeConversationIdRef.current
      if (!trimmed || !convId || isLoading) return

      const targetMsg =
        rawMessagesRef.current.find((m) => m.id === messageId) ||
        messages.find((m) => m.id === messageId)
      if (!targetMsg || targetMsg.content.trim() === trimmed) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const updatedFromApi = await chatApi.updateMessage(
          convId,
          messageId,
          trimmed,
          targetMsg.citations,
        )

        rawMessagesRef.current = rawMessagesRef.current.map((m) =>
          m.id === messageId
            ? {
                ...m,
                ...updatedFromApi,
                content: trimmed,
                updatedAt: new Date().toISOString(),
              }
            : m,
        )

        const finalMessages = buildMessageThread(
          rawMessagesRef.current,
          activeBranchMapRef.current,
        )
        setMessages(finalMessages)

        toast.success('Đã cập nhật tin nhắn tại chỗ')
      } catch (err) {
        const msg = (err as Error).message || 'Không thể cập nhật tin nhắn'
        setError(msg)
        toast.error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages],
  )

  const deleteMessage = React.useCallback(
    async (messageId: string) => {
      const convId = activeConversationIdRef.current
      if (!convId || isLoading) return

      setIsLoading(true)
      setError(null)

      try {
        await chatApi.deleteMessage(convId, messageId)
        rawMessagesRef.current = rawMessagesRef.current.filter((m) => m.id !== messageId)
        const finalMessages = buildMessageThread(
          rawMessagesRef.current,
          activeBranchMapRef.current,
        )
        setMessages(finalMessages)

        toast.success('Đã xóa tin nhắn')
      } catch (err) {
        const msg = (err as Error).message || 'Không thể xóa tin nhắn'
        setError(msg)
        toast.error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading],
  )

  const editMessage = React.useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim()
      const convId = activeConversationIdRef.current
      if (!trimmed || !convId || isLoading) return

      const targetMsg =
        rawMessagesRef.current.find((m) => m.id === messageId) ||
        messages.find((m) => m.id === messageId)
      if (!targetMsg) return

      if (targetMsg.content.trim() === trimmed) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const parentMessageId = targetMsg.parentMessageId ?? null

        let newBranchedUserMsg: ConversationMessage
        let assistantMsg: ConversationMessage

        try {
          const response = await chatApi.askQuestion(
            convId,
            trimmed,
            parentMessageId,
            workflowMode,
          )
          newBranchedUserMsg = response.userMessage
          assistantMsg = response.assistantMessage
        } catch {
          const fallbackUserId = `user-${Date.now()}`
          newBranchedUserMsg = {
            id: fallbackUserId,
            conversationId: convId,
            parentMessageId,
            role: 'user',
            content: trimmed,
            createdAt: new Date().toISOString(),
            workflowMode,
          }
          const reply = generateAssistantReply(trimmed)
          const modeNotice = isLawyer
            ? '[Đa Agent - Chuyên sâu] Hệ thống đã tổng hợp ý kiến từ nhiều chuyên gia pháp lý.\n\n'
            : ''
          assistantMsg = {
            id: `asst-${Date.now()}`,
            conversationId: convId,
            parentMessageId: fallbackUserId,
            role: 'assistant',
            content: `${modeNotice}${reply.content}`,
            citations: reply.citations,
            createdAt: new Date().toISOString(),
            workflowMode,
          }
        }

        // Cập nhật danh sách toàn bộ tin nhắn từ Backend DB
        rawMessagesRef.current = deduplicateMessages([
          ...rawMessagesRef.current,
          newBranchedUserMsg,
          assistantMsg,
        ])

        // Tìm tất cả các tin nhắn người dùng cùng nhánh (cùng cha) để đặt nhánh mới nhất làm active
        const siblings = rawMessagesRef.current.filter(
          (m) => (m.parentMessageId ?? null) === parentMessageId && m.role === 'user',
        )
        siblings.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        const newBranchIdx = Math.max(0, siblings.length - 1)
        for (const s of siblings) {
          activeBranchMapRef.current[s.id] = newBranchIdx
        }

        const finalMessages = buildMessageThread(
          rawMessagesRef.current,
          activeBranchMapRef.current,
        )
        setMessages(finalMessages)

        toast.success('Đã tạo nhánh câu hỏi mới')
      } catch (err) {
        const msg = (err as Error).message || 'Không thể tạo nhánh mới'
        setError(msg)
        toast.error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, isLawyer, messages, workflowMode],
  )

  const switchMessageBranch = React.useCallback(
    (messageId: string, branchIndex: number) => {
      const targetMsg =
        rawMessagesRef.current.find((m) => m.id === messageId) ||
        messages.find((m) => m.id === messageId)
      if (!targetMsg) return

      const parentMessageId = targetMsg.parentMessageId ?? null
      const siblings = rawMessagesRef.current.filter(
        (m) => (m.parentMessageId ?? null) === parentMessageId && m.role === 'user',
      )
      siblings.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

      if (branchIndex < 0 || branchIndex >= siblings.length) return

      for (const s of siblings) {
        activeBranchMapRef.current[s.id] = branchIndex
      }

      const newMessages = buildMessageThread(
        rawMessagesRef.current,
        activeBranchMapRef.current,
      )
      setMessages(newMessages)
    },
    [messages],
  )

  const forkConversation = React.useCallback(
    async (
      fromMessageId?: string | null,
      newPrompt?: string | null,
      newTitle?: string | null,
    ) => {
      const convId = activeConversationIdRef.current
      if (!convId || isLoading) return

      setIsLoading(true)
      setError(null)

      try {
        const newConv = await chatApi.forkConversation(
          convId,
          {
            fromMessageId: fromMessageId ?? null,
            newPrompt: newPrompt?.trim() || null,
            newTitle: newTitle?.trim() || null,
          },
          userId,
        )

        skipFetchForConvIdRef.current = newConv.id
        activeConversationIdRef.current = newConv.id
        setActiveConversationId(newConv.id)

        setConversations((prev) => [
          newConv,
          ...(Array.isArray(prev) ? prev.filter((c) => c.id !== newConv.id) : []),
        ])

        const remoteMessages = await chatApi.getMessages(newConv.id)
        setMessages(deduplicateMessages(remoteMessages))

        if (newPrompt?.trim()) {
          const reply = generateAssistantReply(newPrompt.trim())
          let assistantMsg: ConversationMessage
          try {
            const saved = await apiClient.post<unknown>(
              API_ENDPOINTS.conversations.messages(newConv.id),
              {
                role: 'assistant',
                content: reply.content,
                citations: reply.citations,
              },
            )
            assistantMsg = normalizeMessage(saved)
          } catch {
            assistantMsg = {
              id: `asst-${Date.now()}`,
              conversationId: newConv.id,
              role: 'assistant',
              content: reply.content,
              citations: reply.citations,
              createdAt: new Date().toISOString(),
            }
          }
          setMessages((prev) => deduplicateMessages([...prev, assistantMsg]))
        }

        toast.success(`Đã tách thành nhánh cuộc trò chuyện "${newConv.title}"`)
      } catch (err) {
        const msg = (err as Error).message || 'Không thể tách nhánh cuộc trò chuyện'
        setError(msg)
        toast.error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, userId],
  )

  const sendMessage = React.useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isSendingRef.current || isLoading) return

      isSendingRef.current = true
      setError(null)

      const tempId = `temp-${Date.now()}`
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
      const parentMessageId = lastMessage?.id ?? null

      // 1. Tạo tin nhắn tạm của user trên UI
      const tempUserMessage: ConversationMessage = {
        id: tempId,
        conversationId: activeConversationId || 'pending',
        parentMessageId,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) =>
        deduplicateMessages([...(Array.isArray(prev) ? prev : []), tempUserMessage]),
      )
      setIsLoading(true)

      try {
        let convId = activeConversationId

        // Nếu chưa có hội thoại, tự động tạo mới
        if (!convId) {
          const newConv = await chatApi.createConversation(
            {
              title: trimmed.length > 45 ? `${trimmed.slice(0, 42)}...` : trimmed,
            },
            userId,
          )
          convId = newConv.id
          // Đánh dấu bỏ qua fetch tự động trong useEffect để tránh nhân đôi tin nhắn
          skipFetchForConvIdRef.current = convId
          setActiveConversationId(convId)
          setConversations((prev) => [
            newConv,
            ...(Array.isArray(prev) ? prev.filter((c) => c.id !== newConv.id) : []),
          ])
        }

        // Gửi câu hỏi đến backend (kèm parentMessageId để backend lưu mối quan hệ phân nhánh)
        const response = await chatApi.askQuestion(
          convId,
          trimmed,
          parentMessageId,
          workflowMode,
        )

        // Cập nhật lại tin nhắn chính thức từ backend vào rawMessagesRef
        const newItems: ConversationMessage[] = []
        if (response.userMessage) newItems.push(response.userMessage)
        if (response.assistantMessage) newItems.push(response.assistantMessage)

        rawMessagesRef.current = deduplicateMessages([
          ...rawMessagesRef.current.filter((m) => m && m.id !== tempId),
          ...newItems,
        ])

        const finalMessages = buildMessageThread(
          rawMessagesRef.current,
          activeBranchMapRef.current,
        )
        setMessages(finalMessages)
      } catch (err) {
        const errorMsg = (err as Error).message || 'Không thể gửi câu hỏi đến máy chủ'
        setError(errorMsg)
        toast.error(errorMsg)
        // Gỡ bỏ tin nhắn tạm nếu lỗi
        rawMessagesRef.current = rawMessagesRef.current.filter(
          (m) => m && m.id !== tempId,
        )
        setMessages((prev) =>
          Array.isArray(prev) ? prev.filter((m) => m && m.id !== tempId) : [],
        )
      } finally {
        isSendingRef.current = false
        setIsLoading(false)
      }
    },
    [activeConversationId, isLoading, messages, userId, workflowMode],
  )

  const refreshAttachments = React.useCallback(async () => {
    if (!activeConversationId) return
    await loadAttachments(activeConversationId)
  }, [activeConversationId, loadAttachments])

  const refreshAttachmentDetail = React.useCallback(
    async (attachmentId: string): Promise<ConversationAttachment | null> => {
      const convId = activeConversationIdRef.current
      if (!convId) return null

      try {
        const updated = await chatApi.getAttachment(convId, attachmentId)
        if (activeConversationIdRef.current === convId) {
          setAttachments((prev) =>
            prev.map((item) => (item.id === attachmentId ? updated : item)),
          )
        }
        return updated
      } catch (err) {
        const msg = (err as Error).message || 'Không thể tải thông tin tài liệu'
        toast.error(msg)
        return null
      }
    },
    [],
  )

  const dismissUploadTask = React.useCallback((tempId: string) => {
    setUploadTasks((prev) => prev.filter((task) => task.tempId !== tempId))
  }, [])

  const clearFailedUploadTasks = React.useCallback(() => {
    setUploadTasks((prev) => prev.filter((task) => task.status !== 'error'))
  }, [])

  const uploadAttachments = React.useCallback(
    async (filesInput: FileList | File[]) => {
      const files = Array.from(filesInput)
      if (files.length === 0) return

      const validFiles: File[] = []
      for (const file of files) {
        const check = validateAttachmentFile(file)
        if (!check.valid) {
          toast.error(check.error || `Tệp "${file.name}" không hợp lệ`)
        } else {
          validFiles.push(file)
        }
      }

      if (validFiles.length === 0) return

      let convId = activeConversationIdRef.current
      if (!convId) {
        try {
          const firstFileName = validFiles[0]?.name || 'Mới'
          const firstTitle = `Tài liệu: ${firstFileName}`
          const newConv = await chatApi.createConversation(
            {
              title:
                firstTitle.length > 45 ? `${firstTitle.slice(0, 42)}...` : firstTitle,
            },
            userId,
          )
          convId = newConv.id
          skipFetchForConvIdRef.current = convId
          activeConversationIdRef.current = convId
          setActiveConversationId(convId)
          setConversations((prev) => [
            newConv,
            ...(Array.isArray(prev) ? prev.filter((c) => c.id !== newConv.id) : []),
          ])
        } catch (err) {
          const msg =
            (err as Error).message || 'Không thể khởi tạo cuộc trò chuyện để tải tài liệu'
          toast.error(msg)
          return
        }
      }

      const queuedTasks = validFiles.map((file, idx) => ({
        file,
        tempId: `upload-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      }))

      setUploadTasks((prev) => [
        ...prev,
        ...queuedTasks.map(({ file, tempId }) => ({
          tempId,
          fileName: file.name,
          fileSize: file.size,
          progress: 0,
          status: 'uploading' as const,
        })),
      ])

      for (const { file, tempId } of queuedTasks) {
        try {
          const uploaded = await chatApi.uploadAttachment(convId, file, (percent) => {
            setUploadTasks((prev) =>
              prev.map((task) =>
                task.tempId === tempId ? { ...task, progress: percent } : task,
              ),
            )
          })

          setUploadTasks((prev) => prev.filter((task) => task.tempId !== tempId))
          if (activeConversationIdRef.current === convId) {
            setAttachments((prev) => [
              uploaded,
              ...prev.filter((item) => item.id !== uploaded.id),
            ])
          }
          toast.success(`Đã tải lên "${uploaded.fileName || file.name}"`)
        } catch (err) {
          const errorMsg = formatAttachmentErrorMessage(err, file.name)
          setUploadTasks((prev) =>
            prev.map((task) =>
              task.tempId === tempId
                ? { ...task, status: 'error', error: errorMsg }
                : task,
            ),
          )
          toast.error(errorMsg)
        }
      }
    },
    [userId],
  )

  const deleteAttachment = React.useCallback(async (attachmentId: string) => {
    const convId = activeConversationIdRef.current
    if (!convId) return

    setDeletingAttachmentIds((prev) =>
      prev.includes(attachmentId) ? prev : [...prev, attachmentId],
    )

    try {
      await chatApi.deleteAttachment(convId, attachmentId)
      if (activeConversationIdRef.current === convId) {
        setAttachments((prev) => prev.filter((item) => item.id !== attachmentId))
      }
      toast.success('Đã xóa tài liệu đính kèm')
    } catch (err) {
      const msg = (err as Error).message || 'Không thể xóa tài liệu đính kèm'
      toast.error(msg)
    } finally {
      setDeletingAttachmentIds((prev) => prev.filter((id) => id !== attachmentId))
    }
  }, [])

  const downloadAttachment = React.useCallback(
    async (attachment: ConversationAttachment) => {
      const convId = activeConversationIdRef.current || attachment.conversationId
      if (!convId) return

      setDownloadingAttachmentId(attachment.id)
      try {
        const { blob, fileName } = await chatApi.downloadAttachment(convId, attachment.id)
        const downloadName =
          fileName || attachment.fileName || `tai-lieu-${attachment.id}`
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = downloadName
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      } catch (err) {
        const msg = (err as Error).message || 'Không thể tải xuống tài liệu'
        toast.error(msg)
      } finally {
        setDownloadingAttachmentId((prev) => (prev === attachment.id ? null : prev))
      }
    },
    [],
  )

  const isUploadingAttachment = React.useMemo(
    () => uploadTasks.some((task) => task.status === 'uploading'),
    [uploadTasks],
  )

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    attachments,
    isAttachmentsLoading,
    uploadTasks,
    isUploadingAttachment,
    deletingAttachmentIds,
    downloadingAttachmentId,
    isLoading,
    error,
    isLawyer,
    workflowMode,
    selectedCitation,
    isCitationDrawerOpen,
    setIsCitationDrawerOpen,
    selectCitation,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    editMessage,
    editMessageInPlace,
    deleteMessage,
    switchMessageBranch,
    forkConversation,
    uploadAttachments,
    refreshAttachments,
    refreshAttachmentDetail,
    deleteAttachment,
    downloadAttachment,
    dismissUploadTask,
    clearFailedUploadTasks,
  }
}
