import type { CitationItem } from '@/features/citation'

export type MessageRole = 'user' | 'assistant'

export interface ConversationMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  citations?: CitationItem[] | null
  createdAt: string
}

export interface Conversation {
  id: string
  userId?: string
  title: string
  createdAt: string
  updatedAt?: string | null
}

export interface CreateConversationRequest {
  title?: string
}

export interface CreateConversationResponse {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt?: string | null
}

export interface AskQuestionRequest {
  content: string
}

export interface AskQuestionResponse {
  userMessage: ConversationMessage
  assistantMessage: ConversationMessage
}
