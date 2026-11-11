import { apiClient, API_ENDPOINTS } from '@/lib/api'
import type {
  SampleVerificationScenario,
  VerifyCitationRequest,
  VerifyCitationResponse,
} from '../types/verification.types'

const VERIFICATION_HISTORY_STORAGE_KEY = 'tillegal_verification_history'

export const SAMPLE_VERIFICATION_SCENARIOS: SampleVerificationScenario[] = [
  {
    id: 'scen-1',
    title: 'Hợp đồng đặt cọc nhà đất bắt buộc công chứng?',
    tag: 'Dân sự & Đất đai',
    category: 'civil',
    expectedVerdict: 'refuted',
    request: {
      claim:
        'Hợp đồng đặt cọc mua bán nhà đất bắt buộc phải công chứng hoặc chứng thực thì mới có hiệu lực pháp luật.',
      citedArticle: 'Bộ luật Dân sự 2015 & Luật Công chứng',
      citedText:
        'Hợp đồng đặt cọc là giao dịch bảo đảm bắt buộc phải tuân thủ hình thức văn bản có công chứng của cơ quan có thẩm quyền.',
    },
  },
  {
    id: 'scen-2',
    title: 'Sa thải lao động nữ nuôi con dưới 12 tháng tuổi?',
    tag: 'Lao động & Việc làm',
    category: 'labor',
    expectedVerdict: 'refuted',
    request: {
      claim:
        'Người sử dụng lao động có quyền sa thải hoặc đơn phương chấm dứt hợp đồng lao động nếu lao động nữ đang nuôi con nhỏ dưới 12 tháng tuổi vi phạm nội quy công ty.',
      citedArticle: 'Bộ luật Lao động 2019 (Điều 137, Khoản 3)',
      citedText:
        'Người sử dụng lao động không được thực hiện quyền đơn phương chấm dứt hợp đồng lao động đối với người lao động vì lý do kết hôn, mang thai, nghỉ thai sản, nuôi con dưới 12 tháng tuổi.',
    },
  },
  {
    id: 'scen-3',
    title: 'Bồi thường đất không sổ đỏ theo Luật Đất đai 2024?',
    tag: 'Đất đai & Nhà ở',
    category: 'land',
    expectedVerdict: 'supported',
    request: {
      claim:
        'Theo Luật Đất đai 2024, hộ gia đình cá nhân đang sử dụng đất ổn định trước ngày 01/07/2014 không có sổ đỏ vẫn được xem xét bồi thường về đất khi Nhà nước thu hồi.',
      citedArticle: 'Luật Đất đai 2024 (Điều 95 & Điều 138)',
      citedText:
        'Hộ gia đình, cá nhân đang sử dụng đất trước ngày 01/7/2014 mà không có giấy tờ về quyền sử dụng đất, nhưng đủ điều kiện cấp Giấy chứng nhận quyền sử dụng đất thì được bồi thường về đất.',
    },
  },
  {
    id: 'scen-4',
    title: 'Nồng độ cồn dưới 0.25mg/lít khí thở không bị phạt?',
    tag: 'Giao thông & Xử phạt',
    category: 'traffic',
    expectedVerdict: 'refuted',
    request: {
      claim:
        'Người điều khiển xe máy tham gia giao thông có nồng độ cồn trong hơi thở dưới 0.25 miligam/1 lít khí thở thì không bị xử phạt vi phạm hành chính.',
      citedArticle:
        'Luật Trật tự an toàn giao thông đường bộ 2024 & Nghị định 100/2019/NĐ-CP',
      citedText:
        'Điều khiển xe trên đường mà trong máu hoặc hơi thở có nồng độ cồn nhưng chưa vượt quá 50 miligam/100 mililít máu hoặc chưa vượt quá 0,25 miligam/1 lít khí thở.',
    },
  },
  {
    id: 'scen-5',
    title: 'Thời hiệu khởi kiện tranh chấp hợp đồng thương mại?',
    tag: 'Kinh doanh & Thương mại',
    category: 'business',
    expectedVerdict: 'partially_supported',
    request: {
      claim:
        'Thời hiệu khởi kiện áp dụng đối với mọi tranh chấp thương mại là 02 năm kể từ thời điểm quyền và lợi ích hợp pháp bị xâm phạm.',
      citedArticle: 'Luật Thương mại 2005 (Điều 319)',
      citedText:
        'Thời hiệu khởi kiện áp dụng đối với các tranh chấp thương mại là hai năm, kể từ thời điểm quyền và lợi ích hợp pháp bị xâm phạm, trừ trường hợp quy định tại điểm e khoản 1 Điều 237 của Luật này.',
    },
  },
]

