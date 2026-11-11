import * as React from 'react'
import { toast } from 'sonner'
import type { CitationItem } from '@/features/citation'
import { chatApi } from '../api/chat-api'
import type { Conversation, ConversationMessage } from '../types/chat.types'

export interface UseChatReturn {
  conversations: Conversation[]
  activeConversationId: string | null
  activeConversation: Conversation | undefined
  messages: ConversationMessage[]
  isLoading: boolean
  error: string | null
  selectedCitation: CitationItem | null
  isCitationDrawerOpen: boolean
  setIsCitationDrawerOpen: (open: boolean) => void
  selectCitation: (citation: CitationItem) => void
  sendMessage: (content: string) => Promise<void>
  createNewChat: () => void
  selectConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => void
}

export function useChat(initialConversationId?: string | null): UseChatReturn {
  const [conversations, setConversations] = React.useState<Conversation[]>(() =>
    chatApi.getLocalConversations(),
  )
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(
    initialConversationId ?? null,
  )
  const [messages, setMessages] = React.useState<ConversationMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Quản lý Citation Drawer
  const [selectedCitation, setSelectedCitation] = React.useState<CitationItem | null>(
    null,
  )
  const [isCitationDrawerOpen, setIsCitationDrawerOpen] = React.useState(false)

  // Đồng bộ danh sách hội thoại từ máy chủ khi khởi tạo
  React.useEffect(() => {
    let isMounted = true

    chatApi
      .getConversations()
      .then((serverList) => {
        if (isMounted && Array.isArray(serverList) && serverList.length > 0) {
          setConversations(serverList)
        }
      })
      .catch(() => {
        // Fallback silently to local conversations
      })

    return () => {
      isMounted = false
    }
  }, [])

  const activeConversation = React.useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  )

  // Tải danh sách tin nhắn khi đổi activeConversationId
  React.useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    let isMounted = true

    async function fetchMessages() {
      setIsLoading(true)
      setError(null)
      try {
        const remoteMessages = await chatApi.getMessages(activeConversationId!)
        if (isMounted) {
          setMessages(Array.isArray(remoteMessages) ? remoteMessages : [])
        }
      } catch (err) {
        if (isMounted) {
          const msg = (err as Error).message || 'Không thể tải tin nhắn hội thoại'
          setError(msg)
          toast.error(msg)
          setMessages([])
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
  }, [activeConversationId])

  const selectCitation = React.useCallback((citation: CitationItem) => {
    setSelectedCitation(citation)
    setIsCitationDrawerOpen(true)
  }, [])

  const selectConversation = React.useCallback(async (id: string) => {
    setActiveConversationId(id)
  }, [])

  const createNewChat = React.useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
    setError(null)
  }, [])

  const deleteConversation = React.useCallback(
    async (id: string) => {
      await chatApi.deleteConversation(id)
      setConversations((prev) =>
        Array.isArray(prev) ? prev.filter((c) => c.id !== id) : [],
      )
      if (activeConversationId === id) {
        createNewChat()
      }
      toast.success('Đã xóa cuộc trò chuyện')
    },
    [activeConversationId, createNewChat],
  )

  const sendMessage = React.useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isLoading) return

      setError(null)

      const tempId = `temp-${Date.now()}`
      // 1. Tạo tin nhắn tạm của user trên UI
      const tempUserMessage: ConversationMessage = {
        id: tempId,
        conversationId: activeConversationId || 'pending',
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), tempUserMessage])
      setIsLoading(true)

      try {
        let convId = activeConversationId

        // Nếu chưa có hội thoại, tự động tạo mới
        if (!convId) {
          const newConv = await chatApi.createConversation({
            title: trimmed.length > 45 ? `${trimmed.slice(0, 42)}...` : trimmed,
          })
          convId = newConv.id
          setActiveConversationId(convId)
          setConversations((prev) => [
            newConv,
            ...(Array.isArray(prev) ? prev.filter((c) => c.id !== newConv.id) : []),
          ])
        }

        // Gửi câu hỏi đến backend
        const response = await chatApi.askQuestion(convId, trimmed)

        // Cập nhật lại tin nhắn chính thức từ backend
        setMessages((prev) => {
          const current = (Array.isArray(prev) ? prev : []).filter(
            (m) => m && m.id !== tempId,
          )
          const newItems: ConversationMessage[] = []
          if (response.userMessage) newItems.push(response.userMessage)
          if (response.assistantMessage) newItems.push(response.assistantMessage)
          return [...current, ...newItems]
        })
      } catch (err) {
        const errorMsg = (err as Error).message || 'Không thể gửi câu hỏi đến máy chủ'
        setError(errorMsg)
        toast.error(errorMsg)
        // Gỡ bỏ tin nhắn tạm nếu lỗi
        setMessages((prev) =>
          Array.isArray(prev) ? prev.filter((m) => m && m.id !== tempId) : [],
        )
      } finally {
        setIsLoading(false)
      }
    },
    [activeConversationId, isLoading],
  )

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    isLoading,
    error,
    selectedCitation,
    isCitationDrawerOpen,
    setIsCitationDrawerOpen,
    selectCitation,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation,
  }
}
