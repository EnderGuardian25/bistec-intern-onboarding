import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    ticket: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { GET } from '@/app/api/tickets/route'
import { PATCH } from '@/app/api/tickets/[id]/route'

const mockTickets = [
  {
    id: 1,
    title: 'Production API returning 500',
    priority: 'P0',
    owner: 'Damian',
    status: 'open',
    createdAt: new Date(),
  },
  {
    id: 2,
    title: 'Slow API response times',
    priority: 'P1',
    owner: null,
    status: 'open',
    createdAt: new Date(),
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/tickets', () => {
  it('returns an array of tickets with correct shape', async () => {
    vi.mocked(db.ticket.findMany).mockResolvedValue(mockTickets)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
    expect(data[0]).toHaveProperty('id')
    expect(data[0]).toHaveProperty('title')
    expect(data[0]).toHaveProperty('priority')
    expect(data[0]).toHaveProperty('owner')
    expect(data[0]).toHaveProperty('status')
  })
})

describe('PATCH /api/tickets/:id', () => {
  it('returns the updated ticket on valid input', async () => {
    const updated = { ...mockTickets[0], priority: 'P1' }
    vi.mocked(db.ticket.update).mockResolvedValue(updated)

    const request = new NextRequest('http://localhost:3000/api/tickets/1', {
      method: 'PATCH',
      body: JSON.stringify({ priority: 'P1' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '1' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.priority).toBe('P1')
  })

  it('returns 422 on invalid priority value', async () => {
    const request = new NextRequest('http://localhost:3000/api/tickets/1', {
      method: 'PATCH',
      body: JSON.stringify({ priority: 'P9' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '1' }),
    })
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data).toHaveProperty('errors')
  })

  it('returns 422 when body is empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/tickets/1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '1' }),
    })

    expect(response.status).toBe(422)
  })
})
