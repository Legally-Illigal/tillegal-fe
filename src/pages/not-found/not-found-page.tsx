import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="bg-muted text-muted-foreground mb-4 flex size-16 items-center justify-center rounded-2xl shadow-xs">
        <FileQuestion className="size-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t('common.notFound')}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">{t('common.notFoundDesc')}</p>
      <div className="mt-6">
        <Link to="/">
          <Button className="gap-2">
            <ArrowLeft className="size-4" />
            {t('common.backHome')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