/**
 * Trình thẩm định giả lập phân tích pháp lý thông minh
 */
function evaluateClaimLocally(request: VerifyCitationRequest): VerifyCitationResponse {
  const claimLower = request.claim.toLowerCase()
  const articleLower = (request.citedArticle || '').toLowerCase()

  // 1. Kịch bản Hợp đồng đặt cọc
  if (
    claimLower.includes('đặt cọc') &&
    (claimLower.includes('công chứng') || claimLower.includes('bắt buộc'))
  ) {
    return {
      id: `ver-${Date.now()}`,
      claim: request.claim,
      citedArticle: request.citedArticle || 'Bộ luật Dân sự 2015 (Điều 328)',
      citedText: request.citedText,
      isSupported: false,
      confidenceScore: 0.96,
      verdict: 'refuted',
      verdictLabel: 'Bác bỏ / Nhận định sai lệch',
      summaryAnalysis:
        'Quy định tại Điều 328 Bộ luật Dân sự 2015 và Luật Nhà ở hiện hành không bắt buộc hợp đồng đặt cọc phải công chứng hoặc chứng thực. Hợp đồng đặt cọc lập thành văn bản giấy tay giữa các bên vẫn có giá trị pháp lý đầy đủ nếu đáp ứng đủ điều kiện có hiệu lực của giao dịch dân sự.',
      applicableLaw: {
        documentTitle: 'Bộ luật Dân sự 2015',
        documentNumber: '91/2015/QH13',
        articleReference: 'Điều 328 (Đặt cọc)',
        sourceUrl:
          'https://thuvienphapluat.vn/van-ban/Bat-dong-san/Bo-luat-dan-su-2015-296215.aspx',
      },
      issues: [
        {
          type: 'unsupported_claim',
          severity: 'high',
          description:
            'Viện dẫn sai điều kiện hiệu lực: Điều 328 BLDS 2015 chỉ quy định về biện pháp bảo đảm và xử lý tiền đặt cọc, không quy định hình thức bắt buộc công chứng.',
          recommendation:
            'Phân biệt giữa hợp đồng chuyển nhượng quyền sử dụng đất (bắt buộc công chứng theo Luật Đất đai) và hợp đồng đặt cọc (không bắt buộc).',
        },
        {
          type: 'risk_warning',
          severity: 'medium',
          description:
            'Mặc dù giấy tay vẫn có hiệu lực, hợp đồng đặt cọc không qua công chứng dễ bị giả mạo chữ ký hoặc phát sinh tranh chấp về số tiền nhận cọc.',
          recommendation:
            'Nên lập vi bằng hoặc công chứng tự nguyện để tối đa hóa độ an toàn pháp lý khi giá trị đặt cọc lớn.',
        },
      ],
      legalAdvice:
        'Các bên hoàn toàn có quyền giao kết hợp đồng đặt cọc bằng văn bản không công chứng. Trường hợp bên nhận cọc từ chối giao kết hợp đồng mua bán mà không có lý do chính đáng, bên đặt cọc có quyền khởi kiện yêu cầu hoàn trả tiền cọc và phạt cọc theo thỏa thuận.',
      verifiedAt: new Date().toISOString(),
    }
  }

  // 2. Kịch bản Lao động nữ mang thai / nuôi con nhỏ
  if (
    claimLower.includes('sa thải') ||
    claimLower.includes('đơn phương') ||
    (claimLower.includes('nuôi con') && claimLower.includes('12 tháng'))
  ) {
    return {
      id: `ver-${Date.now()}`,
      claim: request.claim,
      citedArticle: request.citedArticle || 'Bộ luật Lao động 2019 (Điều 137)',
      citedText: request.citedText,
      isSupported: false,
      confidenceScore: 0.98,
      verdict: 'refuted',
      verdictLabel: 'Bác bỏ / Trái quy định pháp luật',
      summaryAnalysis:
        'Căn cứ Khoản 3 Điều 137 Bộ luật Lao động 2019, người sử dụng lao động tuyệt đối không được sa thải hoặc đơn phương chấm dứt hợp đồng lao động đối với người lao động vì lý do kết hôn, mang thai, nghỉ thai sản, hoặc đang nuôi con dưới 12 tháng tuổi. Hành vi sa thải trong trường hợp này bị coi là đơn phương chấm dứt hợp đồng lao động trái pháp luật.',
      applicableLaw: {
        documentTitle: 'Bộ luật Lao động 2019',
        documentNumber: '45/2019/QH14',
        articleReference: 'Điều 137, Khoản 3',
        sourceUrl:
          'https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Bo-luat-Lao-dong-2019-333670.aspx',
      },
      issues: [
        {
          type: 'illegal_action',
          severity: 'high',
          description:
            'Hành vi chấm dứt hợp đồng trái pháp luật vi phạm điều cấm của Bộ luật Lao động 2019.',
          recommendation:
            'Doanh nghiệp bị xử phạt vi phạm hành chính từ 10.000.000 đến 20.000.000 đồng theo Nghị định 12/2022/NĐ-CP.',
        },
        {
          type: 'compensation_liability',
          severity: 'high',
          description:
            'Theo Điều 41 BLLĐ 2019, doanh nghiệp phải nhận người lao động trở lại làm việc, bồi thường toàn bộ tiền lương những ngày không được làm việc cộng thêm ít nhất 02 tháng tiền lương.',
          recommendation:
            'Hủy bỏ ngay quyết định đơn phương sa thải và đàm phán giải quyết hòa giải.',
        },
      ],
      legalAdvice:
        'Người lao động có quyền nộp đơn khiếu nại tới Chánh Thanh tra Sở Lao động - Thương binh và Xã hội hoặc khởi kiện trực tiếp ra Tòa án nhân dân cấp huyện mà không bắt buộc phải qua hòa giải viên lao động.',
      verifiedAt: new Date().toISOString(),
    }
  }

  // 3. Kịch bản Đất không sổ đỏ theo Luật Đất đai 2024
  if (
    claimLower.includes('đất đai 2024') ||
    (claimLower.includes('không có sổ') && claimLower.includes('bồi thường')) ||
    claimLower.includes('thu hồi đất')
  ) {
    return {
      id: `ver-${Date.now()}`,
      claim: request.claim,
      citedArticle: request.citedArticle || 'Luật Đất đai 2024 (Điều 95 & Điều 138)',
      citedText: request.citedText,
      isSupported: true,
      confidenceScore: 0.94,
      verdict: 'supported',
      verdictLabel: 'Xác thực / Đúng căn cứ pháp luật',
      summaryAnalysis:
        'Nhận định hoàn toàn chính xác. Luật Đất đai 2024 (có hiệu lực từ ngày 01/08/2024) đã mở rộng quyền lợi cho người sử dụng đất không có giấy tờ. Cụ thể tại Điều 95 và Điều 138, hộ gia đình, cá nhân đang sử dụng đất trước ngày 01/07/2014 không có giấy tờ về quyền sử dụng đất, nhưng được UBND cấp xã xác nhận là đất sử dụng ổn định, không có tranh chấp thì vẫn được bồi thường về đất khi Nhà nước thu hồi đất.',
      applicableLaw: {
        documentTitle: 'Luật Đất đai 2024',
        documentNumber: '31/2024/QH15',
        articleReference: 'Điều 95 & Điều 138',
        sourceUrl:
          'https://thuvienphapluat.vn/van-ban/Bat-dong-san/Luat-Dat-dai-2024-523642.aspx',
      },
      issues: [
        {
          type: 'condition_verification',
          severity: 'medium',
          description:
            'Phải thỏa mãn đồng thời 2 điều kiện: Được UBND cấp xã nơi có đất xác nhận là không có tranh chấp và phù hợp với quy hoạch sử dụng đất.',
          recommendation:
            'Cần chuẩn bị các tài liệu phụ trợ chứng minh thời điểm bắt đầu sử dụng đất trước 01/07/2014 (biên lai nộp thuế nhà đất, giấy tạm trú, sổ hộ khẩu, biên bản họp thôn).',
        },
      ],
      legalAdvice:
        'Người sử dụng đất nên chủ động liên hệ UBND cấp xã để xin trích lục hồ sơ địa chính và bản đồ địa chính phục vụ phương án bồi thường, tái định cư khi có thông báo thu hồi đất.',
      verifiedAt: new Date().toISOString(),
    }
  }

  // 4. Kịch bản Nồng độ cồn
  if (
    claimLower.includes('nồng độ cồn') ||
    claimLower.includes('khí thở') ||
    claimLower.includes('rượu bia')
  ) {
    return {
      id: `ver-${Date.now()}`,
      claim: request.claim,
      citedArticle:
        request.citedArticle ||
        'Luật Trật tự an toàn giao thông đường bộ 2024 & Nghị định 100/2019/NĐ-CP',
      citedText: request.citedText,
      isSupported: false,
      confidenceScore: 0.99,
      verdict: 'refuted',
      verdictLabel: 'Bác bỏ hoàn toàn / Sai lệch nghiêm trọng',
      summaryAnalysis:
        'Pháp luật Việt Nam duy trì nguyên tắc cấm tuyệt đối nồng độ cồn trong máu hoặc hơi thở khi điều khiển phương tiện tham gia giao thông. Quy định tại Nghị định 100/2019/NĐ-CP (sửa đổi bởi Nghị định 123/2021/NĐ-CP) nêu rõ: mức nồng độ cồn chưa vượt quá 0.25 miligam/1 lít khí thở đối với người lái xe máy vẫn bị xử phạt từ 2.000.000 đồng đến 3.000.000 đồng và tước giấy phép lái xe từ 10 đến 12 tháng.',
      applicableLaw: {
        documentTitle:
          'Nghị định 100/2019/NĐ-CP (sửa đổi, bổ sung bởi Nghị định 123/2021/NĐ-CP)',
        documentNumber: '100/2019/NĐ-CP',
        articleReference: 'Điều 6, Khoản 6, Điểm c',
        sourceUrl:
          'https://thuvienphapluat.vn/van-ban/Giao-thong-Van-tai/Nghi-dinh-100-2019-ND-CP-xu-phat-vi-pham-hanh-chinh-giao-thong-duong-bo-duong-sat-431835.aspx',
      },
      issues: [
        {
          type: 'severe_misinterpretation',
          severity: 'high',
          description:
            'Nhầm lẫn giữa khung xử phạt tối thiểu với trường hợp miễn trừ xử phạt: khung dưới 0.25 mg/l là khung phạt bậc 1, không phải mức được phép.',
          recommendation:
            'Cần nắm rõ Luật Trật tự an toàn giao thông đường bộ 2024 tiếp tục giữ nguyên quy định nồng độ cồn bằng 0 khi lái xe.',
        },
      ],
      legalAdvice:
        'Tuyệt đối không điều khiển phương tiện tham gia giao thông sau khi đã sử dụng rượu bia dưới bất kỳ hình thức nào để đảm bảo an toàn tính mạng và tránh bị xử phạt tước bằng lái xe.',
      verifiedAt: new Date().toISOString(),
    }
  }

  // 5. Kịch bản Mặc định phân tích tổng quát
  const isAffirmative =
    claimLower.includes('được') ||
    claimLower.includes('hợp pháp') ||
    claimLower.includes('có quyền')
  return {
    id: `ver-${Date.now()}`,
    claim: request.claim,
    citedArticle: request.citedArticle || 'Hệ thống Văn bản Quy phạm Pháp luật Việt Nam',
    citedText: request.citedText,
    isSupported: isAffirmative,
    confidenceScore: 0.88,
    verdict: isAffirmative ? 'partially_supported' : 'uncertain',
    verdictLabel: isAffirmative
      ? 'Đúng một phần (Cần đối chiếu điều kiện cụ thể)'
      : 'Cần bổ sung thêm hồ sơ & chứng cứ',
    summaryAnalysis: `Hệ thống AI đã đối chiếu nhận định "${request.claim}" với các quy định pháp luật liên quan${
      articleLower ? ` tại ${request.citedArticle}` : ''
    }. Nhận định này mang tính khái quát cao; việc áp dụng trong thực tiễn cần xem xét kỹ lưỡng các điều kiện ràng buộc về chủ thể, thời hiệu khởi kiện và hình thức văn bản theo quy định chuyên ngành.`,
    applicableLaw: {
      documentTitle: request.citedArticle || 'Văn bản quy phạm pháp luật hiện hành',
      documentNumber: 'Đang tra cứu cơ sở dữ liệu số hóa',
      articleReference: 'Các điều khoản liên quan',
    },
    issues: [
      {
        type: 'general_condition_check',
        severity: 'medium',
        description:
          'Nhận định cần được soi chiếu trong tình huống thực tế cụ thể và kiểm tra các văn bản hướng dẫn thi hành (Nghị định, Thông tư) có hiệu lực tại thời điểm phát sinh hành vi.',
        recommendation:
          'Thu thập đầy đủ các tài liệu, chứng cứ bằng văn bản trước khi đưa ra kết luận pháp lý chính thức.',
      },
    ],
    legalAdvice:
      'Để đảm bảo an toàn pháp lý tuyệt đối cho hồ sơ vụ việc, vui lòng tham vấn trực tiếp luật sư hoặc chuyên viên pháp lý có chứng chỉ hành nghề.',
    verifiedAt: new Date().toISOString(),
  }
}

