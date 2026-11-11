import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  type CitationItem,
  getCitationDisplayTitle,
  getCitationReference,
  CitationBadge,
  CitationCard,
} from './index'

describe('Citation Feature', () => {
  const sampleCitation: CitationItem = {
    id: 'cit-001',
    index: 1,
    documentTitle: 'Luật Đất đai 2024',
    documentNumber: '31/2024/QH15',
    articleReference: 'Điều 45, Khoản 1',
    sourceUrl: 'https://thuvienphapluat.vn/sample',
    citedText: 'Điều kiện chuyển nhượng, thừa kế quyền sử dụng đất...',
  }

  describe('Utility functions', () => {
    it('returns documentTitle or fallback title correctly', () => {
      expect(getCitationDisplayTitle(sampleCitation)).toBe('Luật Đất đai 2024')

      const fallback: CitationItem = { index: 2, title: 'Bộ luật Dân sự' }
      expect(getCitationDisplayTitle(fallback)).toBe('Bộ luật Dân sự')

      const nameless: CitationItem = { index: 3 }
      expect(getCitationDisplayTitle(nameless)).toBe('Căn cứ pháp lý [3]')
    })

    it('formats citation reference with article and document number', () => {
      expect(getCitationReference(sampleCitation)).toBe('Điều 45, Khoản 1 (31/2024/QH15)')

      const partial: CitationItem = { index: 1, articleReference: 'Điều 12' }
      expect(getCitationReference(partial)).toBe('Điều 12')
    })
  })

  describe('CitationBadge', () => {
    it('renders citation index and fires click event', () => {
      const handleClick = vi.fn()
      render(<CitationBadge citation={sampleCitation} onClick={handleClick} />)

      const badge = screen.getByRole('button', { name: /Trích dẫn 1/i })
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('1')

      fireEvent.click(badge)
      expect(handleClick).toHaveBeenCalledWith(sampleCitation)
    })
  })

  describe('CitationCard', () => {
    it('renders citation details, excerpt, and external source link', () => {
      const handleSelect = vi.fn()
      render(<CitationCard citation={sampleCitation} onSelect={handleSelect} />)

      expect(screen.getByText('Luật Đất đai 2024')).toBeInTheDocument()
      expect(screen.getByText('Điều 45, Khoản 1')).toBeInTheDocument()
      expect(screen.getByText(/Điều kiện chuyển nhượng/i)).toBeInTheDocument()

      const detailBtn = screen.getByRole('button', { name: /Xem toàn văn trích dẫn/i })
      fireEvent.click(detailBtn)
      expect(handleSelect).toHaveBeenCalledWith(sampleCitation)

      const sourceLink = screen.getByTitle('Mở văn bản gốc')
      expect(sourceLink).toHaveAttribute('href', 'https://thuvienphapluat.vn/sample')
    })
  })
})
