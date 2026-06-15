import { z } from 'zod'

export const PrioritySchema = z.enum(['P0', 'P1', 'P2'])

export const UpdateTicketSchema = z
  .object({
    priority: PrioritySchema.optional(),
    owner: z.string().min(1).optional(),
  })
  .refine((data) => data.priority !== undefined || data.owner !== undefined, {
    message: 'At least one field (priority or owner) must be provided',
  })

export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>

export const TicketSchema = z.object({
  id: z.number(),
  title: z.string(),
  priority: PrioritySchema,
  owner: z.string().nullable(),
  status: z.string(),
  createdAt: z.date(),
})

export type Ticket = z.infer<typeof TicketSchema>
