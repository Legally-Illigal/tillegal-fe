import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import {
  getSeverityConfig,
  getVerdictConfig,
  verificationApi,
  VerificationForm,
  VerificationResultCard,
  type VerifyCitationResponse,
} from './index'

describe('Verification Feature', () => {
  describe('Helper functions', () => {
    it('returns correct label and styles for verdicts', () => {
      const supported = getVerdictConfig('supported')
      expect(supported.label).toContain('Đúng căn cứ')

      const refuted = getVerdictConfig('refuted')
      expect(refuted.label).toContain('Bác bỏ')

      const partial = getVerdictConfig('partially_supported')
      expect(partial.label).toContain('Đúng một phần')

      const uncertain = getVerdictConfig('uncertain')
      expect(uncertain.label).toContain('Chưa đủ cơ sở')
    })

    it('returns correct severity config', () => {
      expect(getSeverityConfig('high').label).toBe('Rủi ro cao')
      expect(getSeverityConfig('medium').label).toBe('Lưu ý')
      expect(getSeverityConfig('low').label).toBe('Khuyến nghị')
    })
  })

  describe('verificationApi legal evaluator & storage', () => {
    beforeEach(() => {
      verificationApi.clearVerificationHistory()
    })

    it('evaluates deposit contract claim correctly', async () => {
      const result = await verificationApi.verifyCitation({
        claim:
          'Hợp đồng đặt cọc mua bán nhà đất bắt buộc phải công chứng mới có hiệu lực.',
      })

      expect(result.verdict).toBe('refuted')
      expect(result.isSupported).toBe(false)
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.9)
      expect(result.applicableLaw?.documentTitle).toContain('Bộ luật Dân sự 2015')
    })

    it('evaluates land without red book claim under Land Law 2024 correctly', async () => {
      const result = await verificationApi.verifyCitation({
        claim:
          'Theo Luật Đất đai 2024, đất không có sổ đỏ vẫn được bồi thường khi thu hồi.',
      })

      expect(result.verdict).toBe('supported')
      expect(result.isSupported).toBe(true)
      expect(result.applicableLaw?.documentTitle).toContain('Luật Đất đai 2024')
    })

    it('saves and clears verification history', () => {
      const item: VerifyCitationResponse = {
        id: 'ver-test',
        claim: 'Nhận định kiểm thử',
        isSupported: true,
        confidenceScore: 0.9,
        verdict: 'supported',
        verdictLabel: 'Đúng căn cứ',
        summaryAnalysis: 'Phân tích tóm tắt',
        issues: [],
        verifiedAt: new Date().toISOString(),
      }

      verificationApi.saveVerificationHistory(item)
      expect(verificationApi.getVerificationHistory()).toHaveLength(1)

      verificationApi.deleteVerificationHistory('ver-test')
      expect(verificationApi.getVerificationHistory()).toHaveLength(0)
    })
  })

  describe('VerificationForm', () => {
    it('submits form with user inputs', () => {
      const handleSubmit = vi.fn()
      render(<VerificationForm onSubmit={handleSubmit} />)

      const claimInput = screen.getByLabelText(/Nhận định pháp lý/i)
      fireEvent.change(claimInput, {
        target: { value: 'Công ty sa thải nhân viên nuôi con nhỏ.' },
      })

      const submitBtn = screen.getByRole('button', { name: /Bắt đầu thẩm định/i })
      fireEvent.click(submitBtn)

      expect(handleSubmit).toHaveBeenCalledWith({
        claim: 'Công ty sa thải nhân viên nuôi con nhỏ.',
        citedArticle: undefined,
        citedText: undefined,
      })
    })
  })

  describe('VerificationResultCard', () => {
    it('renders verdict, confidence score, and analysis', () => {
      const sampleResult: VerifyCitationResponse = {
        id: 'ver-123',
        claim: 'Nhận định test',
        citedArticle: 'Bộ luật Lao động 2019',
        isSupported: false,
        confidenceScore: 0.95,
        verdict: 'refuted',
        verdictLabel: 'Bác bỏ / Sai lệch',
        summaryAnalysis: 'Hành vi đơn phương sa thải này là trái pháp luật.',
        applicableLaw: {
          documentTitle: 'Bộ luật Lao động 2019',
          documentNumber: '45/2019/QH14',
          articleReference: 'Điều 137',
        },
        issues: [
          {
            type: 'illegal_action',
            severity: 'high',
            description: 'Vi phạm quy định cấm của luật.',
          },
        ],
        verifiedAt: new Date().toISOString(),
      }

      render(
        <MemoryRouter>
          <VerificationResultCard result={sampleResult} />
        </MemoryRouter>,
      )

      expect(screen.getByText('Bác bỏ / Sai lệch')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(
        screen.getByText(/Hành vi đơn phương sa thải này là trái pháp luật/i),
      ).toBeInTheDocument()
      expect(screen.getByText('Rủi ro cao')).toBeInTheDocument()
    })
  })
})
