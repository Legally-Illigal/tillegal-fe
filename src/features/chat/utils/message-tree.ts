import type { ConversationMessage, MessageBranch } from '../types/chat.types'

/**
 * Xây dựng chuỗi hội thoại hoạt động (active thread) từ danh sách tin nhắn phẳng có parentMessageId.
 * Hỗ trợ phân nhánh dạng cây: các tin nhắn có cùng parentMessageId trong Database được tự động gom thành các nhánh (branches).
 * Toàn bộ cấu trúc cây và tin nhắn phân nhánh được quản lý và lấy trực tiếp từ Database Backend.
 *
 * @param allMessages Toàn bộ tin nhắn trong cuộc hội thoại (lấy từ backend)
 * @param activeBranchMap Bản đồ chỉ số nhánh người dùng đang chọn (messageId -> activeBranchIndex)
 * @returns Danh sách tin nhắn trên nhánh đang hiển thị (kèm thông tin branches và activeBranchIndex)
 */
export function buildMessageThread(
  allMessages: ConversationMessage[],
  activeBranchMap: Record<string, number> = {},
): ConversationMessage[] {
  if (!Array.isArray(allMessages) || allMessages.length === 0) {
    return []
  }

  // 1. Kiểm tra xem dữ liệu có chứa thông tin cây (parentMessageId) không
  const hasTreeStructure = allMessages.some(
    (m) => m.parentMessageId !== undefined && m.parentMessageId !== null,
  )

  // 2. Nếu hoàn toàn không có parentMessageId ở bất kỳ tin nhắn nào (dữ liệu phẳng cũ)
  if (!hasTreeStructure) {
    return allMessages
  }

  // 3. Nhóm các tin nhắn theo parentMessageId (null là các tin nhắn gốc)
  const childrenMap = new Map<string | null, ConversationMessage[]>()
  for (const m of allMessages) {
    const pId = m.parentMessageId ?? null
    const list = childrenMap.get(pId) || []
    list.push(m)
    childrenMap.set(pId, list)
  }

  const result: ConversationMessage[] = []
  let currentParentId: string | null = null
  const visited = new Set<string>()

  // Duyệt cây từ gốc xuống ngọn theo nhánh đang hoạt động
  while (true) {
    const siblings = childrenMap.get(currentParentId)
    if (!siblings || siblings.length === 0) {
      break
    }

    // Sắp xếp các tin nhắn anh em theo thời gian tạo tăng dần
    siblings.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    if (siblings.length === 1) {
      const single = siblings[0]!
      if (visited.has(single.id)) {
        break
      }
      visited.add(single.id)
      result.push(single)
      currentParentId = single.id
    } else {
      // Có nhiều tin nhắn con cùng một cha => Phân nhánh (branches) từ Database Backend!
      let activeIdx = siblings.length - 1 // Mặc định là nhánh mới nhất

      // Tìm activeBranchIndex được chọn từ activeBranchMap
      for (const s of siblings) {
        const branchVal = activeBranchMap[s.id]
        if (typeof branchVal === 'number') {
          activeIdx = Math.min(Math.max(branchVal, 0), siblings.length - 1)
          break
        }
      }

      const activeBranchMsg = siblings[activeIdx]!
      if (visited.has(activeBranchMsg.id)) {
        break
      }
      visited.add(activeBranchMsg.id)

      const branches: MessageBranch[] = siblings.map((s) => ({
        id: s.id,
        content: s.content,
        parentMessageId: s.parentMessageId,
        citations: s.citations,
        createdAt: s.createdAt,
      }))

      result.push({
        ...activeBranchMsg,
        branches,
        activeBranchIndex: activeIdx,
      })

      currentParentId = activeBranchMsg.id
    }
  }

  // Dự phòng an toàn: nếu do dữ liệu đứt đoạn mà không duyệt được, trả về allMessages
  if (result.length === 0 && allMessages.length > 0) {
    return allMessages
  }

  return result
}