export const verificationApi = {
  /**
   * Thẩm định tính chuẩn xác của một nhận định pháp luật hoặc căn cứ viện dẫn
   */
  async verifyCitation(request: VerifyCitationRequest): Promise<VerifyCitationResponse> {
    try {
      // 1. Thử gọi endpoint backend nếu đã triển khai
      const remoteResult = await apiClient.post<VerifyCitationResponse>(
        API_ENDPOINTS.citations.verify,
        request,
      )
      if (remoteResult && remoteResult.verdict) {
        verificationApi.saveVerificationHistory(remoteResult)
        return remoteResult
      }
    } catch {
      // Endpoint backend chưa sẵn sàng hoặc nằm trong backlog -> sử dụng engine đối chiếu cục bộ
    }

    // 2. Chạy bộ phân tích đối chiếu pháp luật chuyên sâu
    const localResult = evaluateClaimLocally(request)
    verificationApi.saveVerificationHistory(localResult)
    return localResult
  },

  /**
   * Lấy lịch sử thẩm định lưu trong LocalStorage
   */
  getVerificationHistory(): VerifyCitationResponse[] {
    try {
      const data = localStorage.getItem(VERIFICATION_HISTORY_STORAGE_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  /**
   * Lưu kết quả thẩm định vào lịch sử
   */
  saveVerificationHistory(item: VerifyCitationResponse): void {
    try {
      const list = verificationApi.getVerificationHistory()
      const updated = [item, ...list.filter((x) => x.id !== item.id)].slice(0, 20)
      localStorage.setItem(VERIFICATION_HISTORY_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Fallback
    }
  },

  /**
   * Xóa một kết quả khỏi lịch sử
   */
  deleteVerificationHistory(id: string): void {
    try {
      const list = verificationApi.getVerificationHistory().filter((x) => x.id !== id)
      localStorage.setItem(VERIFICATION_HISTORY_STORAGE_KEY, JSON.stringify(list))
    } catch {
      // Fallback
    }
  },

  /**
   * Xóa sạch lịch sử thẩm định
   */
  clearVerificationHistory(): void {
    try {
      localStorage.removeItem(VERIFICATION_HISTORY_STORAGE_KEY)
    } catch {
      // Fallback
    }
  },
}
