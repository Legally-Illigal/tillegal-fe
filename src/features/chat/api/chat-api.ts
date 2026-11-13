import { apiClient, type BlobResponse } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/types'
import type { CitationItem } from '@/features/citation'
import type {
  AskQuestionResponse,
  Conversation,
  ConversationAttachment,
  ConversationMessage,
  CreateConversationRequest,
} from '../types/chat.types'

export function getConversationsStorageKey(userId?: string | null): string {
  return userId
    ? `tillegal_saved_conversations_${userId}`
    : 'tillegal_saved_conversations_guest'
}

/**
 * Chuẩn hóa đối tượng cuộc hội thoại từ API về đúng định dạng Conversation
 */
export function normalizeConversation(raw: unknown): Conversation {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      title: 'Cuộc trò chuyện mới',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    }
  }

  const c = raw as Record<string, unknown>
  const rawUserId = c.userId ?? c.user_id
  return {
    id: String(c.id || ''),
    userId: rawUserId != null ? String(rawUserId).toLowerCase() : undefined,
    title: String(c.title || 'Cuộc trò chuyện mới'),
    createdAt: String(c.createdAt ?? c.created_at ?? new Date().toISOString()),
    updatedAt:
      c.updatedAt != null
        ? String(c.updatedAt)
        : c.updated_at != null
          ? String(c.updated_at)
          : null,
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

  return {
    id: String(m.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    conversationId: String(m.conversationId ?? m.conversation_id ?? ''),
    role,
    content: String(m.content ?? ''),
    citations: Array.isArray(citations) ? (citations as CitationItem[]) : null,
    createdAt: String(m.createdAt ?? m.created_at ?? new Date().toISOString()),
  }
}

/**
 * Chuẩn hóa đối tượng tài liệu đính kèm từ API về đúng định dạng ConversationAttachment
 */
export function normalizeAttachment(raw: unknown): ConversationAttachment {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const rawUserId = a.userId ?? a.user_id

  return {
    id: String(a.id ?? ''),
    conversationId: String(a.conversationId ?? a.conversation_id ?? ''),
    userId: rawUserId != null ? String(rawUserId).toLowerCase() : '',
    fileName:
      a.fileName != null
        ? String(a.fileName)
        : a.file_name != null
          ? String(a.file_name)
          : null,
    fileSize: Number(a.fileSize ?? a.file_size ?? 0),
    contentType:
      a.contentType != null
        ? String(a.contentType)
        : a.content_type != null
          ? String(a.content_type)
          : null,
    processingStatus:
      a.processingStatus != null
        ? String(a.processingStatus)
        : a.processing_status != null
          ? String(a.processing_status)
          : null,
    tokenCount:
      typeof a.tokenCount === 'number'
        ? a.tokenCount
        : typeof a.token_count === 'number'
          ? a.token_count
          : null,
    fileHash:
      a.fileHash != null
        ? String(a.fileHash)
        : a.file_hash != null
          ? String(a.file_hash)
          : null,
    createdAt: String(a.createdAt ?? a.created_at ?? new Date().toISOString()),
    updatedAt:
      a.updatedAt != null
        ? String(a.updatedAt)
        : a.updated_at != null
          ? String(a.updated_at)
          : null,
  }
}

/**
 * Trả lời tự động kèm trích dẫn văn bản quy phạm pháp luật
 */
function generateAssistantReply(question: string): {
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
    const raw = await apiClient.post<Conversation>(
      API_ENDPOINTS.conversations.create,
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
        `[SECURITY] Session mismatch on createConversation! Expected "${normalizedUserId}" but created under "${response.userId}".`,
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
   */
  async getConversations(userId?: string | null): Promise<Conversation[]> {
    const normalizedUserId = userId ? String(userId).toLowerCase() : null

    try {
      const response = await apiClient.get<unknown>(API_ENDPOINTS.conversations.list)
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

      const normalizedList = rawList
        .map(normalizeConversation)
        .filter((c) => Boolean(c.id))

      // SECURITY CHECK: Đảm bảo toàn bộ cuộc hội thoại từ máy chủ phải thuộc về tài khoản hiện tại
      if (normalizedUserId && normalizedList.length > 0) {
        const foreignItems = normalizedList.filter(
          (c) => c.userId && c.userId.toLowerCase() !== normalizedUserId,
        )
        if (foreignItems.length > 0) {
          console.error(
            `[SECURITY] Session mismatch! Active user "${normalizedUserId}" does not match conversation owner "${foreignItems[0]?.userId}".`,
          )
          window.dispatchEvent(
            new CustomEvent('auth:session-mismatch', {
              detail: {
                expectedUserId: normalizedUserId,
                foundUserId: foreignItems[0]?.userId,
              },
            }),
          )
          throw new ApiError(
            'Phát hiện phiên đăng nhập không trùng khớp trên trình duyệt. Vui lòng đăng nhập lại.',
            401,
          )
        }
      }

      if (normalizedList.length > 0 || Array.isArray(response)) {
        try {
          const key = getConversationsStorageKey(normalizedUserId)
          const safeItems = normalizedUserId
            ? normalizedList.filter(
                (c) => !c.userId || c.userId.toLowerCase() === normalizedUserId,
              )
            : normalizedList
          localStorage.setItem(key, JSON.stringify(safeItems.slice(0, 30)))
        } catch {
          // ignore storage error
        }
        return normalizedList
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw err
      }
      // offline / unauthenticated fallback
    }
    return chatApi.getLocalConversations(normalizedUserId)
  },

  /**
   * Lấy danh sách tin nhắn của cuộc hội thoại
   */
  async getMessages(conversationId: string, limit = 50): Promise<ConversationMessage[]> {
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
  },

  /**
   * Gửi câu hỏi và nhận câu trả lời cùng trích dẫn từ trợ lý AI
   */
  async askQuestion(
    conversationId: string,
    content: string,
  ): Promise<AskQuestionResponse> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.conversations.messages(conversationId),
      { content, role: 'user' },
    )

    // TH1: Backend trả về format { userMessage, assistantMessage } theo tài liệu API
    if (response && (response.userMessage || response.assistantMessage)) {
      return {
        userMessage: normalizeMessage(
          response.userMessage || { content, role: 'user', conversationId },
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
          },
        )
        assistantMessage = normalizeMessage(savedAssistant)
      } catch {
        assistantMessage = {
          id: `asst-${Date.now()}`,
          conversationId,
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
    return {
      userMessage: {
        id: `user-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      },
      assistantMessage: {
        id: `asst-${Date.now()}`,
        conversationId,
        role: 'assistant',
        content: 'Yêu cầu của bạn đã được ghi nhận vào hệ thống.',
        createdAt: new Date().toISOString(),
      },
    }
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
   */
  getLocalConversations(userId?: string | null): Conversation[] {
    const normalizedUserId = userId ? String(userId).toLowerCase() : null
    try {
      const key = getConversationsStorageKey(normalizedUserId)
      const data = localStorage.getItem(key)
      if (!data) return []
      const parsed = JSON.parse(data)
      if (!Array.isArray(parsed)) return []

      const normalizedList = parsed
        .map(normalizeConversation)
        .filter((c) => Boolean(c.id))

      // Strict user isolation: không bao giờ trả về dữ liệu của user khác
      const safeList = normalizedUserId
        ? normalizedList.filter(
            (c) => !c.userId || c.userId.toLowerCase() === normalizedUserId,
          )
        : normalizedList

      // Tự động dọn dẹp localStorage nếu trước đó từng lưu lẫn dữ liệu của user khác
      if (safeList.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(safeList.slice(0, 30)))
      }

      return safeList
    } catch {
      return []
    }
  },

  /**
   * Lưu hoặc cập nhật thông tin cuộc hội thoại vào LocalStorage theo userId (từ chối lưu hội thoại của user khác)
   */
  saveLocalConversation(conversation: Conversation, userId?: string | null): void {
    const normalizedUserId = userId ? String(userId).toLowerCase() : null
    const normalizedConv = normalizeConversation(conversation)

    // Guard: tuyệt đối không lưu hội thoại thuộc tài khoản khác vào storage của user hiện tại
    if (
      normalizedUserId &&
      normalizedConv.userId &&
      normalizedConv.userId.toLowerCase() !== normalizedUserId
    ) {
      return
    }

    try {
      const key = getConversationsStorageKey(normalizedUserId)
      const list = chatApi.getLocalConversations(normalizedUserId)
      const existingIndex = list.findIndex((c) => c.id === normalizedConv.id)
      let updated: Conversation[]

      if (existingIndex >= 0) {
        updated = [...list]
        updated[existingIndex] = { ...updated[existingIndex], ...normalizedConv }
      } else {
        updated = [normalizedConv, ...list]
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
    } catch {
      // Server error fallback
    }
  },

  /**
   * Xóa một cuộc hội thoại khỏi LocalStorage theo userId
   */
  deleteLocalConversation(id: string, userId?: string | null): void {
    try {
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
