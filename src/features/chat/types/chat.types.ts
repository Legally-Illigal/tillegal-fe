import type { CitationItem } from '@/features/citation'

export type MessageRole = 'user' | 'assistant'

export type WorkflowMode = 'single_agent' | 'multi_agent'

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
  workflowMode?: WorkflowMode | null
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
  workflowMode?: WorkflowMode | null
}

export interface AskQuestionResponse {
  userMessage: ConversationMessage
  assistantMessage: ConversationMessage
}

export interface ConversationAttachment {
  id: string
  conversationId: string
  userId: string
  fileName: string | null
  fileSize: number
  contentType: string | null
  processingStatus: string | null
  tokenCount: number | null
  fileHash: string | null
  createdAt: string
  updatedAt: string | null
}

export interface AttachmentUploadTask {
  tempId: string
  fileName: string
  fileSize: number
  progress: number
  status: 'uploading' | 'error'
  error?: string
}
