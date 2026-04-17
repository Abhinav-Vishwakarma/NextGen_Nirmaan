import type { JSX } from 'react'
import { Card } from '@/components/ui'

export default function DashboardPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Card title="Dashboard" description="Protected route starter page.">
        <p className="text-sm text-slate-600">Add feature widgets here.</p>
      </Card>
    </main>
  )
}
