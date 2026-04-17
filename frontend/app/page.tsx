
import { Button, Card, Table } from '@/components/ui'
import type { JSX } from 'react'

type ProjectRow = {
  name: string
  status: string
  owner: string
}

const rows: ProjectRow[] = [
  { name: 'Road Asset Mapping', status: 'In Progress', owner: 'Infra Team' },
  { name: 'AI Compliance Review', status: 'Pending', owner: 'Policy Team' },
  { name: 'Permit Workflow', status: 'Completed', owner: 'Ops Team' },
]

export default function Home(): JSX.Element {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">NextGen Nirmaan</h1>
        <p className="text-sm text-slate-600">
          Starter component library and folder structure are now scaffolded.
        </p>
      </section>

      <Card
        title="Generic Buttons"
        description="Primary actions, secondary actions, and a loading state out of the box."
        footer={<p className="text-xs text-slate-500">components/ui/Button</p>}
      >
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button isLoading>Loading</Button>
        </div>
      </Card>

      <Card
        title="Generic Table"
        description="Typed column definitions with custom rendering support."
        footer={<p className="text-xs text-slate-500">components/ui/Table</p>}
      >
        <Table<ProjectRow>
          columns={[
            { key: 'name', header: 'Project' },
            {
              key: 'status',
              header: 'Status',
              cell: (row) => (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {row.status}
                </span>
              ),
            },
            { key: 'owner', header: 'Owner' },
          ]}
          data={rows}
        />
      </Card>
    </main>
  )
}
