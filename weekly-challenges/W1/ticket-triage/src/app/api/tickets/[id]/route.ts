import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { db } from '@/lib/db'
import { UpdateTicketSchema } from '@/lib/validators/ticket'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticketId = parseInt(id, 10)

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 })
    }

    const body: unknown = await request.json()
    const data = UpdateTicketSchema.parse(body)

    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data,
    })

    return NextResponse.json(ticket)
  } catch (e: unknown) {
    if (e instanceof ZodError) {
      return NextResponse.json({ errors: e.errors }, { status: 422 })
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  }
}
