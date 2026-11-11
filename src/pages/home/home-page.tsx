import {
  ArrowRight,
  Bot,
  FileCheck2,
  FileText,
  HelpCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const sampleScenarios = [
    {
      id: 'q1',
      title: t('home.samples.q1'),
      tag: 'Đất đai & Thừa kế',
      query: 'Thủ tục sang tên Giấy chứng nhận quyền sử dụng đất khi nhận thừa kế',
    },
    {
      id: 'q2',
      title: t('home.samples.q2'),
      tag: 'Lao động',
      query: 'Công ty đơn phương chấm dứt hợp đồng lao động trái pháp luật xử lý thế nào',
    },
    {
      id: 'q3',
      title: t('home.samples.q3'),
      tag: 'Kinh doanh & Thương mại',
      query: 'Thời hiệu khởi kiện tranh chấp hợp đồng kinh tế theo Luật Thương mại',
    },
  ]

  const handleScenarioClick = (query: string) => {
    navigate(`/chat?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="relative overflow-hidden pb-16">
      {/* Background Glow Accents */}
      <div className="from-primary/10 via-brand-500/10 pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr to-transparent blur-3xl" />

      {/* Hero Section */}
      <section className="container mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
        <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium shadow-xs backdrop-blur-xs">
          <Sparkles className="size-3.5" />
          <span>{t('home.badge')}</span>
        </div>

        <h1 className="text-foreground mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          {t('home.title')}
        </h1>

        <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-base leading-relaxed sm:text-lg">
          {t('home.subtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link to="/chat">
            <Button size="lg" className="h-11 gap-2 px-6 font-semibold shadow-md">
              <Bot className="size-4" />
              {t('home.ctaChat')}
              <ArrowRight className="size-4" />
            </Button>
          </Link>

          <Link to="/verify">
            <Button size="lg" variant="outline" className="h-11 gap-2 px-6">
              <FileCheck2 className="size-4" />
              {t('home.ctaVerify')}
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('home.trust.t1')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="size-4 text-blue-600 dark:text-blue-400" />
            <span>{t('home.trust.t2')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="size-4 text-purple-600 dark:text-purple-400" />
            <span>{t('home.trust.t3')}</span>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="container mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('home.features.title')}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {t('home.features.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/80 bg-card/60 backdrop-blur-xs transition-all hover:shadow-md">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                <Bot className="size-5" />
              </div>
              <CardTitle className="text-lg">{t('home.features.f1Title')}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {t('home.features.f1Desc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 bg-card/60 backdrop-blur-xs transition-all hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="text-lg">{t('home.features.f2Title')}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {t('home.features.f2Desc')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/80 bg-card/60 backdrop-blur-xs transition-all hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users2 className="size-5" />
              </div>
              <CardTitle className="text-lg">{t('home.features.f3Title')}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {t('home.features.f3Desc')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Sample Scenarios */}
      <section className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="border-border/80 bg-muted/40 rounded-2xl border p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {t('home.samples.title')}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {t('home.samples.subtitle')}
              </p>
            </div>
            <Link to="/chat">
              <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
                {t('home.samples.viewAll')}
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {sampleScenarios.map((s) => (
              <Card
                key={s.id}
                onClick={() => handleScenarioClick(s.query)}
                className="group border-border/60 bg-background hover:border-primary/40 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xs"
              >
                <CardContent className="flex h-full flex-col justify-between p-4">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px] font-normal">
                      {s.tag}
                    </Badge>
                    <p className="group-hover:text-primary text-xs leading-snug font-medium transition-colors">
                      {s.title}
                    </p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary mt-3 flex items-center gap-1 text-[11px]">
                    <HelpCircle className="size-3" />
                    <span>{t('home.samples.tryNow')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
