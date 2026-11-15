import type { CitationItem } from '@/features/citation'

export type MessageRole = 'user' | 'assistant'

export interface MessageBranch {
  id: string
  content: string
  parentMessageId?: string | null
  citations?: CitationItem[] | null
  createdAt?: string
  tailMessages?: ConversationMessage[]
}

export interface ConversationMessage {
  id: string
  conversationId: string
  parentMessageId?: string | null
  role: MessageRole
  content: string
  citations?: CitationItem[] | null
  createdAt: string
  updatedAt?: string | null
  branches?: MessageBranch[]
  activeBranchIndex?: number
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

export interface UpdateConversationRequest {
  title: string
}

export interface ForkConversationRequest {
  fromMessageId?: string | null
  newTitle?: string | null
  newPrompt?: string | null
}

export interface UpdateMessageRequest {
  content: string
  citations?: CitationItem[] | null
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
  parentMessageId?: string | null
}

export interface AskQuestionResponse {
  userMessage: ConversationMessage
  assistantMessage: ConversationMessage
}
