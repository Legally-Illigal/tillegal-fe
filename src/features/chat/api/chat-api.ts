import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { CitationItem } from '@/features/citation'
import type {
  AskQuestionResponse,
  Conversation,
  ConversationMessage,
  CreateConversationRequest,
  ForkConversationRequest,
  MessageBranch,
  UpdateConversationRequest,
  UpdateMessageRequest,
} from '../types/chat.types'

export function getConversationsStorageKey(userId?: string | null): string {
  return userId
    ? `tillegal_saved_conversations_${userId}`
    : 'tillegal_saved_conversations_guest'
}

export function getMessageBranchesStorageKey(conversationId: string): string {
  return `tillegal_message_branches_${conversationId}`
}

export function getStoredMessageBranches(
  conversationId: string,
): Record<string, { branches: MessageBranch[]; activeBranchIndex: number }> {
  try {
    const key = getMessageBranchesStorageKey(conversationId)
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function saveStoredMessageBranches(
  conversationId: string,
  branchesMap: Record<string, { branches: MessageBranch[]; activeBranchIndex: number }>,
): void {
  try {
    const key = getMessageBranchesStorageKey(conversationId)
    localStorage.setItem(key, JSON.stringify(branchesMap))
  } catch {
    // ignore local storage error
  }
}

export function clearStoredMessageBranches(conversationId: string): void {
  try {
    localStorage.removeItem(getMessageBranchesStorageKey(conversationId))
  } catch {
    // ignore local storage error
  }
}

/**
 * Chuẩn hóa đối tượng tin nhắn từ API về đúng định dạng ConversationMessage
 */
export function normalizeMessage(raw: unknown): ConversationMessage {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId: '',
      role: 'user',
      content: '',
      citations: null,
      createdAt: new Date().toISOString(),
    }
  }

  const m = raw as Record<string, unknown>
  let citations = m.citations
  if (typeof citations === 'string') {
    try {
      citations = JSON.parse(citations)
    } catch {
      citations = null
    }
  }

  const roleStr = String(m.role || '').toLowerCase()
  const role: 'user' | 'assistant' = roleStr === 'assistant' ? 'assistant' : 'user'

  const rawParentId = m.parentMessageId ?? m.parent_message_id
  const parentMessageId =
    rawParentId != null && String(rawParentId).trim() !== '' ? String(rawParentId) : null

  return {
    id: String(m.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    conversationId: String(m.conversationId ?? m.conversation_id ?? ''),
    parentMessageId,
    role,
    content: String(m.content ?? ''),
    citations: Array.isArray(citations) ? (citations as CitationItem[]) : null,
    createdAt: String(m.createdAt ?? m.created_at ?? new Date().toISOString()),
    updatedAt:
      m.updatedAt != null
        ? String(m.updatedAt)
        : m.updated_at != null
          ? String(m.updated_at)
          : null,
  }
}

/**
 * Trả lời tự động kèm trích dẫn văn bản quy phạm pháp luật
 */
export function generateAssistantReply(question: string): {
  content: string
  citations: CitationItem[]
} {
  const q = question.toLowerCase()

  if (q.includes('sổ đỏ') || q.includes('đất') || q.includes('thừa kế')) {
    return {
      content: `### 1. Căn cứ pháp lý
Căn cứ theo quy định của **Luật Đất đai 2024**[^1] và **Bộ luật Dân sự 2015**[^2], thủ tục đăng ký biến động đất đai khi nhận thừa kế quyền sử dụng đất được thực hiện theo trình tự sau:

### 2. Thành phần hồ sơ cần chuẩn bị
- Đơn đăng ký biến động đất đai, tài sản gắn liền với đất theo mẫu.
- Giấy chứng nhận quyền sử dụng đất (Sổ đỏ/Sổ hồng) bản gốc.
- Văn bản phân chia di sản thừa kế hoặc Bản án/Quyết định giải quyết thừa kế của Tòa án có hiệu lực pháp luật.
- Giấy chứng tử của người để lại di sản và giấy tờ chứng minh quan hệ thừa kế.
- Căn cước công dân của người nhận thừa kế.

### 3. Thời hạn và nghĩa vụ tài chính
- Người nhận thừa kế phải làm thủ tục đăng ký biến động trong thời hạn **30 ngày** kể từ ngày phân chia xong di sản thừa kế.
- Thừa kế giữa vợ với chồng, cha đẻ/mẹ đẻ với con đẻ... thuộc diện được **miễn thuế thu nhập cá nhân** và **lệ phí trước bạ** theo luật định.`,
      citations: [
        {
          id: 'cit-001',
          index: 1,
          documentTitle: 'Luật Đất đai 2024',
          documentNumber: '31/2024/QH15',
          articleReference: 'Điều 45, Khoản 1 & Điều 137',
          sourceUrl: 'https://thuvienphapluat.vn',
          citedText:
            'Người sử dụng đất được thực hiện quyền chuyển đổi, chuyển nhượng, cho thuê, thừa kế, tặng cho quyền sử dụng đất khi có Giấy chứng nhận và đất không có tranh chấp.',
        },
        {
          id: 'cit-002',
          index: 2,
          documentTitle: 'Bộ luật Dân sự 2015',
          documentNumber: '91/2015/QH13',
          articleReference: 'Điều 649 & Điều 651',
          sourceUrl: 'https://thuvienphapluat.vn',
          citedText:
            'Thừa kế theo pháp luật là thừa kế theo hàng thừa kế, điều kiện và trình tự thừa kế do pháp luật quy định.',
        },
      ],
    }
  }

  if (
    q.includes('sa thải') ||
    q.includes('lao động') ||
    q.includes('việc làm') ||
    q.includes('bồi thường')
  ) {
    return {
      content: `### 1. Căn cứ pháp lý
Theo **Bộ luật Lao động 2019**[^1], người sử dụng lao động đơn phương chấm dứt hợp đồng lao động trái pháp luật phải gánh chịu các nghĩa vụ bồi thường nghiêm ngặt.

### 2. Các khoản người sử dụng lao động phải bồi thường
- Phải nhận người lao động trở lại làm việc theo hợp đồng đã giao kết.
- Trả tiền lương, đóng bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp trong những ngày người lao động không được làm việc.
- Trả thêm cho người lao động một khoản tiền ít nhất bằng **02 tháng tiền lương** theo hợp đồng lao động.
- Trường hợp vi phạm thời hạn báo trước thì phải bồi thường một khoản tiền tương ứng với tiền lương trong những ngày không báo trước.

### 3. Lưu ý bảo vệ quyền lợi
Người lao động có quyền nộp đơn khiếu nại đến Thanh tra Sở Lao động - Thương binh và Xã hội hoặc khởi kiện trực tiếp ra Tòa án nhân dân có thẩm quyền để yêu cầu giải quyết quyền lợi.`,
      citations: [
        {
          id: 'cit-003',
          index: 1,
          documentTitle: 'Bộ luật Lao động 2019',
          documentNumber: '45/2019/QH14',
          articleReference: 'Điều 36 & Điều 41',
          sourceUrl: 'https://thuvienphapluat.vn',
          citedText:
            'Nghĩa vụ của người sử dụng lao động khi đơn phương chấm dứt hợp đồng lao động trái pháp luật bao gồm nhận người lao động trở lại làm việc và bồi thường tiền lương.',
        },
      ],
    }
  }

  if (
    q.includes('doanh nghiệp') ||
    q.includes('công ty') ||
    q.includes('đại diện') ||
    q.includes('tnhh')
  ) {
    return {
      content: `### 1. Căn cứ pháp lý
Theo quy định tại **Luật Doanh nghiệp 2020**[^1], thủ tục thay đổi người đại diện theo pháp luật của Công ty TNHH một thành viên được thực hiện tại Phòng Đăng ký kinh doanh thuộc Sở Kế hoạch và Đầu tư.

### 2. Hồ sơ thay đổi bao gồm
- Thông báo thay đổi người đại diện theo pháp luật do Chủ sở hữu công ty hoặc Chủ tịch công ty ký.
- Bản sao hợp lệ giấy tờ pháp lý cá nhân của người đại diện theo pháp luật mới (CCCD/Hộ chiếu).
- Quyết định của chủ sở hữu công ty về việc thay đổi người đại diện theo pháp luật.
- Điều lệ sửa đổi, bổ sung của công ty (nếu có).

### 3. Thời hạn thực hiện
Doanh nghiệp có nghĩa vụ đăng ký thay đổi trong thời hạn **10 ngày** kể từ ngày có quyết định thay đổi.`,
      citations: [
        {
          id: 'cit-004',
          index: 1,
          documentTitle: 'Luật Doanh nghiệp 2020',
          documentNumber: '59/2020/QH14',
          articleReference: 'Điều 12 & Điều 74',
          sourceUrl: 'https://thuvienphapluat.vn',
          citedText:
            'Người đại diện theo pháp luật của doanh nghiệp là cá nhân đại diện cho doanh nghiệp thực hiện các quyền và nghĩa vụ phát sinh từ giao dịch của doanh nghiệp.',
        },
      ],
    }
  }

  if (
    q.includes('nồng độ cồn') ||
    q.includes('giao thông') ||
    q.includes('xe máy') ||
    q.includes('mức phạt')
  ) {
    return {
      content: `### 1. Căn cứ pháp lý
Theo **Nghị định 100/2019/NĐ-CP** (sửa đổi, bổ sung bởi **Nghị định 123/2021/NĐ-CP**)[^1], pháp luật Việt Nam nghiêm cấm tuyệt đối hành vi điều khiển phương tiện giao thông mà trong máu hoặc hơi thở có nồng độ cồn.

### 2. Các khung xử phạt đối với người điều khiển xe mô tô, xe gắn máy
- **Khung 1 (Nồng độ cồn chưa vượt quá 50 mg/100 ml máu hoặc 0.25 mg/1 lít khí thở):** Phạt tiền từ **2.000.000đ - 3.000.000đ**, tước Giấy phép lái xe từ **10 - 12 tháng**.
- **Khung 2 (Vượt quá 50 - 80 mg/100 ml máu hoặc 0.25 - 0.4 mg/1 lít khí thở):** Phạt tiền từ **4.000.000đ - 5.000.000đ**, tước Giấy phép lái xe từ **16 - 18 tháng**.
- **Khung 3 (Vượt quá 80 mg/100 ml máu hoặc 0.4 mg/1 lít khí thở, hoặc không chấp hành kiểm tra):** Phạt tiền từ **6.000.000đ - 8.000.000đ**, tước Giấy phép lái xe từ **22 - 24 tháng**.

Ngoài phạt tiền và tước bằng lái, phương tiện sẽ bị **tạm giữ tối đa đến 07 ngày** trước khi ra quyết định xử phạt.`,
      citations: [
        {
          id: 'cit-005',
          index: 1,
          documentTitle: 'Nghị định 100/2019/NĐ-CP',
          documentNumber: '100/2019/NĐ-CP',
          articleReference: 'Điều 6, Khoản 6, 7, 8',
          sourceUrl: 'https://thuvienphapluat.vn',
          citedText:
            'Xử phạt người điều khiển xe mô tô, xe gắn máy vi phạm quy tắc giao thông đường bộ liên quan đến nồng độ cồn trong máu hoặc hơi thở.',
        },
      ],
    }
  }

  return {
    content: `### 1. Phân tích sơ bộ yêu cầu
Hệ thống trợ lý pháp luật Tillegal đã ghi nhận tình huống: *"**${question.trim()}**"*.

### 2. Hướng dẫn đối chiếu và tra cứu
- Bạn vui lòng cung cấp thêm các tình tiết cụ thể hơn (ví dụ: các bên tham gia, loại hợp đồng, thời điểm phát sinh sự việc hoặc cơ quan liên quan) để trợ lý đối chiếu chính xác căn cứ điều khoản.
- Bạn cũng có thể sử dụng tính năng **Tra cứu đối chiếu trích dẫn** trên thanh điều hướng để kiểm tra hiệu lực văn bản quy phạm pháp luật liên quan.

*Lưu ý: Các thông tin giải đáp của trợ lý AI chỉ mang tính chất tham khảo cơ sở pháp lý, không thay thế cho ý kiến tư vấn chính thức từ Luật sư hoặc Văn phòng luật.*`,
    citations: [],
  }
}

export const chatApi = {
  /**
   * Tạo cuộc hội thoại mới
   */
  async createConversation(
    data?: CreateConversationRequest,
    userId?: string | null,
  ): Promise<Conversation> {
    const response = await apiClient.post<Conversation>(
      API_ENDPOINTS.conversations.create,
      data ?? {},
    )
    chatApi.saveLocalConversation(response, userId)
    return response
  },

  /**
<<<<<<< Updated upstream
   * Lấy danh sách cuộc hội thoại từ máy chủ (fallback về LocalStorage của đúng user)
=======
   * Cập nhật tiêu đề cuộc hội thoại (PUT /api/conversations/{id})
   */
  async updateConversation(
    id: string,
    titleOrData: string | UpdateConversationRequest,
    userId?: string | null,
  ): Promise<Conversation> {
    const title = typeof titleOrData === 'string' ? titleOrData : titleOrData.title
    const raw = await apiClient.put<Conversation>(
      API_ENDPOINTS.conversations.detail(id),
      { title },
    )
    const response = normalizeConversation(raw)
    const normalizedUserId = userId ? String(userId).toLowerCase() : null

    // SECURITY CHECK: Xác thực quyền sở hữu cuộc trò chuyện vừa cập nhật
    if (
      normalizedUserId &&
      response.userId &&
      response.userId.toLowerCase() !== normalizedUserId
    ) {
      console.error(
        `[SECURITY] Session mismatch on updateConversation! Expected "${normalizedUserId}" but updated under "${response.userId}".`,
      )
      window.dispatchEvent(
        new CustomEvent('auth:session-mismatch', {
          detail: {
            expectedUserId: normalizedUserId,
            foundUserId: response.userId,
          },
        }),
      )
      throw new ApiError(
        'Phát hiện phiên đăng nhập không trùng khớp trên trình duyệt. Vui lòng đăng nhập lại.',
        401,
      )
    }

    chatApi.saveLocalConversation(response, normalizedUserId)
    return response
  },

  /**
   * Tách / Rẽ nhánh cuộc hội thoại mới từ hội thoại hiện tại (POST /api/conversations/{id}/fork)
   */
  async forkConversation(
    id: string,
    data?: ForkConversationRequest,
    userId?: string | null,
  ): Promise<Conversation> {
    const raw = await apiClient.post<Conversation>(
      API_ENDPOINTS.conversations.fork(id),
      data ?? {},
    )
    const response = normalizeConversation(raw)
    const normalizedUserId = userId ? String(userId).toLowerCase() : null

    // SECURITY CHECK: Xác thực quyền sở hữu cuộc trò chuyện vừa tạo
    if (
      normalizedUserId &&
      response.userId &&
      response.userId.toLowerCase() !== normalizedUserId
    ) {
      console.error(
        `[SECURITY] Session mismatch on forkConversation! Expected "${normalizedUserId}" but created under "${response.userId}".`,
      )
      window.dispatchEvent(
        new CustomEvent('auth:session-mismatch', {
          detail: {
            expectedUserId: normalizedUserId,
            foundUserId: response.userId,
          },
        }),
      )
      throw new ApiError(
        'Phát hiện phiên đăng nhập không trùng khớp trên trình duyệt. Vui lòng đăng nhập lại.',
        401,
      )
    }

    chatApi.saveLocalConversation(response, normalizedUserId)
    return response
  },

  /**
   * Lấy danh sách cuộc hội thoại từ máy chủ (có kiểm tra quyền sở hữu và fallback về LocalStorage của đúng user)
>>>>>>> Stashed changes
   */
  async getConversations(userId?: string | null): Promise<Conversation[]> {
    try {
      const serverList = await apiClient.get<Conversation[]>(
        API_ENDPOINTS.conversations.list,
      )
      if (Array.isArray(serverList)) {
        try {
          const key = getConversationsStorageKey(userId)
          localStorage.setItem(key, JSON.stringify(serverList.slice(0, 30)))
        } catch {
          // ignore storage error
        }
        return serverList
      }
    } catch {
      // offline / unauthenticated fallback
    }
    return chatApi.getLocalConversations(userId)
  },

  /**
   * Lấy danh sách tin nhắn của cuộc hội thoại
   */
  async getMessages(conversationId: string, limit = 50): Promise<ConversationMessage[]> {
    try {
      const response = await apiClient.get<
        | ConversationMessage[]
        | { data?: unknown[]; has_more?: boolean; next_cursor?: string | null }
      >(API_ENDPOINTS.conversations.messages(conversationId), {
        params: { limit },
      })

      let rawList: unknown[] = []
      if (Array.isArray(response)) {
        rawList = response
      } else if (
        response &&
        typeof response === 'object' &&
        Array.isArray((response as { data?: unknown[] }).data)
      ) {
        rawList = (response as { data: unknown[] }).data
      }

      return rawList.map(normalizeMessage)
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn hội thoại:', err)
      return []
    }
  },

  /**
   * Gửi câu hỏi và nhận câu trả lời cùng trích dẫn từ trợ lý AI
   */
  async askQuestion(
    conversationId: string,
    content: string,
    parentMessageId?: string | null,
  ): Promise<AskQuestionResponse> {
    const payload: { role: string; content: string; parentMessageId?: string | null } = {
      content,
      role: 'user',
    }
    if (parentMessageId) {
      payload.parentMessageId = parentMessageId
    }

    const response = await apiClient.post<any>(
      API_ENDPOINTS.conversations.messages(conversationId),
      payload,
    )

    // TH1: Backend trả về format { userMessage, assistantMessage } theo tài liệu API
    if (response && (response.userMessage || response.assistantMessage)) {
      return {
        userMessage: normalizeMessage(
          response.userMessage || {
            content,
            role: 'user',
            conversationId,
            parentMessageId,
          },
        ),
        assistantMessage: normalizeMessage(
          response.assistantMessage || {
            content: 'Hệ thống đã ghi nhận câu hỏi của bạn.',
            role: 'assistant',
            conversationId,
          },
        ),
      }
    }

    // TH2: Backend trả về MessageApiResponse (tin nhắn user vừa tạo)
    if (response && response.id) {
      const userMessage = normalizeMessage(response)
      const assistantReply = generateAssistantReply(content)

      let assistantMessage: ConversationMessage
      try {
        const savedAssistant = await apiClient.post<any>(
          API_ENDPOINTS.conversations.messages(conversationId),
          {
            role: 'assistant',
            content: assistantReply.content,
            citations: assistantReply.citations,
            parentMessageId: userMessage.id || null,
          },
        )
        assistantMessage = normalizeMessage(savedAssistant)
      } catch {
        assistantMessage = {
          id: `asst-${Date.now()}`,
          conversationId,
          parentMessageId: userMessage.id || null,
          role: 'assistant',
          content: assistantReply.content,
          citations: assistantReply.citations,
          createdAt: new Date().toISOString(),
        }
      }

      return {
        userMessage,
        assistantMessage,
      }
    }

    // TH3: Fallback nếu không có phản hồi
    const fallbackUserId = `user-${Date.now()}`
    return {
      userMessage: {
        id: fallbackUserId,
        conversationId,
        parentMessageId: parentMessageId ?? null,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      },
      assistantMessage: {
        id: `asst-${Date.now()}`,
        conversationId,
        parentMessageId: fallbackUserId,
        role: 'assistant',
        content: 'Yêu cầu của bạn đã được ghi nhận vào hệ thống.',
        createdAt: new Date().toISOString(),
      },
    }
  },

  /**
<<<<<<< Updated upstream
   * Lấy danh sách cuộc hội thoại lưu trữ trong LocalStorage theo userId
=======
   * Cập nhật nội dung tin nhắn (PUT /api/conversations/{conversationId}/messages/{messageId})
   */
  async updateMessage(
    conversationId: string,
    messageId: string,
    contentOrData: string | UpdateMessageRequest,
    citations?: CitationItem[] | null,
  ): Promise<ConversationMessage> {
    const content =
      typeof contentOrData === 'string' ? contentOrData : contentOrData.content
    const resolvedCitations =
      typeof contentOrData === 'object' && contentOrData.citations !== undefined
        ? contentOrData.citations
        : citations

    const raw = await apiClient.put<unknown>(
      API_ENDPOINTS.conversations.messageDetail(conversationId, messageId),
      {
        content,
        citations: resolvedCitations ?? null,
      },
    )
    return normalizeMessage(raw)
  },

  /**
   * Xóa tin nhắn khỏi cuộc hội thoại (DELETE /api/conversations/{conversationId}/messages/{messageId})
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.conversations.messageDetail(conversationId, messageId),
    )
  },

  /**
   * Lấy danh sách tài liệu đính kèm của một cuộc hội thoại
   */
  async getAttachments(
    conversationId: string,
    userId?: string | null,
  ): Promise<ConversationAttachment[]> {
    const normalizedUserId = userId ? String(userId).toLowerCase() : null
    const response = await apiClient.get<ConversationAttachment[]>(
      API_ENDPOINTS.conversations.attachments(conversationId),
    )
    if (!Array.isArray(response)) return []
    const list = response.map(normalizeAttachment).filter((item) => Boolean(item.id))

    // SECURITY CHECK: Xác thực tài liệu trả về phải thuộc về user đang đăng nhập
    if (normalizedUserId && list.length > 0) {
      const foreign = list.filter(
        (a) => a.userId && a.userId.toLowerCase() !== normalizedUserId,
      )
      if (foreign.length > 0) {
        console.error(
          `[SECURITY] Session mismatch on attachments! Expected "${normalizedUserId}" but found "${foreign[0]?.userId}".`,
        )
        window.dispatchEvent(
          new CustomEvent('auth:session-mismatch', {
            detail: {
              expectedUserId: normalizedUserId,
              foundUserId: foreign[0]?.userId,
            },
          }),
        )
        throw new ApiError(
          'Phát hiện phiên đăng nhập không trùng khớp trên trình duyệt. Vui lòng đăng nhập lại.',
          401,
        )
      }
    }

    return list
  },

  /**
   * Lấy thông tin chi tiết một tài liệu đính kèm
   */
  async getAttachment(
    conversationId: string,
    attachmentId: string,
  ): Promise<ConversationAttachment> {
    const response = await apiClient.get<ConversationAttachment>(
      API_ENDPOINTS.conversations.attachmentDetail(conversationId, attachmentId),
    )
    return normalizeAttachment(response)
  },

  /**
   * Tải một tài liệu đính kèm lên cuộc hội thoại (multipart/form-data)
   */
  async uploadAttachment(
    conversationId: string,
    file: File,
    onUploadProgress?: (percent: number) => void,
  ): Promise<ConversationAttachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.postForm<ConversationAttachment>(
      API_ENDPOINTS.conversations.attachments(conversationId),
      formData,
      onUploadProgress ? { onUploadProgress } : undefined,
    )
    return normalizeAttachment(response)
  },

  /**
   * Xóa một tài liệu đính kèm khỏi cuộc hội thoại
   */
  async deleteAttachment(conversationId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.conversations.attachmentDetail(conversationId, attachmentId),
    )
  },

  /**
   * Tải xuống nội dung nhị phân của tài liệu đính kèm
   */
  async downloadAttachment(
    conversationId: string,
    attachmentId: string,
  ): Promise<BlobResponse> {
    return apiClient.getBlob(
      API_ENDPOINTS.conversations.attachmentDownload(conversationId, attachmentId),
    )
  },

  /**
   * Lấy danh sách cuộc hội thoại lưu trữ trong LocalStorage theo userId (chỉ trả về hội thoại thuộc đúng user)
>>>>>>> Stashed changes
   */
  getLocalConversations(userId?: string | null): Conversation[] {
    try {
      const key = getConversationsStorageKey(userId)
      const data = localStorage.getItem(key)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  /**
   * Lưu hoặc cập nhật thông tin cuộc hội thoại vào LocalStorage theo userId
   */
  saveLocalConversation(conversation: Conversation, userId?: string | null): void {
    try {
      const key = getConversationsStorageKey(userId)
      const list = chatApi.getLocalConversations(userId)
      const existingIndex = list.findIndex((c) => c.id === conversation.id)
      let updated: Conversation[]

      if (existingIndex >= 0) {
        updated = [...list]
        updated[existingIndex] = { ...updated[existingIndex], ...conversation }
      } else {
        updated = [conversation, ...list]
      }

      localStorage.setItem(key, JSON.stringify(updated.slice(0, 30)))
    } catch {
      // LocalStorage error fallback
    }
  },

  /**
   * Xóa một cuộc hội thoại (cả LocalStorage lẫn Backend)
   */
  async deleteConversation(id: string, userId?: string | null): Promise<void> {
    chatApi.deleteLocalConversation(id, userId)
    try {
      await apiClient.delete(API_ENDPOINTS.conversations.detail(id))
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        throw err
      }
      // Server offline / network fallback
    }
  },

  /**
   * Xóa một cuộc hội thoại khỏi LocalStorage theo userId
   */
  deleteLocalConversation(id: string, userId?: string | null): void {
    try {
      clearStoredMessageBranches(id)
      const key = getConversationsStorageKey(userId)
      const list = chatApi.getLocalConversations(userId).filter((c) => c.id !== id)
      localStorage.setItem(key, JSON.stringify(list))
    } catch {
      // LocalStorage error fallback
    }
  },

  /**
   * Xóa toàn bộ lịch sử hội thoại (nếu có userId thì xóa của user đó, không thì xóa toàn bộ)
   */
  clearLocalConversations(userId?: string | null): void {
    try {
      if (userId) {
        localStorage.removeItem(getConversationsStorageKey(userId))
      } else {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('tillegal_saved_conversations')) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
      }
    } catch {
      // LocalStorage error fallback
    }
  },
}
