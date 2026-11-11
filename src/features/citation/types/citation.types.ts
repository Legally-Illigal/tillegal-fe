export interface CitationItem {
  id?: string
  index: number
  documentTitle?: string
  title?: string // Tương thích ngược nếu backend trả về title thay vì documentTitle
  documentNumber?: string
  articleReference?: string
  sourceUrl?: string
  citedText?: string
  validityStatus?: 'active' | 'expired' | 'amended' | 'unknown'
}

/**
 * Lấy tiêu đề hiển thị cho trích dẫn
 */
export function getCitationDisplayTitle(citation: CitationItem): string {
  if (citation.documentTitle && citation.documentTitle.trim()) {
    return citation.documentTitle
  }
  if (citation.title && citation.title.trim()) {
    return citation.title
  }
  return `Căn cứ pháp lý [${citation.index}]`
}

/**
 * Lấy chuỗi mô tả điều khoản ngắn gọn
 */
export function getCitationReference(citation: CitationItem): string {
  const parts: string[] = []
  if (citation.articleReference) {
    parts.push(citation.articleReference)
  }
  if (citation.documentNumber) {
    parts.push(`(${citation.documentNumber})`)
  }
  return parts.join(' ')
}
