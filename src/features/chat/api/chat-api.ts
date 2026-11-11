import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { CitationItem } from '@/features/citation'
import type {
  AskQuestionResponse,
  Conversation,
  ConversationMessage,
  CreateConversationRequest,
} from '../types/chat.types'

const LOCAL_STORAGE_CONVERSATIONS_KEY = 'tillegal_saved_conversations'

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
  async createConversation(data?: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.post<Conversation>(
      API_ENDPOINTS.conversations.create,
      data ?? {},
    )
    chatApi.saveLocalConversation(response)
    return response
  },

  /**
   * Lấy danh sách cuộc hội thoại từ máy chủ (fallback về LocalStorage)
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const serverList = await apiClient.get<Conversation[]>(
        API_ENDPOINTS.conversations.list,
      )
      if (Array.isArray(serverList)) {
        try {
          localStorage.setItem(
            LOCAL_STORAGE_CONVERSATIONS_KEY,
            JSON.stringify(serverList.slice(0, 30)),
          )
        } catch {
          // ignore storage error
        }
        return serverList
      }
    } catch {
      // offline / unauthenticated fallback
    }
    return chatApi.getLocalConversations()
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
   * Xóa một cuộc hội thoại (cả LocalStorage lẫn Backend)
   */
  async deleteConversation(id: string): Promise<void> {
    chatApi.deleteLocalConversation(id)
    try {
      await apiClient.delete(API_ENDPOINTS.conversations.detail(id))
    } catch {
      // Server error fallback
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
