'use client'

import { useState } from 'react'

type Priority = 'P0' | 'P1' | 'P2'

interface Ticket {
  id: number
  title: string
  priority: string
  owner: string | null
  status: string
}

interface TicketRowProps {
  ticket: Ticket
}

const PRIORITY_BADGE: Record<Priority, string> = {
  P0: 'bg-red-500 text-white',
  P1: 'bg-orange-400 text-white',
  P2: 'bg-blue-500 text-white',
}

export default function TicketRow({ ticket }: TicketRowProps) {
  const [priority, setPriority] = useState<Priority>(ticket.priority as Priority)
  const [owner, setOwner] = useState(ticket.owner ?? '')
  const [saving, setSaving] = useState(false)

  async function updateTicket(patch: { priority?: Priority; owner?: string }) {
    setSaving(true)
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Priority
    setPriority(next)
    await updateTicket({ priority: next })
  }

  async function handleOwnerBlur() {
    if (owner !== (ticket.owner ?? '')) {
      await updateTicket({ owner: owner || undefined })
    }
  }

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-md px-3 py-2 shadow-sm transition-opacity ${
        saving ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <span className="text-xs text-gray-400 w-8 shrink-0">#{ticket.id}</span>
      <span className="flex-1 text-sm text-gray-800 truncate">{ticket.title}</span>
      <select
        value={priority}
        onChange={handlePriorityChange}
        className={`text-xs font-semibold rounded px-2 py-1 border-0 cursor-pointer shrink-0 ${PRIORITY_BADGE[priority]}`}
      >
        <option value="P0">P0</option>
        <option value="P1">P1</option>
        <option value="P2">P2</option>
      </select>
      <input
        type="text"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        onBlur={handleOwnerBlur}
        placeholder="Unassigned"
        className="text-sm text-gray-600 border border-gray-200 rounded px-2 py-1 w-32 shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <span className="text-xs text-gray-400 shrink-0">{ticket.status}</span>
    </div>
  )
}
