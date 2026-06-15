import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const tickets = await db.ticket.findMany({
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(tickets)
}
