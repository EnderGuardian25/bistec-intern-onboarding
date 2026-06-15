import { db } from '@/lib/db'
import TicketRow from './TicketRow'

type Priority = 'P0' | 'P1' | 'P2'

const PRIORITY_LABELS: Record<Priority, string> = {
  P0: 'P0 — Critical',
  P1: 'P1 — High',
  P2: 'P2 — Normal',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  P0: 'bg-red-50 border-red-200',
  P1: 'bg-orange-50 border-orange-200',
  P2: 'bg-blue-50 border-blue-200',
}

const BADGE_COLORS: Record<Priority, string> = {
  P0: 'bg-red-500 text-white',
  P1: 'bg-orange-400 text-white',
  P2: 'bg-blue-500 text-white',
}

export default async function TicketsPage() {
  const tickets = await db.ticket.findMany({
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })

  const grouped = (['P0', 'P1', 'P2'] as Priority[]).reduce<
    Record<Priority, typeof tickets>
  >((acc, p) => {
    acc[p] = tickets.filter((t) => t.priority === p)
    return acc
  }, { P0: [], P1: [], P2: [] })

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Ticket Triage Dashboard
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {tickets.length} open ticket{tickets.length !== 1 ? 's' : ''}
      </p>

      {(['P0', 'P1', 'P2'] as Priority[]).map((priority) => (
        <section
          key={priority}
          className={`mb-6 rounded-lg border p-4 ${PRIORITY_COLORS[priority]}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${BADGE_COLORS[priority]}`}
            >
              {priority}
            </span>
            <h2 className="text-sm font-semibold text-gray-700">
              {PRIORITY_LABELS[priority]}
            </h2>
            <span className="ml-auto text-xs font-bold text-gray-500 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
              {grouped[priority].length}
            </span>
          </div>

          <div className="space-y-2">
            {grouped[priority].length === 0 ? (
              <p className="text-sm text-gray-400 italic px-1">No tickets</p>
            ) : (
              grouped[priority].map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))
            )}
          </div>
        </section>
      ))}
    </main>
  )
}
