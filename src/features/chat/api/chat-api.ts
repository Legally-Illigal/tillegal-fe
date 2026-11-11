import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  AskQuestionResponse,
  Conversation,
  ConversationMessage,
  CreateConversationRequest,
} from '../types/chat.types'

const LOCAL_STORAGE_CONVERSATIONS_KEY = 'tillegal_saved_conversations'

export const chatApi = {
  /**
   * Tạo cuộc hội thoại mới
   */
  async createConversation(data?: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.post<Conversation>(
      API_ENDPOINTS.conversations.create,
      data ?? {},
    )
    chatApi.saveLocalConversation(response)
    return response
  },

  /**
   * Lấy danh sách tin nhắn của cuộc hội thoại
   */
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const messages = await apiClient.get<ConversationMessage[]>(
      API_ENDPOINTS.conversations.messages(conversationId),
    )
    return messages ?? []
  },

  /**
   * Gửi câu hỏi và nhận câu trả lời cùng trích dẫn từ trợ lý AI
   */
  async askQuestion(
    conversationId: string,
    content: string,
  ): Promise<AskQuestionResponse> {
    const response = await apiClient.post<AskQuestionResponse>(
      API_ENDPOINTS.conversations.messages(conversationId),
      { content },
    )
    return response
  },

  /**
   * Lấy danh sách cuộc hội thoại lưu trữ trong LocalStorage
   */
  getLocalConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  /**
   * Lưu hoặc cập nhật thông tin cuộc hội thoại vào LocalStorage
   */
  saveLocalConversation(conversation: Conversation): void {
    try {
      const list = chatApi.getLocalConversations()
      const existingIndex = list.findIndex((c) => c.id === conversation.id)
      let updated: Conversation[]

      if (existingIndex >= 0) {
        updated = [...list]
        updated[existingIndex] = { ...updated[existingIndex], ...conversation }
      } else {
        updated = [conversation, ...list]
      }

      localStorage.setItem(
        LOCAL_STORAGE_CONVERSATIONS_KEY,
        JSON.stringify(updated.slice(0, 30)),
      )
    } catch {
      // LocalStorage error fallback
    }
  },

  /**
   * Xóa một cuộc hội thoại khỏi LocalStorage
   */
  deleteLocalConversation(id: string): void {
    try {
      const list = chatApi.getLocalConversations().filter((c) => c.id !== id)
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(list))
    } catch {
      // LocalStorage error fallback
    }
  },

  /**
   * Xóa toàn bộ lịch sử hội thoại
   */
  clearLocalConversations(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_CONVERSATIONS_KEY)
    } catch {
      // LocalStorage error fallback
    }
  },
}
